// Headless, COLD-session benchmark runner — 2–3 stores per vendor.
//
// For every STORE and each mode it:
//   1. opens a FRESH browser context (isolated storage = genuinely cold session,
//      no warm carryover — the thing live Chrome can't give us)
//   2. opens the chat widget
//   3. sends each turn of the standardized pool (NO turn asks for a human)
//   4. times each reply at the browser level (transcript grows + stabilizes)
//   5. flags any unprompted handover to a human (incl. "agent joined", transfer,
//      email-gate, FR phrasings) = the failure we measure
//   6. writes results/<date>/<store>-<mode>.json + a summary.json with
//      per-store and per-vendor latency + success rate (% turns, no handover)
//
// Usage:
//   node run.js                          # all stores, both modes
//   node run.js --store gorgias-madura   # one store
//   node run.js --vendor Sierra          # all stores of a vendor
//   node run.js --mode shopping
//   node run.js --skip-candidates        # only verified stores
//
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { WIDGETS, STORES, readTranscript } from "./vendors.js";
import { SUPPORT, SHOPPING } from "./pools.js";

const POLL_MS = 250, STABLE_MS = 4000, TURN_TIMEOUT_MS = 60000, GROWTH = 60, SETTLE_MS = 2500;

// Unprompted handover = the assistant bailed to a human on its own (failure).
const HANDOVER_PATTERNS = [
  /\bconnect you (with|to)\b/i, /\bi('|’)?ll connect you\b/i,
  /\btransfer(ring)? you (to|over)\b/i, /\btransf[eè]re(r|z)?\b.*(humain|conseiller|agent|ticket|demande)/i,
  /\bspeak (to|with) (a|an|our|one of our) (human|agent|team|representative|specialist|advisor)/i,
  /\b(submit|raise|create|open|log) a (support )?ticket\b/i,
  /\bour (team|agents?|support team) (will|can) (get back|follow up|reach out|be in touch|contact|assist)/i,
  /\ba (member|representative) of our team\b/i, /\bconseiller humain\b/i,
  /\b(fill (in|out)|complete) (the|this|a) form\b/i, /\benter your details\b/i,
  /\bshare (your|a few) (details|email|order number)\b.*(team|agent|connect|assist|follow)/i,
  /\b(joined|entered) the (chat|conversation)\b/i, /\ba rejoint (la )?(conversation|discussion|chat)\b/i,
  /\b\w+ (says|dit)\s*:/i, /\blaissez(\-| )?(nous|moi)?\s*(votre)?\s*(e-?mail|adresse)/i,
  /\b(leave|enter) (your|us) (e-?mail|email address)\b/i,
  /\ball of our agents are (unavailable|busy)\b/i,
];
function detectHandover(text, extra = []) {
  if (!text) return null;
  for (const re of [...HANDOVER_PATTERNS, ...extra]) { const m = text.match(re); if (m) return m[0].trim().slice(0, 80); }
  return null;
}

const args = process.argv.slice(2);
const pick = (flag) => { const i = args.indexOf(flag); if (i < 0) return null; const out = []; for (let j = i + 1; j < args.length && !args[j].startsWith("--"); j++) out.push(args[j]); return out; };
const storeFilter = pick("--store");
const vendorFilter = pick("--vendor");
const modeFilter = pick("--mode");
const skipCandidates = args.includes("--skip-candidates");
const MODES = (modeFilter || ["shopping", "support"]);
const STAMP = (process.env.RUN_DATE || new Date().toISOString().slice(0, 10));

let targets = STORES.filter(s => s.url);
if (storeFilter) targets = targets.filter(s => storeFilter.includes(s.key));
if (vendorFilter) targets = targets.filter(s => vendorFilter.map(x => x.toLowerCase()).includes(s.vendor.toLowerCase()));
if (skipCandidates) targets = targets.filter(s => !s.candidate);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function timeTurn(page, scope, sendFn) {
  const before = (await readTranscript(page, scope)).len;
  const t0 = Date.now();
  await sendFn();
  let lastLen = before, lastChange = t0, ttft = null, grown = false, complete = null;
  const deadline = t0 + TURN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    const { len } = await readTranscript(page, scope);
    if (len > before + GROWTH) { grown = true; if (ttft == null) ttft = Date.now() - t0; if (len !== lastLen) lastChange = Date.now(); }
    lastLen = len;
    if (grown && Date.now() - lastChange > STABLE_MS) { complete = lastChange - t0; break; }
  }
  return { ttft_ms: ttft, complete_ms: complete, grew: lastLen - before };
}

async function runStoreMode(browser, store, mode) {
  const w = WIDGETS[store.widget];
  const pool = mode === "support" ? SUPPORT : SHOPPING;
  const out = { key: store.key, vendor: store.vendor, store: store.store, url: store.url, us: !!store.us, widget: store.widget, mode, date: STAMP, turns: [] };
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: store.locale || "en-US" });
  const page = await context.newPage();
  try {
    await page.goto(store.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await w.open(page);
    for (let i = 0; i < pool.length; i++) {
      const q = pool[i];
      let r;
      try { r = await timeTurn(page, w.scope, () => w.send(page, q)); }
      catch (e) { r = { ttft_ms: null, complete_ms: null, error: String(e).slice(0, 120) }; }
      const tail = (await readTranscript(page, w.scope)).text.slice(-700);
      const handover = detectHandover(tail, w.handover);
      out.turns.push({ turn: i + 1, q, ...r, handover: !!handover, handover_hit: handover, replyTail: tail.slice(-300) });
      console.log(`  [${store.key}/${mode}] T${i + 1} ${r.complete_ms ?? "—"}ms${handover ? "  ⛔ HANDOVER: " + handover : ""}`);
      await sleep(SETTLE_MS);
    }
  } catch (e) {
    out.error = String(e).slice(0, 200);
    console.log(`  [${store.key}/${mode}] FAILED: ${out.error}`);
  } finally { await context.close(); }

  const valid = out.turns.map(t => t.complete_ms).filter(x => x != null);
  const firstHandover = out.turns.find(t => t.handover);
  const answered = out.turns.filter(t => t.complete_ms != null && !t.handover).length;
  out.stats = {
    turns: out.turns.length,
    answered_no_handover: answered,
    success_rate: out.turns.length ? Math.round((answered / out.turns.length) * 100) : null,
    avg_ms: valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null,
    min_ms: valid.length ? Math.min(...valid) : null,
    max_ms: valid.length ? Math.max(...valid) : null,
    handover_turn: firstHandover ? firstHandover.turn : null,
  };
  return out;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  await mkdir(`results/${STAMP}`, { recursive: true });
  const summary = [];
  for (const store of targets) {
    for (const mode of MODES) {
      console.log(`▶ ${store.vendor} · ${store.store} · ${mode}`);
      const res = await runStoreMode(browser, store, mode);
      await writeFile(`results/${STAMP}/${store.key}-${mode}.json`, JSON.stringify(res, null, 2));
      summary.push({ key: store.key, vendor: store.vendor, store: store.store, us: res.us, mode, ...res.stats, error: res.error || null });
      console.log(`  → success ${res.stats.success_rate ?? "n/a"}% · avg ${res.stats.avg_ms ?? "n/a"}ms${res.stats.handover_turn ? `  🚩 handover @T${res.stats.handover_turn}` : ""}\n`);
    }
  }
  await browser.close();

  // per-vendor rollup (one line per vendor per mode), matching the report's top table
  const byVendorMode = {};
  for (const s of summary) {
    const k = s.vendor + "|" + s.mode;
    (byVendorMode[k] = byVendorMode[k] || []).push(s);
  }
  const vendorRollup = Object.entries(byVendorMode).map(([k, arr]) => {
    const [vendor, mode] = k.split("|");
    const sr = arr.map(a => a.success_rate).filter(x => x != null);
    const la = arr.map(a => a.avg_ms).filter(x => x != null);
    return {
      vendor, mode, stores: arr.length,
      avg_success_rate: sr.length ? Math.round(sr.reduce((a, b) => a + b, 0) / sr.length) : null,
      avg_latency_ms: la.length ? Math.round(la.reduce((a, b) => a + b, 0) / la.length) : null,
    };
  });
  await writeFile(`results/${STAMP}/summary.json`, JSON.stringify({ date: STAMP, perStore: summary, perVendor: vendorRollup }, null, 2));
  console.log(`Done. Per-store + summary.json in results/${STAMP}/`);
})();

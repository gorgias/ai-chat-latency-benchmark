// Headless, cold-session benchmark runner.
//
// For every vendor and both modes (support, shopping) it:
//   1. opens a FRESH browser context (isolated storage = genuinely cold session)
//   2. opens the chat widget
//   3. sends each turn of the 10-question pool
//   4. times each reply at the browser level (transcript text grows + stabilizes)
//      — headless has no background-tab throttling, so timing is reliable at depth
//   5. writes results/<date>/<vendor>-<mode>.json
//
// Usage:
//   node run.js                 # all vendors, both modes
//   node run.js --vendor gorgias sierra
//   node run.js --mode shopping
//
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { VENDORS, readTranscript } from "./vendors.js";
import { SUPPORT, SHOPPING } from "./pools.js";

const POLL_MS = 250, STABLE_MS = 4000, TURN_TIMEOUT_MS = 60000, GROWTH = 40;

const args = process.argv.slice(2);
const pick = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args.slice(i + 1).filter(a => !a.startsWith("--")) : null; };
const vendorFilter = pick("--vendor");
const modeFilter = pick("--mode");
const MODES = (modeFilter || ["support", "shopping"]);
const VENDOR_KEYS = (vendorFilter || Object.keys(VENDORS));
const STAMP = new Date().toISOString().slice(0, 10);

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
  return { ttft_ms: ttft, complete_ms: complete };
}

async function runVendorMode(browser, key, mode) {
  const v = VENDORS[key];
  const pool = mode === "support" ? SUPPORT : (SHOPPING[key] || []);
  const out = { vendor: v.label, client: v.client, us: !!v.us, mode, date: STAMP, turns: [] };
  // fresh context per (vendor,mode) => cold session, no carryover from any prior run
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "en-US" });
  const page = await context.newPage();
  try {
    await page.goto(v.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await v.open(page);
    for (let i = 0; i < pool.length; i++) {
      const q = pool[i];
      let r;
      try { r = await timeTurn(page, v.scope, () => v.send(page, q)); }
      catch (e) { r = { ttft_ms: null, complete_ms: null, error: String(e).slice(0, 120) }; }
      const tail = (await readTranscript(page, v.scope)).text.slice(-400);
      out.turns.push({ turn: i + 1, q, ...r, replyTail: tail });
      console.log(`  [${v.label}/${mode}] T${i + 1} complete=${r.complete_ms ?? "—"}ms`);
      await sleep(2500);
    }
  } catch (e) {
    out.error = String(e).slice(0, 200);
    console.log(`  [${v.label}/${mode}] FAILED: ${out.error}`);
  } finally {
    await context.close();
  }
  const valid = out.turns.map(t => t.complete_ms).filter(x => x != null);
  out.stats = valid.length ? {
    n: valid.length, avg_ms: Math.round(valid.reduce((a, b) => a + b, 0) / valid.length),
    min_ms: Math.min(...valid), max_ms: Math.max(...valid),
  } : { n: 0 };
  return out;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  await mkdir(`results/${STAMP}`, { recursive: true });
  for (const key of VENDOR_KEYS) {
    if (!VENDORS[key]) { console.log(`unknown vendor: ${key}`); continue; }
    for (const mode of MODES) {
      console.log(`▶ ${VENDORS[key].label} · ${mode}`);
      const res = await runVendorMode(browser, key, mode);
      await writeFile(`results/${STAMP}/${key}-${mode}.json`, JSON.stringify(res, null, 2));
      console.log(`  → avg ${res.stats.avg_ms ?? "n/a"}ms over ${res.stats.n} turns\n`);
    }
  }
  await browser.close();
  console.log(`Done. Results in results/${STAMP}/`);
})();

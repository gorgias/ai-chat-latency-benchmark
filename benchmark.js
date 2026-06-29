/**
 * Siena Chat Latency Benchmark — Browser Runner
 *
 * HOW TO RUN:
 *   1. Open https://www.simplemodern.com/products/mesa-loop-30oz-49
 *   2. Wait for the page to fully load (Siena widget loads automatically)
 *   3. Open DevTools → Console on the PARENT page
 *   4. Paste this entire script and press Enter
 *   5. Results appear in the console and in window._benchResults
 *
 * WHAT IT MEASURES:
 *   t0 = postMessage("sendMessage") dispatched to Siena iframe
 *   t1 = new bot message detected in GET /v1/live_chat/message polling
 *   latency = t1 - t0  (end-to-end, as perceived by the user)
 */

(async function sienaBenchmark() {
  const instance = window.SienaLiveChatWidget?.getInstance?.();
  if (!instance) {
    console.error("Siena widget not found. Make sure you're on the Simple Modern page.");
    return;
  }

  const iframe = document.getElementById("SIENA_CHAT_IFRAME");
  if (!iframe) {
    console.error("Siena iframe not found. Open the chat widget first.");
    return;
  }

  // Extract live session state from the widget instance
  // (these are populated after the widget initializes)
  const getSession = () => {
    const inst = window.SienaLiveChatWidget.getInstance();
    return {
      sessionUuid: inst.currentSessionUuid,
      customerUuid: inst.persistedUserId || inst.currentUserId,
      appKey: inst.apiKeys?.token || inst.config?.APP_KEY,
      integrationUuid: inst.chatSettings?.uuid,
      orgUuid: inst.chatSettings?.organization_uuid,
    };
  };

  const buildHeaders = (sess) => ({
    "Content-Type": "application/json",
    "x-siena-app-key": sess.appKey,
    "x-siena-livechat-app-key": sess.appKey,
    "x-siena-organization-uuid": sess.orgUuid,
    "x-siena-livechat-integration-uuid": sess.integrationUuid,
    "x-siena-livechat-session-uuid": sess.sessionUuid,
    "x-siena-customer-uuid": sess.customerUuid,
    "x-siena-livechat-customer-uuid": sess.customerUuid,
  });

  const API_BASE      = "https://api-prod.siena.cx";
  const POLL_INTERVAL = 500;
  const POLL_TIMEOUT  = 30000;

  const MESSAGES = [
    "What colors does the Mesa Loop 30oz come in?",
    "Does it fit in a standard car cup holder?",
    "Is the straw removable and dishwasher safe?",
    "What is the difference between the 30oz and the 40oz?",
    "Do you offer free shipping on orders?",
    "How long does standard shipping usually take?",
    "Can I return it if I do not like the color?",
    "Is this bottle completely leak-proof when closed?",
    "Does it keep drinks cold for 24 hours?",
    "Is the Almond Birch color currently in stock?",
  ];

  // Ensure chat is open so the widget iframe is active
  window.SienaLaunchChat?.();
  await new Promise(r => setTimeout(r, 1500));

  const sess = getSession();
  console.log(`%c=== Siena Latency Benchmark — 10 turns ===`, "font-weight:bold;color:#0066cc");
  console.log(`Session: ${sess.sessionUuid}`);

  const results = [];

  for (let i = 0; i < MESSAGES.length; i++) {
    const msg = MESSAGES[i];
    const headers = buildHeaders(getSession());

    // Snapshot latest bot message before sending
    const r0 = await fetch(`${API_BASE}/v1/live_chat/message?page=1&page_size=5`, { headers });
    const d0 = await r0.json();
    const botMessages = d0.data.messages.filter(m => m.user?.uuid !== sess.customerUuid);
    const prevBotUuid = botMessages[0]?.uuid || null;

    // Fire the message
    const t0 = performance.now();
    iframe.contentWindow.postMessage({
      action: "sendMessage",
      message: msg,
      pre_generated_question_uuid: null,
      traceContext: { traceId: `bench-${i}`, sessionId: sess.sessionUuid, source: "parent_widget" },
    }, "*");

    // Poll until a NEW bot message appears
    let latency = null;
    const deadline = Date.now() + POLL_TIMEOUT;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL));
      const r1 = await fetch(`${API_BASE}/v1/live_chat/message?page=1&page_size=5`, { headers: buildHeaders(getSession()) });
      const d1 = await r1.json();
      const newBotMsgs = d1.data.messages.filter(m => m.user?.uuid !== sess.customerUuid);
      const latest = newBotMsgs[0];
      if (latest && latest.uuid !== prevBotUuid && latest.content) {
        latency = Math.round(performance.now() - t0);
        results.push({ turn: i + 1, message: msg, latency_ms: latency, response: latest.content.slice(0, 80) });
        console.log(`Turn ${i + 1}: %c${latency}ms`, "color:green;font-weight:bold", `| ${msg.slice(0, 50)}`);
        break;
      }
    }

    if (latency === null) {
      results.push({ turn: i + 1, message: msg, latency_ms: null, error: "timeout" });
      console.log(`Turn ${i + 1}: %cTIMEOUT`, "color:red;font-weight:bold", `| ${msg.slice(0, 50)}`);
    }

    // Pause between turns
    await new Promise(r => setTimeout(r, 1500));
  }

  // Summary
  const valid = results.filter(r => r.latency_ms !== null).map(r => r.latency_ms);
  const sorted = [...valid].sort((a, b) => a - b);
  const avg = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p90 = sorted[Math.floor(sorted.length * 0.9)];

  console.log(`%c\n=== RESULTS ===`, "font-weight:bold;color:#0066cc");
  console.table(results.map(r => ({
    Turn: r.turn,
    "Latency (ms)": r.latency_ms ?? "TIMEOUT",
    Question: r.message.slice(0, 50),
  })));
  console.log(`%cAverage: ${avg}ms | p50: ${p50}ms | p90: ${p90}ms | Min: ${sorted[0]}ms | Max: ${sorted[sorted.length - 1]}ms`,
    "font-weight:bold");

  window._benchResults = results;
  window._benchSummary = { avg_ms: avg, p50_ms: p50, p90_ms: p90, min_ms: sorted[0], max_ms: sorted[sorted.length - 1], n_valid: valid.length };

  return window._benchSummary;
})();

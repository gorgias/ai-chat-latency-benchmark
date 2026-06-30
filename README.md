# AI Chat Latency Benchmark — Siena · Sierra · Ada · Yuma

Live, reproducible latency tests of competitor on-site **AI shopping-assistant chat widgets**, measured end-to-end (message sent → full response rendered), plus recorded shopping conversations and product-recommendation feature observations.

**📊 [View the live report →](https://max-pruv.github.io/ai-chat-latency-benchmark/)**

Test date: 2026-06-29.

## Results at a glance

| Vendor | Customer tested | Native chat widget? | Avg latency (full response) | Notes |
|---|---|---|---|---|
| **Sierra** | Casper ("Luna") | ✅ inline shadow-DOM widget | **7.4 s** (min 4.6 / max 9.7), first byte ~0.4 s | Streams tokens; renders **interactive product cards with Add-to-Cart** in chat |
| **Siena** | Simple Modern ("Maddie") | ✅ iframe widget | **9.8 s** (min 7.0 / max 11.3) | Delivers the full message atomically; recommends linked product variants |
| **Ada** | Loop Earplugs | ✅ deployed (`static.ada.support`) | — | Bot backend returned *"experiencing technical difficulties"* across EU + US during the ~20-min test window |
| **Yuma** | Glossier, EvryJewels | ❌ none | n/a | No consumer chat surface — operates as a **back-end automation layer behind Gorgias Chat / Zendesk** |

### Two structural findings beyond raw latency
1. **Yuma has no front-end chat widget of its own.** On every Yuma reference customer checked, the on-site chat is *Gorgias Chat*; Yuma automates tickets behind the helpdesk rather than shipping a consumer chat product.
2. **Ada was deployed but unavailable.** Its bot would not initialize on the Loop storefront (both EU and US instances) throughout testing — an availability data point in itself.

## How latency was measured

Each widget was driven programmatically on the **live customer site**. The metric is wall-clock time from message sent to the full response being available.

- **Siena (Simple Modern)** — measured via the chat API: `POST /v1/live_chat/messages`, then poll `GET /v1/live_chat/message` until the bot reply appears. Siena delivers the answer in one shot.
- **Sierra (Casper)** — measured at the network layer by intercepting the streaming endpoint `sierra.chat/-/api/chat` (first-byte and stream-close timestamps). This is immune to background-tab timer throttling.

### Caveats
- Different customers / product domains (water bottles vs mattresses) — treat as **directional**, not a perfectly controlled head-to-head.
- Sierra ran on a warm (server-persisted) session with accumulated context, which tends to *slow* generation — its figures are conservative.
- Latency varies strongly by query type: simple FAQs (~4.6 s on Sierra) are far faster than product-recommendation queries that trigger retrieval (~9.7 s).
- Ada and Yuma could not be latency-tested for the reasons above; an Ada re-test is recommended once its backend recovers.

## Files

| File | What it is |
|---|---|
| [`index.html`](index.html) | Landing page |
| [`report.html`](report.html) | Combined competitor comparison report |
| [`results.html`](results.html) | Siena / Simple Modern detailed results page |
| [`benchmark.py`](benchmark.py) | Siena methodology, discovered endpoints & recorded latencies |
| [`benchmark.js`](benchmark.js) | Browser-console runner that reproduces the Siena test |
| [`data_sierra.json`](data_sierra.json) | Sierra (Casper) raw latency data + recorded answers |

## Reproducing

The runners drive each vendor's **own widget** on the live storefront — no mocking. The `appKey`/UUIDs referenced in `benchmark.py` are **public client-side identifiers** already readable in the storefront's page source (they are not secrets); they are included so the test is reproducible.

```bash
# Siena (Simple Modern): paste benchmark.js into the DevTools console on
# https://www.simplemodern.com/products/mesa-loop-30oz-49 with the chat open.

# Or summarize the recorded run:
python3 benchmark.py
```

## Cold sessions & reproducibility (important for the recurring run)

Each chat widget persists its conversation in its **own cross-origin storage** (`gorgias.chat`, `siena.cx`, `ada.support`, `chat.digitalgenius.com`, Zendesk). Consequences, verified 2026-06-30:

- Clearing the **parent page's** cookies + localStorage + sessionStorage + IndexedDB + caches does **not** reset these chats (the session lives in the widget's partitioned cross-origin storage).
- A browser-extension automation **cannot drive a true incognito window** (the incognito window isn't visible to it).
- Warm/re-used sessions slightly **inflate** latency — e.g. DigitalGenius next-day answer measured **12.7s cold vs 14.3s warm**.

**Practice:** test each vendor **cold-first** (one clean pass, no re-runs in the same window); use a widget's in-chat "new conversation" reset where offered; note residual warm-session caveats.

**Infra prerequisite for the monthly automated run:** spin up a **fresh browser profile / container per execution** (e.g. a new Playwright/Chromium `--user-data-dir`, or a throwaway container). That is the only reliable way to guarantee a cold session for *every* vendor, because it has zero storage for any origin — including the chat widgets'. DigitalGenius is the only vendor resettable from page scripts alone (its session is in the parent origin).

---

*Competitor intelligence. Latency numbers reflect a single test window on 2026-06-29 and will vary with load, query type, and session state.*

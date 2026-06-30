# Findings

Full results for both modes — latency, answer quality, latency-by-question-type, handover red flags — plus the strategic takeaways. Test windows: 2026-06-29/30.

> Cross-vendor numbers are **directional** (different stores/domains, single test windows, some warm sessions). Read alongside [METHODOLOGY.md](METHODOLOGY.md) and [VENDORS.md](VENDORS.md). Raw data: the repo's `data_*.json`.

## Shopping Assistant mode

Time to a real product recommendation, and recommendation quality (blind judges, 0–5; 0 = handed off / didn't recommend).

| Vendor | Latency | Rec quality | What it does |
|---|---|---|---|
| **Sierra** (Casper) | ~8.2s | **5.0** | Streams; renders interactive **Add-to-Cart product cards** |
| **Gorgias** *(us, Glamnetic)* | ~20.2s | **4.7** | Interactive Add-to-Cart cards + multi-item & **cross-category** recs (nails→lash→liner) |
| **Yuma** (EvryJewels) | ~13.8s | 2.7 | Text rec; only gestures at collections |
| **Siena** (Simple Modern) | ~10s | 1.0 | Defers to product pages instead of picking |
| **DigitalGenius** (Bloom & Wild) | 🚩 handover | 0 | "I'll connect you with our team" → no rec |
| **Meta AI** (Dermalogica) | 🚩 handover | 0 | Opens a lead-capture form → no rec |
| **Ada** (Loop) | — | — | Backend down |

**Read:** only **4 of 7** even attempt a product recommendation. Of those, Sierra (5.0) and Gorgias (us, 4.7) are top quality — Gorgias renders interactive Add-to-Cart cards and runs a genuine multi-turn discovery that crosses categories (press-on nails → matching magnetic lash → liner), but is **the slowest to produce a rec (~20s vs ~8s)**. Two vendors (DigitalGenius, Meta AI) **🚩 hand off to a human** rather than sell — a real capability limitation, not a fast result.

## Support mode

Time to a full answer on shipping/returns/policy, and answer quality (0–5).

| Vendor | Latency | Quality |
|---|---|---|
| **Sierra** | ~6.5s | **5.0** |
| **Meta AI** | ~5s | 3.5 |
| **Siena** | ~9.5s | 3.4 |
| **DigitalGenius** | ~10.2s | 4.3 |
| **Yuma** | ~13.5s | 4.4 |
| **Gorgias** *(us)* | ~19.2s | 4.2 |
| **Ada** | down | — |

**Read:** support is closer on *quality* across the field — table stakes. Sierra leads on both speed and quality. Gorgias (us) is **strong on quality (4.2)** — specific, accurate policy answers (14-day returns with the $8 fee, Canada customs/duties, discount-code troubleshooting, cruelty-free/vegan) — but on the **live Glamnetic store it is the slowest (~19s)** and **gates order-specific issues behind account login** (a reasonable security choice, but a thinner self-serve answer for damaged-item / lost-package cases).

## Latency by question type

The biggest driver of latency is **what you ask**, not the vendor. Product-recommendation turns are consistently the slowest (catalog retrieval + reasoning + card rendering).

| Vendor | Simple FAQ | Policy / returns | Product recommendation |
|---|---|---|---|
| Sierra | ~7.0s | 4.6s | ~8.2s |
| Siena | ~9.0s | 11.3s | ~10.0s |
| Gorgias *(us)* | ~17s | ~19s | **~20.2s** |
| Yuma | ~12.5s | 16.3s | 13.8s |
| DigitalGenius | ~10.0s | — | 🚩 handover |
| Meta AI | ~5s | ~5s | 🚩 handover |

Note Gorgias's row changed character with the move to the **live Glamnetic store**: every question type now lands in a tight **~17–20s** band (a product rec is only ~1.2× a simple FAQ), unlike the old NouriVida demo where recs were ~2.7× slower than FAQs. So Glamnetic is **uniformly slower but more consistent** — the latency is dominated by a fixed per-turn reasoning/retrieval cost on a large production catalog rather than by question type. Sierra remains the exception — it streams (first words ~0.4s) and uses a prebuilt product-card system, so a rec isn't much slower than an FAQ.

## Answer quality — blind 3-judge panel

Vendors anonymized as Store A–F; 3 independent judges; mean reported. (`data_quality_eval.json`)

| Vendor | FAQ | Policy | Product rec | Overall |
|---|---|---|---|---|
| Sierra | 5.0 | 5.0 | 5.0 | **5.0** |
| Gorgias *(us)* | 4.5 | 4.0 | 4.7 | **4.4** |
| Yuma | 5.0 | 3.7 | 2.7 | **3.3** |
| Siena | 5.0 | 1.7 | 1.0 | **2.7** |
| Meta AI | 2.0 | 5.0 | 0 | **2.0** |
| DigitalGenius | 4.3 | n/a | 0 | **2.0** |

On the live Glamnetic store, Gorgias (us) is the **#2 vendor overall (4.4)**, behind only Sierra — and the gap is small. Its product rec (4.7) is near-best; policy (4.0) is solid, docked only because order-specific cases are gated behind login.

## Handover red flags 🚩

An **unprompted** handover (the user never asked for a human) = the assistant couldn't do the job and is a 🚩 red flag. A handover that fires **only when the user explicitly asks for a human** is appropriate and is **not** a red flag — the distinction matters.

- **DigitalGenius** 🚩 — escalates the product-recommendation question to a human *unprompted*; with agents unavailable, drops into a support-ticket flow that **locks the chat**.
- **Meta AI** (Dermalogica) 🚩 — escalates the product-recommendation question to a **lead-capture form** (Name/email) *unprompted*, which locks the chat.
- **Siena** 🚩 — *soft* handover on returns ("share your email or order number so the team can confirm") rather than answering.
- **Gorgias** *(us, Glamnetic)* — **✅ not a red flag.** Gina answered all 9 substantive support questions itself; it offered a human (email capture, "~1 min") **only on the turn that explicitly asked to talk to a human**. That's the correct behavior — it doesn't bail on the job.

The headless runner flags these automatically (`red_flag: true` + which turns), so the monthly run tracks whether vendors improve.

## Strategic takeaways

1. **Speed ≠ quality.** The fastest support responder (Meta AI ~5s) is among the lowest quality and won't recommend at all; Sierra is fastest *and* highest quality. A low latency number from an assistant that escalates is not a win.
2. **Product recommendation is where assistants separate.** Half the field hands off to a human. Only Sierra and Gorgias (us) deliver top-quality recommendations; on a *live* store (Glamnetic) Gorgias still ranks #2 overall.
3. **For Gorgias (us), the clear improvement target is latency.** On the live Glamnetic store it is the **slowest vendor in both modes (~20s shopping, ~19s support)** — and uniformly so, which points at a fixed per-turn reasoning/retrieval cost rather than a few slow query types. Quality is strong (rec 4.7, support 4.2). Secondary polish: **stream the reply** (it currently posts atomically after a long "Thinking/Analyzing"), surface a **shipping ETA** in the buy flow, and consider letting the assistant **add to cart** directly.
4. **Sierra is the benchmark to beat** — streaming for instant first-token, prebuilt product cards with Add-to-Cart, and top quality in both modes. The single biggest lever for closing the gap is **time-to-first-token via streaming.**

## Status / coverage notes

- **Ada** deployed but backend down both test days — no data.
- **Gorgias** measured on **Glamnetic** — a live production storefront (real catalog + production guardrails), not the old sales-tuned NouriVida demo. Fairer and tougher; also slower (~20s vs the demo's ~17s). The session was warm (a prior human-handled conversation existed), so shopping turns 1–3 are untimed; clean latencies are shopping T4–T10 and all 10 support turns.
- Some latency figures were captured on warm sessions (slightly inflated; see cold-vs-warm in METHODOLOGY). The monthly runner produces cold, deep (10-turn) numbers going forward.

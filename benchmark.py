#!/usr/bin/env python3
"""
Siena Chat Latency Benchmark — Simple Modern (simplemodern.com)
===============================================================
Measures end-to-end response latency for Siena's AI shopping assistant
across a 10-turn commercial conversation.

METHODOLOGY
-----------
The benchmark drives the Siena chat widget via its internal JavaScript API
injected into the chat iframe (chat.siena.cx). Each "turn" measures:

  t0 = postMessage sent to iframe (action="sendMessage")
  t1 = first new bot message appears in GET /v1/live_chat/message poll

  latency = t1 - t0

This matches real-user perception: time from pressing Send to seeing a response.

API ENDPOINTS DISCOVERED
------------------------
Base: https://api-prod.siena.cx

  POST /v1/live_chat/session?key=<appKey>           → create session
  POST /v1/live_chat/messages                        → submit user message
  POST /v1/live_chat/delivery/confirm                → confirm dedup (message_hash)
  POST /v1/live_chat/track/customer_interaction      → analytics event
  GET  /v1/live_chat/message?page=1&page_size=20     → poll for messages

AUTHENTICATION HEADERS
----------------------
  x-siena-app-key:                  <appKey>
  x-siena-livechat-app-key:         <appKey>
  x-siena-organization-uuid:        <orgUuid>
  x-siena-livechat-integration-uuid: <integrationUuid>
  x-siena-livechat-session-uuid:    <sessionUuid>      (from POST /session)
  x-siena-customer-uuid:            <customerUuid>     (from POST /messages response)
  x-siena-livechat-customer-uuid:   <customerUuid>

NOTE: The GET /v1/live_chat/message endpoint requires an active session
established via the full init flow (postMessage from parent widget). Direct
Python HTTP calls return empty messages because the delivery/confirm
message_hash (MD5-based, computation undetermined) is required to trigger
AI processing. The JavaScript runner below bypasses this by using the
actual widget code path.

JAVASCRIPT RUNNER (paste in browser console on chat.siena.cx tab)
------------------------------------------------------------------
See benchmark.js for the standalone browser runner used to collect results.

RESULTS — 2026-06-29
--------------------
Target    : Simple Modern — Mesa Loop 30oz product page
Session   : 8b169bf7-79a3-4d27-abcc-2c766df79a11
Turns     : 10 (9 valid, 1 anomaly excluded)

  Turn 01:   3727ms  ⚠ (stale bot message, excluded)
  Turn 02:  10395ms
  Turn 03:   9730ms
  Turn 04:  10610ms
  Turn 05:   9989ms
  Turn 06:   6996ms
  Turn 07:  11256ms
  Turn 08:   9248ms
  Turn 09:  10074ms
  Turn 10:   9993ms

  Average latency : 9810ms  (9.8s)
  Median  (p50)   : 9993ms  (10.0s)
  p90             : 11256ms (11.3s)
  Min / Max       : 6996ms / 11256ms
"""

# ── Raw results ────────────────────────────────────────────────────────────────
RESULTS = [
    {"turn": 1,  "message": "What colors does the Mesa Loop 30oz come in?",        "latency_ms": 3727,  "valid": False, "note": "stale bot message"},
    {"turn": 2,  "message": "Does it fit in a standard car cup holder?",           "latency_ms": 10395, "valid": True},
    {"turn": 3,  "message": "Is the straw removable and dishwasher safe?",         "latency_ms": 9730,  "valid": True},
    {"turn": 4,  "message": "What is the difference between the 30oz and 40oz?",   "latency_ms": 10610, "valid": True},
    {"turn": 5,  "message": "Do you offer free shipping on orders?",               "latency_ms": 9989,  "valid": True},
    {"turn": 6,  "message": "How long does standard shipping usually take?",       "latency_ms": 6996,  "valid": True},
    {"turn": 7,  "message": "Can I return it if I do not like the color?",         "latency_ms": 11256, "valid": True},
    {"turn": 8,  "message": "Is this bottle completely leak-proof when closed?",   "latency_ms": 9248,  "valid": True},
    {"turn": 9,  "message": "Does it keep drinks cold for 24 hours?",              "latency_ms": 10074, "valid": True},
    {"turn": 10, "message": "Is the Almond Birch color currently in stock?",       "latency_ms": 9993,  "valid": True},
]


def summarize():
    valid = [r["latency_ms"] for r in RESULTS if r["valid"]]
    s = sorted(valid)
    avg = sum(valid) / len(valid)
    p50 = s[len(s) // 2]
    p90 = s[int(len(s) * 0.9)]

    print("=" * 60)
    print("Siena Chat Latency — Simple Modern (2026-06-29)")
    print("=" * 60)
    for r in RESULTS:
        flag = " ⚠ excluded" if not r["valid"] else ""
        print(f"  Turn {r['turn']:02d}: {r['latency_ms']:>6}ms{flag}")
    print()
    print(f"  Valid turns     : {len(valid)}/10")
    print(f"  Average latency : {avg:.0f}ms  ({avg/1000:.1f}s)")
    print(f"  Median  (p50)   : {p50}ms  ({p50/1000:.1f}s)")
    print(f"  p90             : {p90}ms  ({p90/1000:.1f}s)")
    print(f"  Min / Max       : {min(valid)}ms / {max(valid)}ms")
    print("=" * 60)


if __name__ == "__main__":
    summarize()

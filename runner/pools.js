// Standardized conversation pools — the SAME ~10 turns on every store so the
// comparison is apples-to-apples. Turns are catalog-agnostic (work on any
// storefront) but keep a realistic discovery → compare → objection → bundle →
// best-seller → add-to-cart → checkout arc.
//
// IMPORTANT: no turn asks for a human. So ANY handover the assistant initiates
// is unprompted, and the runner flags it as a failure (it couldn't finish the
// job itself). Success rate = % of turns answered with no handover.

// Shopping Assistant — sales discovery that must end in a real recommendation.
export const SHOPPING = [
  "Hi! I'm shopping but not sure what's right for me — can you help me choose?",
  "I want something for everyday use, good quality, and I care about value for money — what do you recommend?",
  "I'd like to stay within a sensible budget. What are my best options in that range?",
  "Can you compare your two most popular options and tell me which is better for me?",
  "I'm a little worried about quality and whether it'll suit me — what do other customers say in their reviews?",
  "Is there anything that pairs well with it or completes the set?",
  "Is there a bundle or set that's better value than buying the pieces separately?",
  "Which one is your overall best seller, and is it well reviewed?",
  "Okay, can you add your top recommendation to my cart?",
  "What's my total, and do you offer free shipping or a first-order discount?",
];

// Support — shipping / delivery / returns / policy.
export const SUPPORT = [
  "I placed an order a few days ago and still have no tracking — how long until it ships and I get a tracking number?",
  "How long does delivery usually take once it ships?",
  "What is your return policy?",
  "How do I start a return or an exchange?",
  "What happens if an item arrives damaged or faulty — is that handled differently?",
  "Can I change the shipping address on an order I just placed?",
  "Can I cancel or modify an order after it's placed, and is there a time window?",
  "Do you ship internationally, and who covers customs or duties?",
  "My discount code isn't applying at checkout — what are the usual reasons?",
  "How do I track my order?",
];

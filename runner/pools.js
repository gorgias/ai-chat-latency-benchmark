// Question pools. Each vendor is asked the SAME shape of conversation so the
// comparison stays apples-to-apples (per the "similar pool across all sites" rule):
//   - SUPPORT: 10 turns of pure support (shipping / delivery / returns / policy).
//   - SHOPPING: 10 turns of sales discovery that must end in a real product recommendation
//     + add-to-cart / checkout intent. The discovery shape is identical across vendors;
//     only the product nouns are adapted to each store's catalog.

export const SUPPORT = [
  "Do you offer free shipping?",
  "How long does standard shipping take?",
  "Do you ship internationally?",
  "What is your return policy?",
  "Can I get a refund if I change my mind?",
  "How do I track my order once it ships?",
  "What payment methods do you accept?",
  "Do you offer any discount for first-time customers?",
  "Where can I find your warranty or guarantee details?",
  "How do I reach a human agent if I need one?",
];

// Shopping-assistant discovery flow, per vendor. 10 turns:
// open-ended ask -> needs/context -> constraint -> compare -> objection ->
// secondary need -> bundle -> social proof -> add to cart -> checkout/total.
export const SHOPPING = {
  sierra: [ // Casper - mattresses
    "Hi, I'm shopping for a new mattress and not sure where to start — can you help?",
    "I'm a hot sleeper and I get lower back pain, and I share the bed with a partner.",
    "My budget is around $1,500 for a queen.",
    "What's the difference between the Snow and the Original?",
    "Is the Snow too soft for back support?",
    "I'd also want a pillow that sleeps cool.",
    "Do you have a bundle with the mattress and pillows?",
    "Which mattress is your best seller?",
    "Okay, add the Snow queen to my cart.",
    "What's my total, and do you have any current promo?",
  ],
  gorgias: [ // NouriVida - nutrition/supplements
    "Hi, can you help me find the right product for me?",
    "I'm training for a half marathon and keep crashing mid-afternoon.",
    "I'd prefer something without much sugar.",
    "Is the Matcha option caffeinated? I'm sensitive to caffeine.",
    "What's the difference between the Meal Powder and the Energy Drink?",
    "I'd also like something to help me wind down at night.",
    "Do you have a bundle that covers daytime energy and night?",
    "Which of these is your best seller?",
    "Okay, add the Matcha Meal Powder to my cart.",
    "What would my total be with the discount code?",
  ],
  siena: [ // Simple Modern - drinkware
    "Hi, I'm looking for a water bottle but not sure which — can you help?",
    "I want something big for the gym that keeps drinks cold all day.",
    "It needs to fit in a car cup holder.",
    "What's the difference between the Mesa and the Trek?",
    "Is the straw lid leak-proof for a gym bag?",
    "I'd also like a matching color for my partner.",
    "Do you sell a bundle or gift set?",
    "Which bottle is your best seller?",
    "Add the 30oz Mesa in black to my cart.",
    "What's my total, and is shipping free at that amount?",
  ],
  yuma: [ // EvryJewels - jewelry
    "Hi, I'm looking for a gift and could use some help.",
    "It's a birthday gift for my girlfriend who likes dainty gold pieces.",
    "Budget is around $60.",
    "Would a necklace or a bracelet be better?",
    "Is the gold real or plated? She has sensitive skin.",
    "I'd also like matching earrings if possible.",
    "Do you have a gift set or bundle?",
    "Which necklace is your best seller?",
    "Okay, add the best-selling necklace to my cart.",
    "What's my total with any current promo?",
  ],
  dg: [ // Bloom & Wild - flowers
    "Hi, I want to send flowers but I'm not sure what to pick.",
    "It's for my mum's birthday — she loves bright, cheerful arrangements.",
    "Budget around £40, delivered next week.",
    "What's the difference between letterbox and hand-tied bouquets?",
    "Will they arrive fresh and last at least a week?",
    "Can I add a card message and a small gift?",
    "Do you have a bundle with chocolates or a vase?",
    "Which bouquet is your most popular?",
    "Okay, add your most popular birthday bouquet to my cart.",
    "What's my total including delivery?",
  ],
  meta: [ // Dermalogica - skincare
    "Hi, I'm not sure which products I need — can you help me build a routine?",
    "My skin is dry, dull and I'm starting to see fine lines.",
    "I'd like to keep it to two or three products.",
    "What's the difference between a serum and a moisturizer for this?",
    "Is the booster okay for sensitive skin?",
    "I'd also want something for daytime SPF.",
    "Do you have a kit or bundle for this?",
    "Which product is your best seller?",
    "Okay, add the futurecode booster to my cart.",
    "What's my total, and any first-order offer?",
  ],
  ada: [ // Loop Earplugs - earplugs
    "Hi, I'm not sure which earplugs I need — can you help?",
    "I want them for concerts but also for focus at work.",
    "Budget around €40.",
    "What's the difference between Experience and Quiet?",
    "Will they stay in during a long gig?",
    "I'd also like a case or accessory.",
    "Do you have a bundle covering both use cases?",
    "Which pair is your best seller?",
    "Okay, add the Experience 2 to my cart.",
    "What's my total with shipping?",
  ],
};

export type Niche = {
  slug: string;
  name: string;
  tagline: string;
  hooks: string[];
  scriptSnippet: string;
  tips: string[];
};

export const NICHES: Niche[] = [
  {
    slug: "finance",
    name: "Personal Finance",
    tagline:
      "Money habits, budgeting mistakes, and simple explainers that make people stop and rethink how they spend.",
    hooks: [
      "Nobody told you this about your 401k until it was too late.",
      "This one subscription is quietly costing you $600 a year.",
      "The reason you're always broke has nothing to do with your income.",
      "I audited my bank statement and found $340 in fees I never noticed.",
      "Rich people don't budget the way you think they do.",
    ],
    scriptSnippet:
      '"Nobody told you this about your 401k until it was too late. If your employer matches contributions and you\'re not putting in enough to get the full match, you\'re leaving free money on the table — every single paycheck. Check your plan today and bump it up to at least the match threshold. Follow for more money mistakes nobody warns you about."',
    tips: [
      "Lead with a specific dollar amount or number — \"$340 in fees\" outperforms \"a lot of money\" almost every time.",
      "Screen-recording style B-roll (a phone showing a banking app, a calculator, a spreadsheet) reads as more credible than generic stock footage for this niche.",
      "Avoid generic advice like \"save more\" — specificity (a named fee, a named account type) is what makes finance content feel earned rather than obvious.",
    ],
  },
  {
    slug: "fitness",
    name: "Fitness & Workouts",
    tagline:
      "Form fixes, myth-busting, and quick workout breakdowns that work even without showing your face on camera.",
    hooks: [
      "You've been doing squats wrong your entire life.",
      "This 90-second stretch fixed my lower back pain in a week.",
      "Stop doing cardio if your goal is actually fat loss.",
      "The one exercise that replaced 20 minutes of my old routine.",
      "Your gym trainer never told you this about rest days.",
    ],
    scriptSnippet:
      '"You\'ve been doing squats wrong your entire life. If your knees cave inward at the bottom of the movement, it\'s not weakness — it\'s a mobility issue in your ankles. Spend two minutes before every leg day on ankle circles and ankle-to-wall stretches. Follow for more form fixes that actually matter."',
    tips: [
      "Fitness content benefits from close-up, focused B-roll (a single joint, a piece of equipment) over wide generic gym shots — it signals \"this is specifically about the thing I'm describing.\"",
      "Myth-busting hooks (\"stop doing X\") consistently outperform generic motivation (\"you can do this\") for watch time in this niche.",
      "Keep the body of the script to one specific, actionable fix — fitness reels trying to cover 3 exercises at once lose viewers halfway through.",
    ],
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    tagline:
      "First-time buyer mistakes, market explainers, and local-market insights that build trust before someone ever calls an agent.",
    hooks: [
      "The closing cost nobody explains until you're already signing.",
      "This is why your mortgage pre-approval isn't what you think it is.",
      "3 red flags I look for the second I walk into a listing.",
      "Buyers who skip this step end up overpaying by thousands.",
      "The market data your realtor isn't showing you.",
    ],
    scriptSnippet:
      '"The closing cost nobody explains until you\'re already signing. Beyond your down payment, expect 2-5% of the home price in closing costs — title fees, inspection, appraisal, and lender fees. Ask for a loan estimate upfront so there are no surprises at the table. Follow for more of what buyers wish they knew first."',
    tips: [
      "Real estate reels perform best when they read as genuinely educational rather than promotional — save the direct pitch for your bio link, not the hook.",
      "Local specificity (a neighborhood name, a local market stat) beats generic national advice for engagement from people actually house-hunting nearby.",
      "B-roll of interiors, paperwork, and neighborhoods reads more credible here than abstract finance-style visuals.",
    ],
  },
  {
    slug: "beauty-skincare",
    name: "Beauty & Skincare",
    tagline:
      "Routine breakdowns, ingredient explainers, and myth-busting that doesn't require filming your own face.",
    hooks: [
      "You're applying your skincare in the wrong order and it's wasting the good ingredients.",
      "This $12 ingredient works better than the $80 serum everyone's hyping.",
      "Stop layering retinol with this — it's canceling itself out.",
      "The skincare step everyone skips that actually matters most.",
      "Dermatologists don't recommend this trending routine, here's why.",
    ],
    scriptSnippet:
      '"You\'re applying your skincare in the wrong order and it\'s wasting the good ingredients. The rule is thinnest to thickest: cleanser, toner, serum, moisturizer, then SPF in the morning. Applying a heavy moisturizer before a serum blocks it from absorbing at all. Follow for more routine fixes that actually change your results."',
    tips: [
      "This niche can be entirely faceless with close-up product/ingredient B-roll — no need for skin close-ups, which also sidesteps a lot of comparison-based negativity in comments.",
      "Ingredient-specific hooks (naming an actual compound) outperform vague \"glow up\" framing and read as more trustworthy.",
      "Pair every claim with a concrete \"why\" in one sentence — beauty audiences are skeptical of unexplained claims after years of trend-chasing content.",
    ],
  },
  {
    slug: "parenting",
    name: "Parenting",
    tagline:
      "Practical tips and reassurance for tired parents — the kind of content that gets saved and shared, not just liked.",
    hooks: [
      "The bedtime mistake that was making my toddler's sleep worse, not better.",
      "Nobody tells you this about the 2-year molars.",
      "This 3-word phrase stopped my kid's tantrums faster than anything else.",
      "The screen time rule that actually worked in our house.",
      "What I wish someone told me before my first week home with a newborn.",
    ],
    scriptSnippet:
      '"The bedtime mistake that was making my toddler\'s sleep worse, not better. We were putting her down the second she looked tired — but overtired kids actually resist sleep harder. Watch for the first yawn, not the meltdown, and start the wind-down routine right then. Follow for more of what actually worked for us."',
    tips: [
      "Personal-experience framing (\"what worked for us\") outperforms prescriptive advice (\"you should\") in this niche — parents are wary of being told what to do.",
      "Save-worthy content (a specific technique, phrase, or schedule) gets shared in parent group chats far more than general encouragement content.",
      "Warm, calm-paced voiceover works better here than high-energy delivery — match the tone to an exhausted target audience.",
    ],
  },
  {
    slug: "travel",
    name: "Travel",
    tagline:
      "Destination tips, budget hacks, and mistakes-to-avoid content that works even without your own travel footage.",
    hooks: [
      "The booking mistake that cost me $400 on my last trip.",
      "This is the cheapest month to fly to Europe and nobody talks about it.",
      "3 things I wish I knew before my first solo trip.",
      "The airport hack that saved me two hours in line.",
      "Stop booking hotels this way if you want the best price.",
    ],
    scriptSnippet:
      '"The booking mistake that cost me $400 on my last trip. I booked round-trip instead of two one-way tickets — splitting them across different airlines actually came out $400 cheaper for the same dates. Always price-check both ways before you book. Follow for more travel mistakes worth avoiding."',
    tips: [
      "Specific dollar savings or time savings (\"$400 cheaper,\" \"two hours saved\") drive far more saves than generic \"travel tips\" framing.",
      "AI-generated destination B-roll works well for aspirational/planning content — pair it with practical, unglamorous advice in the voiceover for contrast that builds credibility.",
      "Budget and mistake-avoidance content consistently outperforms generic \"top 10 places to visit\" lists, which are oversaturated.",
    ],
  },
  {
    slug: "tech-gadgets",
    name: "Tech & Gadgets",
    tagline:
      "Explainers, comparisons, and settings nobody knows about — the kind of practical tech content that ranks and shares well.",
    hooks: [
      "This phone setting is draining your battery and it's on by default.",
      "You've been charging your laptop wrong this whole time.",
      "The subscription you forgot you're paying for is still charging you.",
      "This free app replaced three paid tools I was using.",
      "Nobody explains what this setting actually does until it's too late.",
    ],
    scriptSnippet:
      '"This phone setting is draining your battery and it\'s on by default. Background app refresh keeps every app checking for updates constantly, even ones you never open. Go into settings and turn it off for anything you don\'t use daily. Follow for more settings nobody explains."',
    tips: [
      "Screen-recording style B-roll (settings menus, app interfaces) is both cheap to generate and reads as highly credible for this niche specifically.",
      "\"You've been doing X wrong\" framing works exceptionally well in tech because almost every viewer has a device the tip applies to directly.",
      "Keep the fix to one specific setting or app per reel — bundling three tips together measurably hurts completion rate in this niche.",
    ],
  },
  {
    slug: "food-cooking",
    name: "Food & Cooking",
    tagline:
      "Recipe hacks, ingredient swaps, and kitchen mistakes that work as narrated content, not just visual cooking demos.",
    hooks: [
      "You're storing your bread wrong and it's going stale twice as fast.",
      "This one ingredient swap makes boxed mac and cheese taste homemade.",
      "Stop salting your pasta water like this.",
      "The mistake that's making your steak tough every time.",
      "3 ingredients you're throwing away that you should actually be using.",
    ],
    scriptSnippet:
      '"You\'re storing your bread wrong and it\'s going stale twice as fast. The fridge actually speeds up staling — room temperature in a bread box, or the freezer for anything longer than three days. Never the fridge. Follow for more kitchen mistakes worth fixing."',
    tips: [
      "This niche works well as narrated-explainer content even without real cooking footage — AI-generated ingredient/kitchen visuals pair naturally with a voiceover-led \"mistake and fix\" structure.",
      "Specific, testable claims (\"twice as fast,\" \"three days\") outperform vague framing (\"it goes bad faster\") for both credibility and shareability.",
      "Ingredient-swap and mistake-fix formats consistently outperform full recipe walkthroughs for short-form — save full recipes for longer-form content.",
    ],
  },
];

export function getNiche(slug: string): Niche | undefined {
  return NICHES.find((n) => n.slug === slug);
}

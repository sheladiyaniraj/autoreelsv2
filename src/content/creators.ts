// Editorial curation only — live stats (subscriber count, thumbnail, etc.)
// come from the YouTube Data API at request time via getChannelStats(),
// never hardcoded here since they'd go stale immediately.
export type Creator = {
  slug: string;
  channelId: string; // YouTube channel ID, e.g. "UCxxxxxxxxxxxxxxxxxxxxxx"
  category: string; // e.g. "Reddit stories", "Facts & trivia", "Horror"
  whyItWorks: string;
  tags: string[];
};

export const CREATORS: Creator[] = [
  {
    slug: "mr-nightmare",
    channelId: "UCnM02drQP-dF7WMgtJHR4Xw",
    category: "Horror & true stories",
    whyItWorks:
      "Straight-to-the-point narration of true scary stories and events, no on-camera host, no elaborate editing. Just a hook-first story read over minimal B-roll, proof that a strong script and voice alone can carry a channel.",
    tags: ["Narration", "Horror"],
  },
  {
    slug: "chills",
    channelId: "UCN64HIrZNqFQYZ2BuyY-4zg",
    category: "Horror & countdowns",
    whyItWorks:
      "Built around list-style countdown videos read in a distinctive, recognizable narrator voice over stock horror imagery. Shows how a consistent voiceover style can become the channel's actual brand, even without a face.",
    tags: ["Narration", "Lists"],
  },
  {
    slug: "mrcreepypasta",
    channelId: "UCJMemx7yz_1QwXjHG_rXRhg",
    category: "Horror & creepypasta",
    whyItWorks:
      "Daily creepypasta narration at high volume, over 3,400 videos. The format barely changes video to video: a story, a voice, and minimal visuals, exactly the kind of repeatable format a script-to-video pipeline is built for.",
    tags: ["Narration", "Daily uploads"],
  },
  {
    slug: "fascinating-horror",
    channelId: "UCFXad0mx4WxY1fXdbvtg0CQ",
    category: "History & disasters",
    whyItWorks:
      "True stories behind historical disasters, narrated deliberately without sensationalism or disturbing imagery. Faceless doesn't have to mean low-effort: the writing and pacing are doing all the work here.",
    tags: ["Narration", "History"],
  },
  {
    slug: "ben-lionel-scott",
    channelId: "UCgkKA7xEOoBQNpC5TJxPLiw",
    category: "Motivation",
    whyItWorks:
      "Weekly motivational videos built from voiceover over cinematic B-roll and on-screen text, with no host on camera at any point. A clean example of the voiceover-plus-visuals formula outside of storytelling niches.",
    tags: ["Motivation", "Compilation"],
  },
  {
    slug: "alux",
    channelId: "UCNjPtOCvMrKY5eLwr_-7eUg",
    category: "Lifestyle & motivation",
    whyItWorks:
      "Built an entire media brand around luxury, wealth, and self-improvement list content, over 3,000 videos, without ever putting a host on camera. Narration plus B-roll plus a strong list-format hook is the whole formula.",
    tags: ["Narration", "Lists"],
  },
  {
    slug: "bright-side",
    channelId: "UC4rlAVgAK0SGk-yTfe48Qpw",
    category: "Facts & edutainment",
    whyItWorks:
      "One of the largest faceless channels on the platform: nearly 12,000 videos of narrated science, psychology, and self-improvement explainers over animated and stock visuals. Proof the format scales to an enormous catalog without ever needing a host.",
    tags: ["Narration", "Facts"],
  },
  {
    slug: "magnatesmedia",
    channelId: "UCE4Gn00XZbpWvGUfIslT-tA",
    category: "Business documentary",
    whyItWorks:
      "Narrated 'mini movies' about how business empires are built and lost, cinematic B-roll and pacing standing in for any on-camera host. Shows the format works for longer, more researched scripts too, not just short hooks.",
    tags: ["Narration", "Business"],
  },
  {
    slug: "company-man",
    channelId: "UCQMyhrt92_8XM0KgZH6VnRg",
    category: "Business documentary",
    whyItWorks:
      "Deep-dive narrated histories of well-known companies, built entirely from voiceover, archival footage, and stock visuals. A good example of research-driven, long-form faceless content in a category most people assume needs a host.",
    tags: ["Narration", "Business"],
  },
  {
    slug: "modern-mba",
    channelId: "UCbzVRTkX3bzNZuBd9In4XyA",
    category: "Business strategy",
    whyItWorks:
      "Narrated deep-dives into company financials and strategy, no host, no camera, just a script and voice carrying genuinely dense material. Proof the format isn't limited to easy, surface-level topics.",
    tags: ["Narration", "Business"],
  },
  {
    slug: "logically-answered",
    channelId: "UCZRoNJu1OszFqABP8AuJIuw",
    category: "Tech & economics",
    whyItWorks:
      "Explains the economics behind tech and social media companies through narration alone, the creator writes and voices every video without ever appearing on camera. A clean faceless format for a niche usually dominated by on-camera commentary.",
    tags: ["Narration", "Tech"],
  },
];

export function getCreator(slug: string): Creator | undefined {
  return CREATORS.find((c) => c.slug === slug);
}

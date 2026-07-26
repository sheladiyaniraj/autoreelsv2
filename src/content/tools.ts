export type Tool = {
  slug: string;
  name: string;
  description: string;
};

export const TOOLS: Tool[] = [
  {
    slug: "hashtag-generator",
    name: "Hashtag Generator",
    description: "Paste a topic or caption, get relevant short-form video hashtags instantly.",
  },
  {
    slug: "script-generator",
    name: "AI Script & Hook Generator",
    description: "Turn a topic into a hook-first script for TikTok, Reels, or Shorts.",
  },
  {
    slug: "ai-voiceover",
    name: "AI Voiceover Generator",
    description: "Paste text, get a natural AI voiceover MP3 — no editing software required.",
  },
  {
    slug: "video-transcript",
    name: "Video Transcript Generator",
    description: "Upload a video or audio file and get an accurate text transcript.",
  },
  {
    slug: "caption-generator",
    name: "Video Caption Generator",
    description: "Upload a video and get it back with burned-in, karaoke-style captions.",
  },
  {
    slug: "youtube-downloader",
    name: "YouTube Video Downloader",
    description: "Paste a YouTube URL and download the video as an MP4, up to 1080p.",
  },
  {
    slug: "instagram-downloader",
    name: "Instagram Reel Downloader",
    description: "Paste an Instagram Reel URL and download it as an MP4.",
  },
];

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

// Official YouTube Data API v3 — channel "list" reads cost 1 quota unit each
// against the default 10,000/day project quota, so refreshing stats for a
// few hundred directory entries costs nothing meaningful. Deliberately not
// scraping youtube.com directly: Vercel's datacenter IPs already trip
// YouTube's bot detection for the yt-dlp downloader tool elsewhere in this
// codebase, and scraping channel pages violates YouTube's Terms of Service.
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

// Revalidate once a day — frequent enough that subscriber counts don't look
// stale, infrequent enough to stay well within quota and within the
// YouTube API Services Terms of Service's limits on caching API data.
const REVALIDATE_SECONDS = 60 * 60 * 24;

export type ChannelStats = {
  title: string;
  description: string;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  videoCount: number;
  viewCount: number;
};

export async function getChannelStats(channelId: string): Promise<ChannelStats | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  const url = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${apiKey}`;

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    items?: {
      snippet: {
        title: string;
        description: string;
        thumbnails?: { high?: { url: string }; default?: { url: string } };
      };
      statistics: {
        subscriberCount?: string;
        hiddenSubscriberCount?: boolean;
        videoCount: string;
        viewCount: string;
      };
    }[];
  };

  const channel = data.items?.[0];
  if (!channel) return null;

  return {
    title: channel.snippet.title,
    description: channel.snippet.description,
    thumbnailUrl:
      channel.snippet.thumbnails?.high?.url ?? channel.snippet.thumbnails?.default?.url ?? null,
    subscriberCount: channel.statistics.hiddenSubscriberCount
      ? null
      : Number(channel.statistics.subscriberCount ?? 0),
    videoCount: Number(channel.statistics.videoCount ?? 0),
    viewCount: Number(channel.statistics.viewCount ?? 0),
  };
}

export function formatSubscriberCount(count: number | null): string {
  if (count === null) return "Hidden";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(count);
}

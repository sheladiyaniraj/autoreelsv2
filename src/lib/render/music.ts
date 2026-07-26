// Procedurally generated placeholder background beds (see task history) —
// swap these for licensed tracks later without touching the mixing pipeline.
const MUSIC_URL_BY_ID: Record<string, string> = {
  cinematic: "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/music/cinematic.mp3",
  "lofi-chill": "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/music/lofi-chill.mp3",
  "upbeat-pop": "https://2pdbyk39rsrkdlfq.public.blob.vercel-storage.com/music/upbeat-pop.mp3",
};

export function resolveMusicUrl(musicId: string | null | undefined): string | null {
  if (!musicId) return null;
  return MUSIC_URL_BY_ID[musicId] ?? null;
}

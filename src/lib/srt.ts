import type { TranscriptWord } from "@/lib/providers/transcript";

const WORDS_PER_CAPTION = 8;

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

export function buildSrt(words: TranscriptWord[]): string {
  const lines: string[] = [];
  let index = 1;

  for (let i = 0; i < words.length; i += WORDS_PER_CAPTION) {
    const chunk = words.slice(i, i + WORDS_PER_CAPTION);
    const start = chunk[0].startSecond;
    const end = chunk[chunk.length - 1].endSecond;
    const text = chunk.map((w) => w.text).join(" ");

    lines.push(
      `${index}`,
      `${formatTimestamp(start)} --> ${formatTimestamp(end)}`,
      text,
      ""
    );
    index++;
  }

  return lines.join("\n");
}

import type { TranscriptWord } from "@/lib/providers/transcript";

export type CaptionStyle = {
  font: string;
  color: string;
  highlight: string;
  // "roam" alternates each caption group between a top- and bottom-safe-zone
  // anchor — see positionOverrideTag below.
  position: "center" | "bottom" | "roam" | string;
  animation: "fade" | "pop" | "typewriter" | string;
};

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  font: "Inter",
  color: "#FFFFFF",
  highlight: "#FFFFFF",
  position: "bottom",
  animation: "fade",
};

const WORDS_PER_CUE = 3;
const FONT_SIZE_RATIO = 0.06; // fraction of frame height

// Maps a template's human-readable font label to an actual bundled font
// family. Bundled files live in src/lib/render/fonts/.
const FONT_FAMILY_BY_LABEL: Record<string, string> = {
  Inter: "Inter",
  "Inter Black": "Archivo Black",
  "Times New Roman": "Merriweather",
};

export function resolveFontFamily(label: string): string {
  return FONT_FAMILY_BY_LABEL[label] ?? "Inter";
}

// None of the bundled Latin-script fonts (Inter, Archivo Black,
// Merriweather) have Devanagari glyphs — libass silently drops any text it
// can't render in the requested font rather than erroring or falling back,
// so Hindi captions rendered fully blank regardless of the chosen style.
// Detecting the script and overriding the font is the only fix; a template's
// font *label* is a style preference, but this is a hard glyph-support
// requirement that has to win regardless of what was requested.
const DEVANAGARI_RANGE = /[ऀ-ॿ]/;

function detectScriptFontOverride(words: TranscriptWord[]): string | null {
  const text = words.map((w) => w.text).join("");
  return DEVANAGARI_RANGE.test(text) ? "Noto Sans Devanagari" : null;
}

function hexToAssColor(hex: string): string {
  const clean = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  return `&H00${b}${g}${r}&`.toUpperCase();
}

// Picks a black or white outline depending on the primary text colour's
// luminance, so dark caption colours (e.g. a "minimal" black-text style)
// stay legible over arbitrary AI-generated backgrounds instead of vanishing
// against a same-tone outline.
function pickOutlineColor(hex: string): string {
  const clean = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 140 ? "#000000" : "#FFFFFF";
}

function formatAssTime(seconds: number): string {
  const cs = Math.max(0, Math.round(seconds * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
}

function escapeAssText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function groupWords(words: TranscriptWord[]): TranscriptWord[][] {
  const groups: TranscriptWord[][] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_CUE) {
    groups.push(words.slice(i, i + WORDS_PER_CUE));
  }
  return groups;
}

function buildHeader(
  style: CaptionStyle,
  resolution: { width: number; height: number },
  fontOverride: string | null
): string {
  const alignment = style.position === "center" ? 5 : 2;
  const fontSize = Math.round(resolution.height * FONT_SIZE_RATIO);
  const outline = Math.max(2, Math.round(fontSize * 0.09));
  const marginV = style.position === "center" ? 0 : Math.round(resolution.height * 0.073);
  const marginLR = Math.round(resolution.width * 0.02);
  const primaryColour = hexToAssColor(style.color);
  const outlineColour = hexToAssColor(pickOutlineColor(style.color));
  const fontFamily = fontOverride ?? resolveFontFamily(style.font);

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${resolution.width}
PlayResY: ${resolution.height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontFamily},${fontSize},${primaryColour},&H000000FF,${outlineColour},&H00000000,1,0,0,0,100,100,0,0,1,${outline},0,${alignment},${marginLR},${marginLR},${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
}

function animationPrefix(style: CaptionStyle): string {
  switch (style.animation) {
    case "pop":
      return "{\\fscx60\\fscy60\\t(0,150,\\fscx100\\fscy100)}";
    case "fade":
      return "{\\fad(150,100)}";
    default:
      return "";
  }
}

// Alternates each caption GROUP between a top-safe-zone and bottom-safe-zone
// anchor via ASS's \an override tag — the "kinetic caption" effect, without
// any face-detection, just alternation between two generic safe zones.
// \an8 = top-center, \an2 = bottom-center (ASS numpad alignment values).
function positionOverrideTag(style: CaptionStyle, groupIndex: number): string {
  if (style.position !== "roam") return "";
  return groupIndex % 2 === 0 ? "{\\an8}" : "{\\an2}";
}

function buildHighlightedEvents(
  group: TranscriptWord[],
  style: CaptionStyle,
  groupIndex: number
): string[] {
  const highlightColour = hexToAssColor(style.highlight);
  const primaryColour = hexToAssColor(style.color);
  const positionTag = positionOverrideTag(style, groupIndex);
  const lines: string[] = [];

  for (let i = 0; i < group.length; i++) {
    const start = group[i].startSecond;
    const end = i < group.length - 1 ? group[i + 1].startSecond : group[i].endSecond;
    if (end <= start) continue;

    const text = group
      .map((w, idx) => {
        const word = escapeAssText(w.text.trim());
        if (idx === i && style.highlight !== style.color) {
          return `{\\c${highlightColour}}${word}{\\c${primaryColour}}`;
        }
        return word;
      })
      .join(" ");

    lines.push(
      `Dialogue: 0,${formatAssTime(start)},${formatAssTime(end)},Default,,0,0,0,,${positionTag}${animationPrefix(style)}${text}`
    );
  }

  return lines;
}

function buildTypewriterEvents(
  group: TranscriptWord[],
  style: CaptionStyle,
  groupIndex: number
): string[] {
  const groupStart = group[0].startSecond;
  const groupEnd = group[group.length - 1].endSecond;
  const fullText = group.map((w) => w.text.trim()).join(" ");
  const duration = Math.max(0.05, groupEnd - groupStart);
  const stepDuration = duration / fullText.length;
  const positionTag = positionOverrideTag(style, groupIndex);

  const lines: string[] = [];
  for (let i = 1; i <= fullText.length; i++) {
    const start = groupStart + stepDuration * (i - 1);
    const end = i === fullText.length ? groupEnd : groupStart + stepDuration * i;
    lines.push(
      `Dialogue: 0,${formatAssTime(start)},${formatAssTime(end)},Default,,0,0,0,,${positionTag}${escapeAssText(fullText.slice(0, i))}`
    );
  }
  return lines;
}

export function buildAssSubtitles(
  words: TranscriptWord[],
  style: CaptionStyle,
  resolution: { width: number; height: number }
): string {
  const groups = groupWords(words);
  const events = groups.flatMap((group, groupIndex) =>
    style.animation === "typewriter"
      ? buildTypewriterEvents(group, style, groupIndex)
      : buildHighlightedEvents(group, style, groupIndex)
  );
  const fontOverride = detectScriptFontOverride(words);

  return buildHeader(style, resolution, fontOverride) + events.join("\n") + "\n";
}

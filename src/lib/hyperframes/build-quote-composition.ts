import { getQuoteStyle } from "@/lib/hyperframes/quote-styles";

export const QUOTE_MAX_LENGTH = 220;
export const AUTHOR_MAX_LENGTH = 60;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function quoteFontSize(quote: string): number {
  if (quote.length <= 50) return 84;
  if (quote.length <= 100) return 68;
  if (quote.length <= 160) return 54;
  return 42;
}

// Duration follows the narration when there's voiceover (audio length + a
// short tail so it doesn't cut off mid-breath), otherwise a fixed quick-read
// length. Clamped so a very short/long narration can't produce a jarring or
// (via the sandbox render cost) abusive composition.
const MIN_DURATION = 4;
const MAX_DURATION = 30;
const SILENT_DURATION = 6;

function resolveDuration(narrationDurationSeconds: number | undefined): number {
  if (!narrationDurationSeconds) return SILENT_DURATION;
  const withTail = Math.ceil(narrationDurationSeconds + 1);
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, withTail));
}

export function buildQuoteComposition({
  quote,
  author,
  styleId,
  narrationDurationSeconds,
  hasAudio,
}: {
  quote: string;
  author: string;
  styleId: string;
  narrationDurationSeconds?: number;
  hasAudio?: boolean;
}): string {
  const style = getQuoteStyle(styleId);
  const safeQuote = escapeHtml(quote.trim().slice(0, QUOTE_MAX_LENGTH));
  const safeAuthor = escapeHtml(author.trim().slice(0, AUTHOR_MAX_LENGTH));
  const fontSize = quoteFontSize(safeQuote);
  const duration = resolveDuration(narrationDurationSeconds);
  const fadeOutStart = Math.max(0.5, duration - 0.5);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>Quote Card</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,700;0,900&display=block"
      rel="stylesheet"
    />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        font-family: "Inter", sans-serif;
      }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; }
      .clip { position: absolute; }
      #bg { inset: 0; background: ${style.background}; }
      #content {
        left: 96px;
        right: 96px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 32px;
      }
      #accent { width: 96px; height: 8px; border-radius: 4px; background: ${style.accent}; }
      #quote {
        color: ${style.quoteColor};
        font-size: ${fontSize}px;
        font-weight: 900;
        line-height: 1.15;
        letter-spacing: -0.01em;
      }
      #author {
        color: ${style.authorColor};
        font-size: 40px;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-width="1080"
      data-height="1920"
      data-duration="${duration}"
    >
      <div id="bg" class="clip" data-start="0" data-duration="${duration}" data-track-index="0"></div>
      <div id="content" class="clip" data-start="0" data-duration="${duration}" data-track-index="1">
        <div id="accent"></div>
        <div id="quote">${safeQuote}</div>
        ${safeAuthor ? `<div id="author">— ${safeAuthor}</div>` : ""}
      </div>
      ${hasAudio ? `<audio data-start="0" data-duration="${duration}" data-track-index="2" src="voice.mp3"></audio>` : ""}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      tl.from("#accent", { scaleX: 0, transformOrigin: "left center", duration: 0.5, ease: "power2.out" }, 0.15);
      tl.from("#quote", { y: 40, opacity: 0, duration: 0.6, ease: "power3.out" }, 0.3);
      ${safeAuthor ? `tl.from("#author", { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" }, 0.7);` : ""}
      tl.to("#root", { opacity: 0, duration: 0.4 }, ${fadeOutStart});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
}

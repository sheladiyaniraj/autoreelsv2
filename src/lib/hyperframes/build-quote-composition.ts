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

export function buildQuoteComposition({
  quote,
  author,
  styleId,
}: {
  quote: string;
  author: string;
  styleId: string;
}): string {
  const style = getQuoteStyle(styleId);
  const safeQuote = escapeHtml(quote.trim().slice(0, QUOTE_MAX_LENGTH));
  const safeAuthor = escapeHtml(author.trim().slice(0, AUTHOR_MAX_LENGTH));
  const fontSize = quoteFontSize(safeQuote);

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
      data-duration="6"
    >
      <div id="bg" class="clip" data-start="0" data-duration="6" data-track-index="0"></div>
      <div id="content" class="clip" data-start="0" data-duration="6" data-track-index="1">
        <div id="accent"></div>
        <div id="quote">${safeQuote}</div>
        ${safeAuthor ? `<div id="author">— ${safeAuthor}</div>` : ""}
      </div>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      tl.from("#accent", { scaleX: 0, transformOrigin: "left center", duration: 0.5, ease: "power2.out" }, 0.15);
      tl.from("#quote", { y: 40, opacity: 0, duration: 0.6, ease: "power3.out" }, 0.3);
      ${safeAuthor ? `tl.from("#author", { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" }, 0.7);` : ""}
      tl.to("#root", { opacity: 0, duration: 0.4 }, 5.5);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
}

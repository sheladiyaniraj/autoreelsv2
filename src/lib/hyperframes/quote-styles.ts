export type QuoteStyle = {
  id: string;
  label: string;
  background: string;
  accent: string;
  quoteColor: string;
  authorColor: string;
};

export const QUOTE_STYLES: QuoteStyle[] = [
  {
    id: "midnight-violet",
    label: "Midnight Violet",
    background: "linear-gradient(160deg, #1a0f2e 0%, #0a0a0f 60%)",
    accent: "#7c5cff",
    quoteColor: "#ffffff",
    authorColor: "#a89ee0",
  },
  {
    id: "warm-amber",
    label: "Warm Amber",
    background: "linear-gradient(160deg, #2e1f0f 0%, #0f0a05 60%)",
    accent: "#ff9d3c",
    quoteColor: "#ffffff",
    authorColor: "#e0b98f",
  },
  {
    id: "ocean-teal",
    label: "Ocean Teal",
    background: "linear-gradient(160deg, #0f2622 0%, #06110f 60%)",
    accent: "#3ce0c8",
    quoteColor: "#ffffff",
    authorColor: "#8fd4c9",
  },
  {
    id: "mono",
    label: "Mono",
    background: "#0a0a0a",
    accent: "#ffffff",
    quoteColor: "#ffffff",
    authorColor: "#a3a3a3",
  },
];

export function getQuoteStyle(id: string): QuoteStyle {
  return QUOTE_STYLES.find((s) => s.id === id) ?? QUOTE_STYLES[0];
}

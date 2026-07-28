import type { CaptionStyle } from "@/lib/render/captions";

export type TalkingHeadPresetKey = "editorial" | "bold" | "minimal";

export const TALKING_HEAD_PRESETS: Record<
  TalkingHeadPresetKey,
  {
    label: string;
    description: string;
    captionStyle: CaptionStyle;
    // Optional ffmpeg video-filter fragment (no leading/trailing comma),
    // applied to the composed video before captions are burned in. null
    // means no grade — pass the footage through unmodified.
    colorGrade: string | null;
  }
> = {
  editorial: {
    label: "Editorial",
    description: "Warm, print-inspired — serif captions, a gentle filmic grade.",
    captionStyle: {
      font: "Times New Roman",
      color: "#F5EFE6",
      highlight: "#C96F4A",
      position: "roam",
      animation: "fade",
    },
    colorGrade: "eq=contrast=1.05:saturation=0.92:gamma_r=1.03:gamma_b=0.97",
  },
  bold: {
    label: "Bold",
    description: "High-contrast, punchy captions that pop off the frame.",
    captionStyle: {
      font: "Inter Black",
      color: "#FFFFFF",
      highlight: "#FFE500",
      position: "roam",
      animation: "pop",
    },
    colorGrade: "eq=contrast=1.15:saturation=1.25",
  },
  minimal: {
    label: "Minimal",
    description: "Clean and unobtrusive — fixed captions, no color grade.",
    captionStyle: {
      font: "Inter",
      color: "#FFFFFF",
      highlight: "#FFFFFF",
      position: "bottom",
      animation: "fade",
    },
    colorGrade: null,
  },
};

export const DEFAULT_TALKING_HEAD_PRESET: TalkingHeadPresetKey = "editorial";

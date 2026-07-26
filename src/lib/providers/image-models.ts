export type ImageModelKey = "flux" | "nano-banana-2";

export const IMAGE_MODELS: Record<
  ImageModelKey,
  {
    label: string;
    description: string;
    gatewayId: string;
    priceLabel: string;
    // "image" models use the Gateway's dedicated image-generation API
    // (gateway.image() + generateImage()). "language" models are
    // multimodal chat models whose image output comes back via
    // generateText()'s `result.files` instead.
    kind: "image" | "language";
  }
> = {
  flux: {
    label: "Flux",
    description: "Fast, photorealistic — the default.",
    gatewayId: "bfl/flux-pro-1.1",
    priceLabel: "~$0.04/image",
    kind: "image",
  },
  "nano-banana-2": {
    label: "Nano Banana 2",
    description: "Google's Gemini 3.1 Flash Image — strong prompt understanding.",
    gatewayId: "google/gemini-3.1-flash-image",
    priceLabel: "~$0.07/image",
    kind: "language",
  },
};

export const DEFAULT_IMAGE_MODEL: ImageModelKey = "flux";

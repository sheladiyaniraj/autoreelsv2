import { gateway, generateImage, generateText } from "ai";
import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL, type ImageModelKey } from "./image-models";

export type ReelAspectRatio = "9:16" | "1:1" | "16:9";
export { IMAGE_MODELS, type ImageModelKey };

export async function generateVisual({
  topic,
  aspectRatio,
  model = DEFAULT_IMAGE_MODEL,
}: {
  topic: string;
  aspectRatio: ReelAspectRatio;
  model?: ImageModelKey;
}): Promise<{ image: Uint8Array; mediaType: string }> {
  const prompt = `Cinematic B-roll background image for a short-form video about: "${topic}". Photorealistic, high detail, dramatic lighting. No text, no watermark, no logos, no people's faces in close-up.`;
  const entry = IMAGE_MODELS[model] ?? IMAGE_MODELS[DEFAULT_IMAGE_MODEL];

  if (entry.kind === "language") {
    // Nano Banana-style models are multimodal chat models, not dedicated
    // image models — they're invoked via generateText and return images
    // through `result.files`, not through the Gateway's image API.
    const result = await generateText({
      model: gateway(entry.gatewayId),
      prompt,
      providerOptions: {
        google: {
          imageConfig: { aspectRatio },
          responseModalities: ["TEXT", "IMAGE"],
        },
      },
    });

    const imageFile = result.files.find((f) => f.mediaType.startsWith("image/"));
    if (!imageFile) {
      throw new Error(`${entry.label} did not return an image`);
    }

    return { image: imageFile.uint8Array, mediaType: imageFile.mediaType };
  }

  const result = await generateImage({
    model: gateway.image(entry.gatewayId),
    prompt,
    aspectRatio,
  });

  return {
    image: result.image.uint8Array,
    mediaType: result.image.mediaType,
  };
}

import { gateway, generateImage, generateText } from "ai";
import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL, type ImageModelKey } from "./image-models";

export type ReelAspectRatio = "9:16" | "1:1" | "16:9";
export { IMAGE_MODELS, type ImageModelKey };

// If Flux itself is down/erroring, retrying Flux again inside the same
// workflow step just burns the step's retry budget on the same failure —
// verified against a real incident where every Flux call failed for ~40
// minutes straight while nano-banana-2 stayed at 100% availability. Falling
// back to a different provider immediately gets the scene an image instead
// of failing the whole reel.
const FALLBACK_IMAGE_MODEL: ImageModelKey = "nano-banana-2";

async function generateWithImageModel(
  gatewayId: string,
  prompt: string,
  aspectRatio: ReelAspectRatio
): Promise<{ image: Uint8Array; mediaType: string }> {
  const result = await generateImage({
    model: gateway.image(gatewayId),
    prompt,
    aspectRatio,
  });

  return {
    image: result.image.uint8Array,
    mediaType: result.image.mediaType,
  };
}

async function generateWithLanguageModel(
  gatewayId: string,
  label: string,
  prompt: string,
  aspectRatio: ReelAspectRatio
): Promise<{ image: Uint8Array; mediaType: string }> {
  // Nano Banana-style models are multimodal chat models, not dedicated
  // image models — they're invoked via generateText and return images
  // through `result.files`, not through the Gateway's image API.
  const result = await generateText({
    model: gateway(gatewayId),
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
    throw new Error(`${label} did not return an image`);
  }

  return { image: imageFile.uint8Array, mediaType: imageFile.mediaType };
}

async function generateWithModel(
  entry: (typeof IMAGE_MODELS)[ImageModelKey],
  prompt: string,
  aspectRatio: ReelAspectRatio
): Promise<{ image: Uint8Array; mediaType: string }> {
  return entry.kind === "language"
    ? generateWithLanguageModel(entry.gatewayId, entry.label, prompt, aspectRatio)
    : generateWithImageModel(entry.gatewayId, prompt, aspectRatio);
}

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

  try {
    return await generateWithModel(entry, prompt, aspectRatio);
  } catch (err) {
    if (model === FALLBACK_IMAGE_MODEL) throw err;

    console.warn(
      `${entry.label} image generation failed, falling back to ${IMAGE_MODELS[FALLBACK_IMAGE_MODEL].label}:`,
      err
    );
    return generateWithModel(IMAGE_MODELS[FALLBACK_IMAGE_MODEL], prompt, aspectRatio);
  }
}

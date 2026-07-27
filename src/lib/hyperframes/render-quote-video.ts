import { renderCompositionInSandbox } from "@/lib/hyperframes/sandbox";

export async function renderQuoteVideo(html: string): Promise<Buffer> {
  return renderCompositionInSandbox(html);
}

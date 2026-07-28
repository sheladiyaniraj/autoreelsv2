const DEVANAGARI_RANGE = /[ऀ-ॿ]/;

export function containsDevanagari(text: string): boolean {
  return DEVANAGARI_RANGE.test(text);
}

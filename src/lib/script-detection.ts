const DEVANAGARI_RANGE = /[ऀ-ॿ]/;
const GUJARATI_RANGE = /[઀-૿]/;

export function containsDevanagari(text: string): boolean {
  return DEVANAGARI_RANGE.test(text);
}

export function containsGujarati(text: string): boolean {
  return GUJARATI_RANGE.test(text);
}

import type { SignToken, SpokenLanguageCode } from "@/types/mirage"

/**
 * Formats only labels emitted by a verified Arabic-sign classifier. It does
 * not translate, infer, simulate landmarks, or manufacture sign tokens.
 */
export function formatRecognizedArabicSigns(
  tokens: SignToken[],
  _targetLanguage: SpokenLanguageCode,
): string {
  return tokens
    .map((token) => token.arabicLabel || token.gloss || token.token)
    .filter(Boolean)
    .join(" ")
}

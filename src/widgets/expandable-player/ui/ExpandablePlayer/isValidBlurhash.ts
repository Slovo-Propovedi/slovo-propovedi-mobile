// BlurHash base83 alphabet: digits, Latin letters and 21 punctuation symbols.
// Server-provided values are untrusted and reach a native image decoder, so a
// cheap charset + plausible-length guard keeps foreign strings out.
const BLURHASH_PATTERN = /^[#$%*+,\-.:;=?@[\]^_{}|~\w]{6,}$/

/**
 * Validates an untrusted blurhash before it is handed to expo-image.
 * @param value - Raw server value.
 * @returns `true` when the string is a plausible base83 blurhash.
 */
export const isValidBlurhash = (value: null | string | undefined): value is string =>
  typeof value === 'string' && BLURHASH_PATTERN.test(value)

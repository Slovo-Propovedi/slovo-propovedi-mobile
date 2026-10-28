// 32-bit FNV-1a over the JSON form of the steps. The steps are static source
// literals, so plain `JSON.stringify` of the array is deterministic: property
// order follows the literals, and no dates, random values or locale-dependent
// formatting enter the payload. Only content changes move the fingerprint — the
// app version is not part of it.
const FNV_OFFSET_BASIS = 0x811c9dc5
const FNV_PRIME = 0x01000193
const HEX_RADIX = 16
const FINGERPRINT_LENGTH = 8

const hashString = (input: string): string => {
  let hash = FNV_OFFSET_BASIS

  for (let index = 0; index < input.length; index += 1)
    // UTF-16 code units are identical on every JS engine, so the hash is portable.
    hash = Math.imul(hash ^ input.charCodeAt(index), FNV_PRIME) >>> 0

  return hash.toString(HEX_RADIX).padStart(FINGERPRINT_LENGTH, '0')
}

export const contentFingerprint = (steps: readonly unknown[]): string =>
  hashString(JSON.stringify(steps))

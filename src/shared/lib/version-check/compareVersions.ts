const normalizeVersion = (version: string): number[] => {
  const cleaned = version.replace(/^v/i, '').replace(/-.*$/, '')
  return cleaned.split('.').map(part => parseInt(part, 10) || 0)
}

export const compareVersions = (a: string, b: string): -1 | 0 | 1 => {
  const partsA = normalizeVersion(a)
  const partsB = normalizeVersion(b)
  const maxLen = Math.max(partsA.length, partsB.length)

  for (let i = 0; i < maxLen; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0)
    if (diff > 0) return 1
    if (diff < 0) return -1
  }

  return 0
}

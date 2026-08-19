import { useLiveSermonProgress } from './useLiveSermonProgress'

/**
 * Resolves the effective progress for a sermon.
 * Live progress wins, stored progress is the fallback.
 * Uses nullish coalescing so storedProgress of 0 is preserved.
 * @param sermonId - The sermon to get progress for.
 * @param storedProgress - Persisted progress from history (optional).
 */
export const useSermonProgress = (sermonId: string, storedProgress?: number): number | undefined =>
  useLiveSermonProgress(sermonId) ?? storedProgress

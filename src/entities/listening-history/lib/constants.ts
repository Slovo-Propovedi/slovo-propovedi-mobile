export const COMPLETION_REMAINING_MS = 10_000
export const MAX_HISTORY_ENTRIES = 100

/**
 * Synthetic duration for manually marked-as-listened entries.
 *
 * 1ms satisfies the isEntryCompleted short-audio rule (duration <= 10s →
 * position >= duration), yields progress = 1 in useHistoryProgressMap,
 * getResumePosition returns 0 for completed entries, and
 * recordPlaybackStartAction rebuilds the entry on real playback.
 */
export const MANUAL_LISTENED_DURATION_MS = 1

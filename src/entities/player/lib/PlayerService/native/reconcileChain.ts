/**
 * Builds the inclusive queue ranges that FINISHED during `count` auto-advances
 * starting at `startIndex`; the track the engine sits on now is excluded.
 * @param startIndex - Queue index JS last observed.
 * @param count - Number of auto-advances the native counter reported.
 * @param trackCount - Queue length.
 */
export const buildCompletionRanges = (
  startIndex: number,
  count: number,
  trackCount: number,
): Array<[number, number]> => {
  const ranges: Array<[number, number]> = []
  let cursor = startIndex
  let remaining = count

  while (remaining > 0) {
    const chunk = Math.min(remaining, trackCount - cursor)
    ranges.push([cursor, cursor + chunk - 1])
    remaining -= chunk
    cursor = 0
  }

  return ranges
}

/**
 * The native counter only maps to JS indices when both queues are identical.
 * @param engineTrackIds - Sermon ids the native engine holds in order.
 * @param playlistSermonIds - Sermon ids of the JS queue in order.
 */
export const hasSameQueueIdentity = (
  engineTrackIds: string[],
  playlistSermonIds: string[],
): boolean =>
  engineTrackIds.length === playlistSermonIds.length &&
  engineTrackIds.every((id, index) => id === playlistSermonIds[index])

/**
 * Session registry of web downloads whose `cache.put` completed (the manifest
 * commit may still have failed). A present Cache Storage entry is complete data,
 * so `deletePartialFile` must not remove these — only a re-download (which clears
 * the entry first) or the orphan sweep may. Bounded LRU-ish so a long session
 * cannot grow it without limit.
 */

const COMPLETED_DOWNLOAD_LIMIT = 100
const completedDownloads = new Set<string>()

export const rememberCompletedDownload = (audioUrl: string): void => {
  completedDownloads.delete(audioUrl)
  completedDownloads.add(audioUrl)
  if (completedDownloads.size > COMPLETED_DOWNLOAD_LIMIT) {
    const oldest = completedDownloads.values().next().value
    if (oldest !== undefined) completedDownloads.delete(oldest)
  }
}

/**
 * Whether the URL's latest download wrote a complete entry in this session, even
 * if the manifest commit failed. `deletePartialFile` uses it to avoid deleting a
 * complete download that is merely uncommitted.
 * @param audioUrl - URL of the track.
 */
export const wasDownloadCompleted = (audioUrl: string): boolean => completedDownloads.has(audioUrl)

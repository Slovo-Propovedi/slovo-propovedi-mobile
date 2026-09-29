import { getCacheRequesters } from 'entities/offline-cache'

// A cache entry requested by another source (e.g. the fullscreen player) must
// survive a playlist cancel — only the playlist's own entry is ours to drop.
export const isOnlyPlaylistRequester = (url: string): boolean => {
  const requesters = getCacheRequesters(url)
  for (const source of requesters) if (source !== 'playlist') return false

  return true
}

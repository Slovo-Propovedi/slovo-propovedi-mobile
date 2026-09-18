import type { LockScreenMetadata } from '../types'

export const createSetHandler =
  (ns: MediaSession | undefined) =>
  (action: MediaSessionAction, handler: MediaSessionActionHandler | null): void => {
    try {
      ns?.setActionHandler(action, handler)
    } catch {
      // Unsupported action in this browser — ignore silently.
    }
  }

export const applyMetadata = (metadata: LockScreenMetadata | null): void => {
  if (!metadata) {
    navigator.mediaSession.metadata = null
    return
  }

  const artwork = metadata.artworkUrl ? [{ src: metadata.artworkUrl }] : []
  navigator.mediaSession.metadata = new MediaMetadata({
    album: metadata.albumTitle ?? '',
    artist: metadata.artist ?? '',
    artwork,
    title: metadata.title ?? '',
  })
}

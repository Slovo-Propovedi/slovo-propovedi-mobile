const DEFAULT_SKIP_SECONDS = 10

export type GetAudio = () => HTMLAudioElement | null

/**
 * Local typing for MediaSessionActionDetails — avoids `as` casts and
 * keeps the handler parameter properly typed even if lib.dom is stale.
 */
export interface MediaSessionActionDetail {
  seekOffset?: number
  seekTime?: number
}

export interface MediaSessionPlayer {
  pause: () => void
  play: () => void
  seekTo: (positionMs: number) => void
}

export const registerSeekHandlers = (
  setHandler: (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => void,
  player: MediaSessionPlayer,
  getAudio: GetAudio,
  updatePositionState: (audio: HTMLAudioElement | null) => void,
): void => {
  setHandler('seekto', (details: MediaSessionActionDetail) => {
    if (details.seekTime == null || !Number.isFinite(details.seekTime)) return
    player.seekTo(details.seekTime * 1000)
    updatePositionState(getAudio())
  })

  setHandler('seekforward', (details: MediaSessionActionDetail) => {
    const audio = getAudio()
    if (!audio) return
    const skip = details.seekOffset ?? DEFAULT_SKIP_SECONDS
    const target = Number.isFinite(audio.duration)
      ? Math.min(audio.currentTime + skip, audio.duration)
      : audio.currentTime + skip
    player.seekTo(target * 1000)
    updatePositionState(audio)
  })

  setHandler('seekbackward', (details: MediaSessionActionDetail) => {
    const audio = getAudio()
    if (!audio) return
    const skip = details.seekOffset ?? DEFAULT_SKIP_SECONDS
    const target = Math.max(audio.currentTime - skip, 0)
    player.seekTo(target * 1000)
    updatePositionState(audio)
  })
}

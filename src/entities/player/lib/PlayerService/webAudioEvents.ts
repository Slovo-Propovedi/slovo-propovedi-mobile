interface WebAudioEventHandlers {
  onDuration: (durationMs: number) => void
  onDurationChange?: (durationMs: number) => void
  onEnded: () => void
  onLoaded: () => void
  onPause: () => void
  onPlay: () => void
  onPosition: (positionMs: number) => void
}

export const attachWebAudioEvents = (
  audio: HTMLAudioElement,
  handlers: WebAudioEventHandlers,
): (() => void) => {
  const getValidDurationMs = (): null | number => {
    const durationMs = Math.floor(audio.duration * 1000)
    if (!Number.isFinite(durationMs) || durationMs <= 0) return null
    return durationMs
  }

  const writeDuration = () => {
    const ms = getValidDurationMs()
    if (ms !== null) handlers.onDuration(ms)
  }

  const handleLoadedMetadata = () => {
    writeDuration()
    handlers.onLoaded()
  }

  const handleDurationChange = () => {
    const ms = getValidDurationMs()
    if (ms === null) return
    handlers.onDuration(ms)
    handlers.onDurationChange?.(ms)
  }

  const handlePlay = () => handlers.onPlay()
  const handlePause = () => handlers.onPause()
  const handleTimeUpdate = () => handlers.onPosition(Math.floor(audio.currentTime * 1000))
  const handleEnded = () => handlers.onEnded()

  audio.addEventListener('loadedmetadata', handleLoadedMetadata)
  audio.addEventListener('durationchange', handleDurationChange)
  audio.addEventListener('play', handlePlay)
  audio.addEventListener('pause', handlePause)
  audio.addEventListener('timeupdate', handleTimeUpdate)
  audio.addEventListener('ended', handleEnded)

  return () => {
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    audio.removeEventListener('durationchange', handleDurationChange)
    audio.removeEventListener('play', handlePlay)
    audio.removeEventListener('pause', handlePause)
    audio.removeEventListener('timeupdate', handleTimeUpdate)
    audio.removeEventListener('ended', handleEnded)
  }
}

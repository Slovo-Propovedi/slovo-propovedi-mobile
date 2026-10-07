import { getEntrySermon, type ListeningHistory } from 'entities/listening-history/@x/player'
import { type AudioPlayerData } from 'entities/sermon/@x/player'

const SAME_SERMON_TOLERANCE_MS = 1000

/**
 * Starts or resumes the audio element for a manual play request. A different
 * sermon loads a new source and plays; the same sermon paused resumes (the
 * resume path starts playback itself, so there is no extra play()); the same
 * sermon already playing is left untouched (a context-only switch is applied by
 * the caller before this runs).
 * @param root0 - Branch inputs and player actions.
 * @param root0.currentPosition - Current player position in ms.
 * @param root0.history - Listening history snapshot for the resume seek.
 * @param root0.isSameSermon - Requested sermon equals the current one.
 * @param root0.isSameSermonPlaying - Requested sermon is currently playing.
 * @param root0.newAudio - Normalized player data for the requested sermon.
 * @param root0.play - Starts playback.
 * @param root0.replaceAudio - Loads a new source (does not start playback).
 * @param root0.resumeAfterPause - Resumes the current source (starts playback).
 * @param root0.resumeMs - Stored resume position in ms.
 * @param root0.seekTo - Seeks to a position in ms.
 * @param root0.sermonId - Requested sermon id.
 */
export const startSermonPlayback = async ({
  currentPosition,
  history,
  isSameSermon,
  isSameSermonPlaying,
  newAudio,
  play,
  replaceAudio,
  resumeAfterPause,
  resumeMs,
  seekTo,
  sermonId,
}: {
  currentPosition: number
  history: ListeningHistory
  isSameSermon: boolean
  isSameSermonPlaying: boolean
  newAudio: AudioPlayerData
  play: () => Promise<unknown>
  replaceAudio: (url: string, positionMs: number) => Promise<unknown>
  resumeAfterPause: (audioUrl: string) => Promise<unknown>
  resumeMs: number
  seekTo: (ms: number) => Promise<unknown>
  sermonId: string
}): Promise<void> => {
  if (!isSameSermon) {
    await replaceAudio(newAudio.audioUrl, resumeMs)
    await play()
    return
  }

  if (isSameSermonPlaying) return

  await resumeAfterPause(newAudio.audioUrl)
  const entry = history.find(e => getEntrySermon(e)?.id === sermonId)

  if (entry && resumeMs === 0) await seekTo(0)
  else if (resumeMs > 0 && Math.abs(currentPosition - resumeMs) > SAME_SERMON_TOLERANCE_MS)
    await seekTo(resumeMs)
}

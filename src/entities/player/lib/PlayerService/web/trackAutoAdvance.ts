import { markHistoryCompletedAction } from 'entities/listening-history/@x/player'
import { type PlaylistData } from 'entities/playlist/@x/player'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { currentAudioAtom, currentPlaylistAtom, RepeatMode, repeatModeAtom } from '../../../model'
import { getIndexOfCurrentAudioInPlaylist } from '../../../ui/getIndexOfCurrentAudioInPlaylist'
import { resolveTrackToggle } from '../../../ui/PlayerControls/resolveTrackToggle'
import { type LockScreenMetadata, type PlaybackStatus } from '../types'
import { advanceToNextTrack } from './advanceToNextTrack'

const COMPLETION_ERROR_MESSAGE = 'Ошибка при завершении записи истории'
const RESTART_ERROR_MESSAGE = 'Ошибка при повторном запуске проповеди'

// Native parity: one completion per queue end, per player instance. A repeated
// 'ended' for the same track stays silent; a different track ends a new window.
const completedTracks = new WeakMap<WebTrackAutoAdvanceService, string>()
// An advance already in flight owns the player — ignore overlapping ends.
let isAdvancing = false

interface WebTrackAutoAdvanceService {
  getStatus: () => PlaybackStatus
  pause: () => Promise<void>
  play: () => Promise<void>
  replaceAudio: (audioUrl: string, initialPositionMs?: number) => Promise<unknown>
  seekTo: (positionMs: number) => Promise<void>
  setLockScreenMetadata: (metadata: LockScreenMetadata) => void
}

const restartEndedTrack = async (service: WebTrackAutoAdvanceService): Promise<void> => {
  try {
    await service.seekTo(0)
    await service.play()
  } catch (error) {
    console.error('[handleWebTrackEnd] restart failed:', error)
    reportError(error, RESTART_ERROR_MESSAGE)
  }
}

const completeEndedTrack = async (
  service: WebTrackAutoAdvanceService,
  currentAudio: AudioPlayerData,
  currentPlaylist: null | PlaylistData,
): Promise<void> => {
  if (completedTracks.get(service) === currentAudio.id) return
  // Recorded before the await on purpose: a second 'ended' must not double-complete.
  // Trade-off: a failed completion is never retried for this id (the error is reported).
  completedTracks.set(service, currentAudio.id)

  try {
    await markHistoryCompletedAction(
      ctx,
      currentAudio.id,
      service.getStatus().duration,
      currentAudio,
      currentPlaylist ?? undefined,
    )
    // Flushes the final position and drops isPlaying/status tracking. The element
    // already ended, so pause() must not resurrect playback.
    await service.pause()
  } catch (error) {
    console.error('[handleWebTrackEnd] completion failed:', error)
    reportError(error, COMPLETION_ERROR_MESSAGE)
  }
}

// Repeat-track is excluded: any other mode walks the queue, and only the queue
// end (last track with repeat off) completes the ended track instead of advancing.
const advanceOrCompleteQueue = async (
  service: WebTrackAutoAdvanceService,
  currentAudio: AudioPlayerData,
  repeatMode: RepeatMode,
): Promise<void> => {
  const currentPlaylist = ctx.get(currentPlaylistAtom)

  // Without a queue there is nowhere to advance: repeat off still closes the
  // lone track, mirroring the native queue end at loop 'none'.
  if (!currentPlaylist) {
    if (repeatMode === RepeatMode.Off) await completeEndedTrack(service, currentAudio, null)
    return
  }

  const index = getIndexOfCurrentAudioInPlaylist(currentAudio, currentPlaylist)
  if (index === undefined || index < 0) return

  const target = resolveTrackToggle('next', index, currentPlaylist.sermons.length, repeatMode)

  if (target.kind === 'boundary') {
    await completeEndedTrack(service, currentAudio, currentPlaylist)
    return
  }
  if (target.kind !== 'switch') return

  await advanceToNextTrack({
    newIndex: target.newIndex,
    play: service.play,
    playlist: currentPlaylist,
    replaceAudio: service.replaceAudio,
    setLockScreenMetadata: service.setLockScreenMetadata,
  })
}

/**
 * Web counterpart of the native auto-advance: runs when an <audio> element
 * fires 'ended' and applies the current repeat mode to the Reatom playlist.
 * @param service - Live web player transport (its methods act on the current element).
 */
export const handleWebTrackEnd = async (service: WebTrackAutoAdvanceService): Promise<void> => {
  const currentAudio = ctx.get(currentAudioAtom)
  if (!currentAudio) return
  if (isAdvancing) return

  isAdvancing = true
  const repeatMode = ctx.get(repeatModeAtom)

  try {
    if (repeatMode === RepeatMode.Track) await restartEndedTrack(service)
    else await advanceOrCompleteQueue(service, currentAudio, repeatMode)
  } finally {
    isAdvancing = false
  }
}

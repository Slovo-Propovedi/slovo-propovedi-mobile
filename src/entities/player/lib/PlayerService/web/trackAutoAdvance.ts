import { markHistoryCompletedAction } from 'entities/listening-history/@x/player'
import { type PlaylistData } from 'entities/playlist/@x/player'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { isOnlineAtom } from 'shared/model/network'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  RepeatMode,
  repeatModeAtom,
  setCurrentAudioAction,
} from '../../../model'
import { getIndexOfCurrentAudioInPlaylist } from '../../../ui/getIndexOfCurrentAudioInPlaylist'
import { executeTrackSwitch } from '../../../ui/PlayerControls/executeTrackSwitch'
import { resolveTrackToggle } from '../../../ui/PlayerControls/resolveTrackToggle'
import { guardOfflinePlayback } from '../../playOfflineGuard'
import { type LockScreenMetadata, type PlaybackStatus } from '../types'

const ADVANCE_ERROR_MESSAGE = 'Ошибка при автоматическом переходе к следующей проповеди'
const COMPLETION_ERROR_MESSAGE = 'Ошибка при завершении записи истории'

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
  await service.seekTo(0)
  await service.play()
}

const completeEndedTrack = async (
  service: WebTrackAutoAdvanceService,
  currentAudio: AudioPlayerData,
  currentPlaylist: null | PlaylistData,
): Promise<void> => {
  if (completedTracks.get(service) === currentAudio.id) return
  completedTracks.set(service, currentAudio.id)

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
}

const advanceToNextTrack = async (
  service: WebTrackAutoAdvanceService,
  currentAudio: AudioPlayerData,
  currentPlaylist: PlaylistData,
): Promise<void> => {
  const index = getIndexOfCurrentAudioInPlaylist(currentAudio, currentPlaylist)
  if (index === undefined || index < 0) return

  const target = resolveTrackToggle('next', index, currentPlaylist.sermons.length, RepeatMode.Queue)
  if (target.kind !== 'switch') return

  const targetTrack = currentPlaylist.sermons[target.newIndex]
  if (!targetTrack?.audioUrl) return
  if (await guardOfflinePlayback(targetTrack.audioUrl, ctx.get(isOnlineAtom))) return

  await executeTrackSwitch({
    ctx,
    newIndex: target.newIndex,
    options: { markOldCompleted: true },
    play: service.play,
    playlist: currentPlaylist,
    replaceAudio: service.replaceAudio,
    setCurrentAudio: audio => setCurrentAudioAction(ctx, audio),
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
    if (repeatMode === RepeatMode.Track) {
      await restartEndedTrack(service)
      return
    }

    const currentPlaylist = ctx.get(currentPlaylistAtom)

    if (repeatMode === RepeatMode.Off) {
      await completeEndedTrack(service, currentAudio, currentPlaylist)
      return
    }

    if (!currentPlaylist) return
    await advanceToNextTrack(service, currentAudio, currentPlaylist)
  } catch (error) {
    console.error('[handleWebTrackEnd] auto-advance failed:', error)
    const message = repeatMode === RepeatMode.Off ? COMPLETION_ERROR_MESSAGE : ADVANCE_ERROR_MESSAGE
    reportError(error, message)
  } finally {
    isAdvancing = false
  }
}

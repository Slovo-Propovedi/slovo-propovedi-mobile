import { type PlaylistData } from 'entities/playlist/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { isOnlineAtom } from 'shared/model/network'
import { setCurrentAudioAction } from '../../../model'
import { executeTrackSwitch } from '../../../ui/PlayerControls/executeTrackSwitch'
import { guardOfflinePlayback } from '../../playOfflineGuard'
import { type LockScreenMetadata } from '../types'

const ADVANCE_ERROR_MESSAGE = 'Ошибка при автоматическом переходе к следующей проповеди'

// Switches the live web player to the playlist track at `newIndex` and marks
// the finished sermon completed. The offline guard cancels the switch.
export const advanceToNextTrack = async ({
  newIndex,
  play,
  playlist,
  replaceAudio,
  setLockScreenMetadata,
}: {
  newIndex: number
  play: () => Promise<void>
  playlist: PlaylistData
  replaceAudio: (audioUrl: string, initialPositionMs?: number) => Promise<unknown>
  setLockScreenMetadata: (metadata: LockScreenMetadata) => void
}): Promise<void> => {
  try {
    const targetTrack = playlist.sermons[newIndex]
    if (!targetTrack?.audioUrl) return
    if (await guardOfflinePlayback(targetTrack.audioUrl, ctx.get(isOnlineAtom))) return

    await executeTrackSwitch({
      ctx,
      newIndex,
      options: { markOldCompleted: true },
      play,
      playlist,
      replaceAudio,
      setCurrentAudio: audio => setCurrentAudioAction(ctx, audio),
      setLockScreenMetadata,
    })
  } catch (error) {
    console.error('[advanceToNextTrack] auto-advance failed:', error)
    reportError(error, ADVANCE_ERROR_MESSAGE)
  }
}

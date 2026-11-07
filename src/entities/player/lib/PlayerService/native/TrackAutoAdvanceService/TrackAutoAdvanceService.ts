import { markHistoryCompletedAction } from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { currentPlaylistAtom } from '../../../../model'
import { playlistEngine } from '../PlaylistEngine'
import { switchNativeTrack } from './switchNativeTrack'

const ADVANCE_ERROR_MESSAGE = 'Ошибка при автоматическом переходе к следующей проповеди'
const MANUAL_SWITCH_ERROR_MESSAGE = 'Ошибка при восстановлении переключения проповеди'
const COMPLETION_ERROR_MESSAGE = 'Ошибка при завершении записи истории'

/**
 * Native-switch coordinator: the playlist advances tracks natively (surviving a
 * frozen JS process), and JS reconciles the switch after the fact. Manual
 * next/prev switches are already committed by the JS funnel before skipTo —
 * storage then already holds the new track id, so the event is ignored here.
 */
class TrackAutoAdvanceService {
  public async handleTrackChanged(previousIndex: number, currentIndex: number): Promise<void> {
    if (previousIndex < 0 || previousIndex === currentIndex) return

    try {
      await switchNativeTrack({ currentIndex, previousIndex })
    } catch (error) {
      console.error('[TrackAutoAdvanceService] handleTrackChanged failed:', error)
      reportError(error, ADVANCE_ERROR_MESSAGE)
    }
  }

  /**
   * Foreground recover of a manual native hop (headset/native next/prev): the
   * engine moved without a single auto-advance, so nothing is completed and the
   * previous track's progress is not flushed.
   * @param currentIndex - Index the engine moved to.
   */
  public async handleManualTrackChanged(currentIndex: number): Promise<void> {
    try {
      await switchNativeTrack({ currentIndex })
    } catch (error) {
      console.error('[TrackAutoAdvanceService] handleManualTrackChanged failed:', error)
      reportError(error, MANUAL_SWITCH_ERROR_MESSAGE)
    }
  }

  public async handleQueueEnd(): Promise<void> {
    try {
      const lastIndex = playlistEngine.getTrackCount() - 1
      if (playlistEngine.getCurrentIndex() !== lastIndex) return
      if (playlistEngine.getLoop() !== 'none') return
      if (this.completedQueueEndIndex === lastIndex) return
      const lastTrack = playlistEngine.getTrackAt(lastIndex)
      if (!lastTrack) return

      this.completedQueueEndIndex = lastIndex
      const snapshot = playlistEngine.getSnapshot(lastIndex)
      const durationMs = Math.floor((snapshot?.duration ?? 0) * 1000)
      await markHistoryCompletedAction(
        ctx,
        lastTrack.id,
        durationMs,
        lastTrack,
        ctx.get(currentPlaylistAtom) ?? undefined,
      )
      playlistEngine.pause()
    } catch (error) {
      console.error('[TrackAutoAdvanceService] handleQueueEnd failed:', error)
      reportError(error, COMPLETION_ERROR_MESSAGE)
    }
  }

  private completedQueueEndIndex = -1
}

export const trackAutoAdvanceService = new TrackAutoAdvanceService()

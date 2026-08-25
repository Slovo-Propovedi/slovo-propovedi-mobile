import { useCallback } from 'react'
import {
  getResumePosition,
  historyAtom,
  recordSermonSwitchAction,
} from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { savePlaybackProgress } from '../../lib/playbackProgress'
import { currentAudioAtom, durationAtom, positionAtom } from '../../model'

type TrackDirection = 'next' | 'prev'

interface UsePlayerToggleTrackParams {
  currentPlaylist: null | PlaylistData
  hasValidPlaylist: boolean
  index: number | undefined
  play: () => Promise<void>
  replaceAudio: (url: string, positionMs?: number) => Promise<unknown>
  setCurrentAudio: (audio: AudioPlayerData) => Promise<unknown>
  setLockScreenMetadata: (metadata: {
    albumTitle: string
    artist: string
    artworkUrl: null | string
    title: string
  }) => void
}

/**
 * Управляет переключением между треками плейлиста.
 * Создаёт новый AudioPlayerData из данных трека и воспроизводит его.
 * @param root0 - Параметры переключения трека.
 * @param root0.currentPlaylist - Текущий плейлист.
 * @param root0.hasValidPlaylist - Флаг валидности плейлиста.
 * @param root0.index - Индекс текущего трека.
 * @param root0.play - Функция воспроизведения.
 * @param root0.replaceAudio - Функция замены аудио.
 * @param root0.setCurrentAudio - Функция установки текущего аудио.
 * @param root0.setLockScreenMetadata - Функция установки метаданных экрана блокировки.
 */
export const usePlayerToggleTrack = ({
  currentPlaylist,
  hasValidPlaylist,
  index,
  play,
  replaceAudio,
  setCurrentAudio,
  setLockScreenMetadata,
}: UsePlayerToggleTrackParams) =>
  useCallback(
    async (dir: TrackDirection) => {
      if (!hasValidPlaylist || !currentPlaylist || index === undefined) return

      const newIndex = dir === 'next' ? index + 1 : index - 1

      if (newIndex < 0 || newIndex >= currentPlaylist.sermons.length) return

      const track = currentPlaylist.sermons[newIndex]

      if (!track?.audioUrl) return

      const { audioUrl, id, title, ...rest } = track

      const newAudio: AudioPlayerData = {
        ...rest,
        artwork: currentPlaylist.artwork,
        audioUrl,
        id,
        title,
      }

      const oldAudio = ctx.get(currentAudioAtom)
      const oldPositionMs = ctx.get(positionAtom)

      // Persist new track's start position for crash-consistency (matches auto-advance path)
      const history = ctx.get(historyAtom)
      const resumeMs = getResumePosition(history, id)
      void savePlaybackProgress(ctx, { positionMs: resumeMs, sermonId: id })

      // Flush old track's position to history before switching
      if (oldAudio?.id && oldAudio.id !== id)
        void recordSermonSwitchAction(ctx, {
          markOldCompleted: false,
          newAudio,
          newPlaylist: currentPlaylist,
          oldDurationMs: ctx.get(durationAtom),
          oldPositionMs: Math.max(0, oldPositionMs),
          oldSermonId: oldAudio.id,
        }).catch(error => {
          console.error('[usePlayerToggleTrack] history flush failed:', error)
          reportError(error, 'Ошибка при сохранении позиции предыдущего трека')
        })

      await setCurrentAudio(newAudio)
      await replaceAudio(newAudio.audioUrl, resumeMs)

      setLockScreenMetadata({
        albumTitle: currentPlaylist.title,
        artist: newAudio.artist,
        artworkUrl: newAudio.artwork,
        title: newAudio.title,
      })

      try {
        await play()
      } catch (error) {
        if (error instanceof Error && error.message.includes('activity is no longer available'))
          console.warn('[Player] Ignoring AppState-related error:', error.message)
        else throw error
      }
    },
    [
      hasValidPlaylist,
      currentPlaylist,
      index,
      setCurrentAudio,
      replaceAudio,
      play,
      setLockScreenMetadata,
    ],
  )

import { useCallback } from 'react'
import {
  getResumePosition,
  historyAtom,
  recordSermonSwitchAction,
} from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { type AudioPlayerData, type PlaylistData, toAudioPlayerData } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { savePlaybackProgress } from '../../lib/playbackProgress'
import { currentAudioAtom, durationAtom, positionAtom, repeatModeAtom } from '../../model'
import { setTrackBoundaryNoticeAction } from '../../trackBoundaryNotice'
import { playSafely } from './playSafely'
import { resolveTrackToggle, type TrackDirection } from './resolveTrackToggle'

interface UsePlayerToggleTrackParams {
  currentPlaylist: null | PlaylistData
  hasValidPlaylist: boolean
  index: number | undefined
  play: () => Promise<void>
  replaceAudio: (url: string, positionMs?: number) => Promise<unknown>
  seekTo: (positionMs: number) => Promise<void>
  setCurrentAudio: (audio: AudioPlayerData) => Promise<unknown>
  setLockScreenMetadata: (metadata: {
    albumTitle: string
    artist: string
    artworkUrl: null | string
    title: string
  }) => void
}

export const usePlayerToggleTrack = ({
  currentPlaylist,
  hasValidPlaylist,
  index,
  play,
  replaceAudio,
  seekTo,
  setCurrentAudio,
  setLockScreenMetadata,
}: UsePlayerToggleTrackParams) =>
  useCallback(
    async (dir: TrackDirection) => {
      try {
        if (!hasValidPlaylist || !currentPlaylist || index === undefined) return

        const target = resolveTrackToggle(
          dir,
          index,
          currentPlaylist.sermons.length,
          ctx.get(repeatModeAtom),
        )
        if (target.kind === 'restart') {
          await seekTo(0)
          await playSafely(play)
          return
        }
        if (target.kind === 'boundary') {
          setTrackBoundaryNoticeAction(ctx, target.boundary)
          return
        }

        const track = currentPlaylist.sermons[target.newIndex]

        const baseAudio = toAudioPlayerData(track)
        if (!baseAudio) return

        const newAudio: AudioPlayerData = { ...baseAudio, artwork: currentPlaylist.artwork }

        const oldAudio = ctx.get(currentAudioAtom)
        const oldPositionMs = ctx.get(positionAtom)

        // Persist new track's start position for crash-consistency (matches auto-advance path)
        const history = ctx.get(historyAtom)
        const resumeMs = getResumePosition(history, baseAudio.id)
        void savePlaybackProgress(ctx, { positionMs: resumeMs, sermonId: baseAudio.id }).catch(
          error => {
            console.error('[usePlayerToggleTrack] savePlaybackProgress failed:', error)
            reportError(error, 'Ошибка при сохранении позиции трека')
          },
        )

        // Flush old track's position to history before switching
        if (oldAudio?.id && oldAudio.id !== baseAudio.id)
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

        // Play before setting lock-screen metadata (matches usePlaySermon; fixes lock-screen notification)
        await playSafely(play)

        setLockScreenMetadata({
          albumTitle: currentPlaylist.title,
          artist: newAudio.artist,
          artworkUrl: newAudio.artwork,
          title: newAudio.title,
        })
      } catch (error) {
        console.error('[usePlayerToggleTrack] toggleTrack failed:', error)
        reportError(error, 'Ошибка при переключении трека')
      }
    },
    [
      hasValidPlaylist,
      currentPlaylist,
      index,
      setCurrentAudio,
      replaceAudio,
      seekTo,
      play,
      setLockScreenMetadata,
    ],
  )

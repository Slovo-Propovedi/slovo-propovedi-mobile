import { useCallback } from 'react'
import { ctx } from 'shared/lib/reatom-ctx'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { repeatModeAtom } from '../../model'
import { setTrackToggleNoticeAction } from '../../trackToggleNotice'
import { executeTrackSwitch } from './executeTrackSwitch'
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
          setTrackToggleNoticeAction(ctx, { at: Date.now(), kind: 'restart' })
          await seekTo(0)
          await playSafely(play)
          return
        }
        if (target.kind === 'boundary') {
          setTrackToggleNoticeAction(ctx, {
            at: Date.now(),
            boundary: target.boundary,
            kind: 'boundary',
          })
          return
        }
        if (target.wrappedTo)
          setTrackToggleNoticeAction(ctx, {
            at: Date.now(),
            kind: 'wrap',
            to: target.wrappedTo,
          })

        await executeTrackSwitch({
          ctx,
          newIndex: target.newIndex,
          play,
          playlist: currentPlaylist,
          replaceAudio,
          setCurrentAudio,
          setLockScreenMetadata,
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

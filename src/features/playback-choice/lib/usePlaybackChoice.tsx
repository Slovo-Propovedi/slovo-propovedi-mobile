import { useCtx } from '@reatom/npm-react'
import { useCallback, useState } from 'react'
import { usePlayNewSermon } from 'entities/player'
import { myPlaylistsAtom, type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { reportError } from 'shared/model/error-dialog'
import { PlaybackChoiceDialog } from '../ui/PlaybackChoiceDialog'
import { collectPlaybackCandidates } from './collectPlaybackCandidates'

interface PlaybackChoiceOptions {
  errorMessage: string
  getFallbackPlaylist: (
    sermon: AudioPlayerData,
    originPlaylist: null | PlaylistData,
  ) => PlaylistData | Promise<PlaylistData | undefined> | undefined
  getOfflinePlaylist?: () => PlaylistData | undefined
  originLabel?: string
}

interface PlaybackChoiceState {
  candidates: PlaylistData[]
  offlinePlaylist?: PlaylistData
  originPlaylistId: null | string
  sermon: AudioPlayerData
}

/**
 * Owns the "where to play" chooser for a screen. A tap with real playlists
 * opens a dialog (optionally the offline collection first, then those
 * playlists); with no real playlists it starts the fallback playlist directly.
 * State lives on the screen so one dialog is mounted for the whole list.
 *
 * `getFallbackPlaylist` is required: zero candidates play it directly; it may
 * resolve asynchronously (history resolves the full playlist from sections).
 * `getOfflinePlaylist` is optional: when provided it becomes the first dialog
 * row ("all offline sermons") and is played when selected.
 * `originLabel` is optional: when provided, the candidate matching the
 * `openChoice` origin is highlighted and captioned with this text (history
 * marks "the playlist it was listened in"; offline passes nothing).
 *
 * Both option callbacks must be stable (`useCallback` at the call site) because
 * `openChoice` is passed to memoized rows.
 * @param root0 - Hook options.
 * @param root0.errorMessage - Message reported when playback fails.
 * @param root0.getFallbackPlaylist - Playlist played when no candidates exist.
 * @param root0.getOfflinePlaylist - Optional offline collection for the first row.
 * @param root0.originLabel - Caption for the highlighted origin candidate.
 */
export const usePlaybackChoice = ({
  errorMessage,
  getFallbackPlaylist,
  getOfflinePlaylist,
  originLabel,
}: PlaybackChoiceOptions) => {
  const ctx = useCtx()
  const playNewSermon = usePlayNewSermon()
  const [state, setState] = useState<null | PlaybackChoiceState>(null)

  const play = useCallback(
    async (playlist: PlaylistData, sermon: AudioPlayerData) => {
      try {
        await playNewSermon({ playlist, sermon })
      } catch (error) {
        reportError(error, errorMessage)
      }
    },
    [errorMessage, playNewSermon],
  )

  const startFallback = useCallback(
    async (sermon: AudioPlayerData, originPlaylist: null | PlaylistData) => {
      try {
        const fallback = await getFallbackPlaylist(sermon, originPlaylist)
        if (!fallback) return
        await play(fallback, sermon)
      } catch (error) {
        reportError(error, errorMessage)
      }
    },
    [errorMessage, getFallbackPlaylist, play],
  )

  const openChoice = useCallback(
    (sermon: AudioPlayerData, originPlaylist: null | PlaylistData = null) => {
      const candidates = collectPlaybackCandidates(ctx.get(myPlaylistsAtom), sermon, originPlaylist)

      if (candidates.length === 0) {
        void startFallback(sermon, originPlaylist)
        return
      }

      const originPlaylistId = originLabel && originPlaylist ? originPlaylist.id : null
      setState({
        candidates,
        offlinePlaylist: getOfflinePlaylist?.(),
        originPlaylistId,
        sermon,
      })
    },
    [ctx, getOfflinePlaylist, originLabel, startFallback],
  )

  const select = useCallback(
    (playlist: PlaylistData) => {
      if (!state) return
      setState(null)
      void play(playlist, state.sermon)
    },
    [play, state],
  )

  const close = useCallback(() => setState(null), [])

  const dialog = state ? (
    <PlaybackChoiceDialog
      visible
      onClose={close}
      onSelect={select}
      originLabel={originLabel}
      candidates={state.candidates}
      offlinePlaylist={state.offlinePlaylist}
      originPlaylistId={state.originPlaylistId}
    />
  ) : null

  return { dialog, openChoice }
}

import { useCallback, useState } from 'react'
import { usePlayNewSermon } from 'entities/player'
import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'
import { SermonPlaylistPicker } from '../ui/SermonPlaylistPicker'
import { resolvePlaylist } from './resolvePlaylist'

/**
 * Shared sermon-play chain for search results. A sermon that belongs to several
 * playlists opens a picker (no auto-play before the choice); 0/1 playlists play
 * immediately through `usePlayNewSermon`. Returns the modal element to render on
 * the screen, mirroring `useAddToPlaylistModal`.
 */
export const useSermonPlayback = () => {
  const playNewSermon = usePlayNewSermon()
  const [pendingSermon, setPendingSermon] = useState<null | SermonData>(null)

  const onSermonPress = useCallback(
    (sermon: SermonData) => {
      if ((sermon.playlists?.length ?? 0) > 1) {
        setPendingSermon(sermon)
        return
      }

      void playNewSermon({ playlist: resolvePlaylist(sermon), sermon })
    },
    [playNewSermon],
  )

  const closePicker = useCallback(() => setPendingSermon(null), [])

  const onSelectPlaylist = useCallback(
    (playlist: PlaylistData) => {
      if (!pendingSermon) return

      setPendingSermon(null)
      void playNewSermon({ playlist, sermon: pendingSermon })
    },
    [pendingSermon, playNewSermon],
  )

  const modal = pendingSermon ? (
    <SermonPlaylistPicker
      visible
      onClose={closePicker}
      onSelect={onSelectPlaylist}
      playlists={pendingSermon.playlists ?? []}
    />
  ) : null

  return { modal, onSermonPress }
}

import { useMemo } from 'react'
import { type PlaylistData } from 'entities/playlist'
import { PlaylistHeaderMenu } from './PlaylistHeaderMenu'
import { buildTracksListData } from './usePlaylistNavigationOptions'

/**
 * Mounts the playlist page header menu inside the player's playlist sheet.
 * The sheet lives in widgets, which may not import pages — the app layer
 * injects this component through the `playlistMenuComponent` slot.
 * @param root0 - Menu slot properties.
 * @param root0.playlist - Playlist whose header menu is opened.
 */
export const PlaylistSheetMenu = ({ playlist }: { playlist: PlaylistData }) => {
  const tracksData = useMemo(
    () => buildTracksListData(playlist.sermons, playlist.artwork),
    [playlist],
  )

  return (
    <PlaylistHeaderMenu
      playlist={playlist}
      tracksData={tracksData}
      playlistTitle={playlist.title}
      accessibilityLabel={`Меню плейлиста ${playlist.title}`}
    />
  )
}

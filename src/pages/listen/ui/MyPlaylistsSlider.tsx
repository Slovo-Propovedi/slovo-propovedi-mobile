import { Ionicons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { FAVORITES_PLAYLIST, loadMyPlaylists, myPlaylistsAtom } from 'entities/playlist'
import { getSliderItemWidth, Slider, SliderItemSize } from 'shared/ui'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { useListenNavigation } from '../lib/useListenNavigation'

const SECTION_TITLE = 'Мои плейлисты'
const ICON_SIZE_RATIO = 0.4

export const MyPlaylistsSlider = () => {
  const { currentTheme } = useTheme()
  const [playlists] = useAtom(myPlaylistsAtom)
  const loadPlaylists = useAction(loadMyPlaylists)
  const { navigateToPlaylist } = useListenNavigation()

  useEffect(() => {
    void loadPlaylists()
  }, [loadPlaylists])

  const iconSize = getSliderItemWidth(SliderItemSize.Small) * ICON_SIZE_RATIO
  const heartIcon = <Ionicons name='heart' size={iconSize} color={currentTheme.primary} />

  return (
    <Slider
      title={SECTION_TITLE}
      itemsSize={SliderItemSize.Small}
      style={{ paddingHorizontal: INDENTS.middle }}
      onPressItem={playlist =>
        navigateToPlaylist({
          artwork: null,
          id: playlist.id,
          sermons: [],
          title: playlist.title,
        })
      }
      items={playlists.map(playlist => ({
        artwork: null,
        artworkIcon: playlist.id === FAVORITES_PLAYLIST.id ? heartIcon : undefined,
        data: playlist,
        description: playlist.title,
      }))}
    />
  )
}

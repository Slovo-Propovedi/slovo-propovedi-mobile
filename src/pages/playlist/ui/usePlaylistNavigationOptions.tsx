import { useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { type ColorValue } from 'react-native'
import { PlaylistCacheMenu } from 'features/playlist-cache'
import { type SermonData } from 'shared/model'

export type TracksListData = ReturnType<typeof buildTracksListData>

export const buildTracksListData = (list: SermonData[], artwork: string) =>
  list.map(sermon => ({
    artist: sermon.artist,
    artwork,
    audioUrl: sermon.audioUrl,
    id: sermon.id,
    title: sermon.title,
  }))

export const usePlaylistNavigationOptions = ({
  headerIconColor,
  isCaching,
  title,
  tracksListData,
}: {
  headerIconColor: ColorValue
  isCaching: boolean
  title: string
  tracksListData: TracksListData
}) => {
  const navigation = useNavigation()

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <PlaylistCacheMenu
          disabled={isCaching}
          playlistTitle={title}
          tracksData={tracksListData}
          iconColor={headerIconColor}
        />
      ),
    })

    return () => {
      navigation.setOptions({ headerRight: undefined })
    }
  }, [navigation, isCaching, title, tracksListData, headerIconColor])
}

import { useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { type ColorValue } from 'react-native'
import { formatSermonReference } from 'shared/lib/format'
import { type SermonData } from 'shared/model'
import { PlaylistCacheMenu } from './PlaylistCacheMenu'

export type TracksListData = ReturnType<typeof buildTracksListData>

export const buildTracksListData = (list: SermonData[], artwork: string) =>
  list.map(sermon => ({
    artwork,
    audioUrl: sermon.audioUrl,
    id: sermon.id,
    subtitle: formatSermonReference({
      book: sermon.book,
      chapter: sermon.chapter,
      verse: sermon.verse,
    }),
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

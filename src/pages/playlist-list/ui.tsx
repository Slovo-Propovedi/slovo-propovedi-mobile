import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ListItemSize, TouchableListItem } from 'shared/ui'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/themed'
import type { PlaylistData } from 'shared/model'
import type { OnPressTouchableListItem } from 'shared/ui'

export const PlaylistListScreen = () => {
  const { top } = useSafeAreaInsets()
  const { currentTheme } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ playlists: string; title: string }>()

  const playlists = params.playlists
    ? (JSON.parse(params.playlists as string) as PlaylistData[])
    : []
  const title = params.title || ''

  const onPressListItem: OnPressTouchableListItem<PlaylistData> = playlist => {
    router.push({
      params: { playlist: JSON.stringify(playlist) },
      pathname: '/listen/playlist',
    })
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.titleContainer, { top }]}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
      </View>

      <View style={styles.list}>
        {playlists.map(playlist => (
          <TouchableListItem<{ artwork: string; title: string }>
            key={playlist.title}
            size={ListItemSize.Middle}
            data={playlist as { artwork: string; title: string }}
            onPress={
              onPressListItem as OnPressTouchableListItem<{ artwork: string; title: string }>
            }
          />
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: { paddingLeft: INDENTS.high },
  title: {
    fontSize: FONT_SIZES.h1,
    paddingVertical: INDENTS.high,
  },
  titleContainer: {
    alignItems: 'center',
    paddingBottom: INDENTS.high,
  },
})

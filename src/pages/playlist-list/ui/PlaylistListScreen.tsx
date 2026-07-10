import { useLocalSearchParams, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { getParseJsonWithSchema, playlistsArraySchema } from 'shared/model'
import { useCollapsingNavbarDriver } from 'shared/ui/collapsing-navbar-driver'
import { FONT_SIZES, INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/themed'
import type { PlaylistData } from 'shared/model'
import { useCollapsingHeader } from '../lib'
import { ALBUM_ART_SIZE, PlaylistListItem } from './PlaylistListItem'

const TITLE_TOP_GAP = 80
const DIVIDER_LEFT_OFFSET = ALBUM_ART_SIZE + INDENTS.medium + INDENTS.medium
const parsePlaylists = getParseJsonWithSchema(playlistsArraySchema)

export const PlaylistListScreen = () => {
  const { currentTheme, isLight } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ playlists: string; title: string }>()

  const playlists = parsePlaylists(params.playlists ?? null) ?? []
  const title = params.title || ''

  const { darkenStart, headerHeight, onTitleLayout, scrollHandler, scrollY, titleAppearThreshold } =
    useCollapsingHeader()

  useCollapsingNavbarDriver({ darkenStart, scrollY, threshold: titleAppearThreshold, title })

  const handlePlaylistPress = (playlist: PlaylistData) => {
    router.push({
      params: { playlist: JSON.stringify(playlist) },
      pathname: '/listen/playlist',
    })
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <Animated.FlatList
        data={playlists}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Нет плейлистов</Text>}
        contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + TITLE_TOP_GAP }]}
        renderItem={({ item }) => (
          <PlaylistListItem playlist={item} onPress={() => handlePlaylistPress(item)} />
        )}
        ListHeaderComponent={
          <View onLayout={onTitleLayout} style={styles.titleContainer}>
            <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
          </View>
        }
        ItemSeparatorComponent={() => (
          <View
            style={{
              backgroundColor: currentTheme.surface,
              height: 1,
              marginLeft: DIVIDER_LEFT_OFFSET,
              marginVertical: INDENTS.low,
            }}
          />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyText: {
    color: 'grey',
    marginHorizontal: 'auto',
    marginTop: INDENTS.high,
  },
  listContent: {
    paddingBottom: PLAYER_SIZES.tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
    paddingHorizontal: INDENTS.medium,
  },
  title: {
    fontSize: FONT_SIZES.h1,
  },
  titleContainer: {
    alignItems: 'center',
    paddingBottom: INDENTS.high,
  },
})

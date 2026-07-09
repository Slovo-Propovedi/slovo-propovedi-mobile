import { useLocalSearchParams, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { ListItemSize, TouchableListItem } from 'shared/ui'
import { useCollapsingNavbarDriver } from 'shared/ui/collapsing-navbar-driver'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/themed'
import type { PlaylistData } from 'shared/model'
import type { OnPressTouchableListItem } from 'shared/ui'
import { useCollapsingHeader } from './lib'

const TITLE_TOP_GAP = 80

export const PlaylistListScreen = () => {
  const { currentTheme, isLight } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ playlists: string; title: string }>()

  const playlists = params.playlists
    ? (JSON.parse(params.playlists as string) as PlaylistData[])
    : []
  const title = params.title || ''

  const { darkenStart, headerHeight, onTitleLayout, scrollHandler, scrollY, titleAppearThreshold } =
    useCollapsingHeader()

  useCollapsingNavbarDriver({ darkenStart, scrollY, threshold: titleAppearThreshold, title })

  const onPressListItem: OnPressTouchableListItem<PlaylistData> = playlist => {
    router.push({
      params: { playlist: JSON.stringify(playlist) },
      pathname: '/listen/playlist',
    })
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: headerHeight + TITLE_TOP_GAP }}
      >
        <View onLayout={onTitleLayout} style={styles.titleContainer}>
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
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: { paddingLeft: INDENTS.high, paddingTop: INDENTS.high },
  title: {
    fontSize: FONT_SIZES.h1,
  },
  titleContainer: {
    alignItems: 'center',
  },
})

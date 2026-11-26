import { StatusBar, type StatusBarStyle } from 'expo-status-bar'
import { type ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useCollapsingNavbarDriver } from 'shared/ui/collapsing-navbar-driver'
import { useScreenChromePadding } from 'shared/ui/layout'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { TITLE_TOP_GAP, useCollapsingHeader } from '../lib/useCollapsingHeader'
import { type PlaylistListItemData } from '../model'
import { PlaylistListItem } from './PlaylistListItem'
import { PlaylistListSeparator } from './PlaylistListSeparator'

const INITIAL_NUM_TO_RENDER = 12
const EMPTY_TEXT = 'Нет плейлистов'

// Список плейлистов со схлопывающимся контентным заголовком — общее тело
// серверного списка секции и просмотрового режима «Мои плейлисты». Нативная
// шапка прозрачна, поэтому заголовок является первым элементом списка и
// передаётся драйверу навбара (появляется при скролле). Нижний контентный
// отступ резервирует место под плавающий мини-плеер и таб-бар.
export const PlaylistList = ({
  listFooter,
  onPressPlaylist,
  playlists,
  title,
}: {
  listFooter?: ReactElement
  onPressPlaylist: (item: PlaylistListItemData) => void
  playlists: PlaylistListItemData[]
  title: string
}) => {
  const { currentTheme, isLight } = useTheme()
  const { bottomChromeHeight } = useScreenChromePadding()
  const { darkenStart, headerHeight, onTitleLayout, scrollHandler, scrollY, titleAppearThreshold } =
    useCollapsingHeader()

  useCollapsingNavbarDriver({ darkenStart, scrollY, threshold: titleAppearThreshold, title })

  const statusBarStyle: StatusBarStyle = isLight ? 'dark' : 'light'

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar style={statusBarStyle} />
      <Animated.FlatList
        data={playlists}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyExtractor={item => item.id}
        ListFooterComponent={listFooter}
        initialNumToRender={INITIAL_NUM_TO_RENDER}
        ItemSeparatorComponent={PlaylistListSeparator}
        renderItem={({ item }) => (
          <PlaylistListItem item={item} onPress={() => onPressPlaylist(item)} />
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>{EMPTY_TEXT}</Text>
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: bottomChromeHeight + INDENTS.low,
            paddingTop: headerHeight + TITLE_TOP_GAP,
          },
        ]}
        ListHeaderComponent={
          <View onLayout={onTitleLayout} style={styles.titleContainer}>
            <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyText: { fontSize: FONT_SIZES.md, marginHorizontal: 'auto', marginTop: INDENTS.high },
  listContent: {
    paddingHorizontal: INDENTS.medium,
  },
  title: { fontSize: FONT_SIZES.h1 },
  titleContainer: { alignItems: 'center', paddingBottom: INDENTS.high },
})

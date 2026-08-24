import { useAtom } from '@reatom/npm-react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StatusBar, type StatusBarStyle } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { dynamicSectionsAtom } from 'entities/section'
import { useCollapsingNavbarDriver } from 'shared/ui/collapsing-navbar-driver'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { FONT_SIZES, INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import type { PlaylistData, SectionData } from 'shared/model'
import { useCollapsingHeader } from '../lib'
import { resolveSectionFromCache } from '../lib/resolveSectionFromCache'
import { PlaylistListItem } from './PlaylistListItem'
import { PlaylistListSeparator } from './PlaylistListSeparator'

const TITLE_TOP_GAP = 80
const INITIAL_NUM_TO_RENDER = 12

export const PlaylistListScreen = () => {
  const { currentTheme, isLight } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ sectionId: string; title: string }>()
  const sectionId = params.sectionId ?? ''
  const title = params.title || ''

  const [sections] = useAtom(dynamicSectionsAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const [cachedSection, setCachedSection] = useState<SectionData | undefined>(undefined)
  const [cacheResolved, setCacheResolved] = useState(false)

  const section = sections.find(s => s.id === sectionId) ?? cachedSection

  useEffect(() => {
    if (section || !sectionId) return
    let cancelled = false
    void resolveSectionFromCache(sectionId).then(result => {
      if (!cancelled) {
        setCachedSection(result)
        setCacheResolved(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [section, sectionId])

  const playlists = section?.playlists ?? []
  const { darkenStart, headerHeight, onTitleLayout, scrollHandler, scrollY, titleAppearThreshold } =
    useCollapsingHeader()

  useCollapsingNavbarDriver({ darkenStart, scrollY, threshold: titleAppearThreshold, title })

  const handlePlaylistPress = useCallback(
    (playlist: PlaylistData) => {
      router.push({ params: { playlist: JSON.stringify(playlist) }, pathname: '/listen/playlist' })
    },
    [router],
  )

  const statusBarStyle: StatusBarStyle = isLight ? 'dark' : 'light'
  const bgColor = { backgroundColor: currentTheme.background }

  if (!sectionId || (!section && cacheResolved))
    return (
      <View style={[styles.centered, bgColor]}>
        <StatusBar style={statusBarStyle} />
        <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>Секция не найдена</Text>
      </View>
    )

  if (!section)
    return (
      <View style={[styles.centered, bgColor]}>
        <StatusBar style={statusBarStyle} />
        <ActivityIndicator size='large' color={currentTheme.primary} />
      </View>
    )

  return (
    <View style={[styles.container, bgColor]}>
      <StatusBar style={statusBarStyle} />
      <Animated.FlatList
        data={playlists}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyExtractor={item => item.id}
        initialNumToRender={INITIAL_NUM_TO_RENDER}
        ItemSeparatorComponent={PlaylistListSeparator}
        renderItem={({ item }) => (
          <PlaylistListItem playlist={item} onPress={() => handlePlaylistPress(item)} />
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>Нет плейлистов</Text>
        }
        ListHeaderComponent={
          <View onLayout={onTitleLayout} style={styles.titleContainer}>
            <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
            paddingTop: headerHeight + TITLE_TOP_GAP,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  container: { flex: 1 },
  emptyText: { fontSize: FONT_SIZES.md, marginHorizontal: 'auto', marginTop: INDENTS.high },
  listContent: {
    paddingHorizontal: INDENTS.medium,
  },
  title: { fontSize: FONT_SIZES.h1 },
  titleContainer: { alignItems: 'center', paddingBottom: INDENTS.high },
})

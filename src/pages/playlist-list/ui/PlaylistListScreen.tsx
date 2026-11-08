import { useAtom } from '@reatom/npm-react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StatusBar, type StatusBarStyle } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { PlaylistList, type PlaylistListItemData } from 'widgets/playlist-list'
import { type PlaylistData } from 'entities/playlist'
import { dynamicSectionsAtom, type SectionData } from 'entities/section'
import { useNavigationGuard } from 'shared/routing'
import { BLUR_TARGET_ROUTES, BlurBackdrop } from 'shared/ui'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { resolveSectionFromCache } from '../lib/resolveSectionFromCache'

const toPlaylistListItem = (playlist: PlaylistData): PlaylistListItemData => ({
  artwork: playlist.artwork,
  id: playlist.id,
  subtitle: playlist.description,
  title: playlist.title,
})

export const PlaylistListScreen = () => {
  const { currentTheme, isLight } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ sectionId: string }>()
  const sectionId = params.sectionId ?? ''

  const [sections] = useAtom(dynamicSectionsAtom)
  const [cachedSection, setCachedSection] = useState<SectionData | undefined>(undefined)
  const [cacheResolved, setCacheResolved] = useState(false)
  const runGuarded = useNavigationGuard()

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

  const handlePlaylistPress = useCallback(
    (item: PlaylistListItemData) => {
      runGuarded(() => {
        router.push({ params: { playlist: item.id }, pathname: '/listen/playlist' })
      })
    },
    [router, runGuarded],
  )

  const statusBarStyle: StatusBarStyle = isLight ? 'dark' : 'light'
  const bgColor = { backgroundColor: currentTheme.background }

  if (!sectionId || (!section && cacheResolved))
    return (
      <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.playlistList}>
        <View style={[styles.centered, bgColor]}>
          <StatusBar style={statusBarStyle} />
          <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>
            Секция не найдена
          </Text>
        </View>
      </BlurBackdrop>
    )

  if (!section)
    return (
      <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.playlistList}>
        <View style={[styles.centered, bgColor]}>
          <StatusBar style={statusBarStyle} />
          <ActivityIndicator size='large' color={currentTheme.primary} />
        </View>
      </BlurBackdrop>
    )

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.playlistList}>
      <PlaylistList
        title={section.title ?? ''}
        onPressPlaylist={handlePlaylistPress}
        playlists={(section.playlists ?? []).map(toPlaylistListItem)}
      />
    </BlurBackdrop>
  )
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  emptyText: { fontSize: FONT_SIZES.md, marginHorizontal: 'auto', marginTop: INDENTS.high },
})

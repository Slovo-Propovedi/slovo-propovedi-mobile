import { useLocalSearchParams, usePathname } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { useScreenTransitionTracking } from 'shared/routing'
import { useHeaderTitle } from 'shared/routing/useHeaderTitle'
import { BlurBackdrop, EmptyState } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { usePreacherSermons } from '../lib/usePreacherSermons'
import { PreacherSermonsList } from './PreacherSermonsList'

// Mirrors the server's `artist` / `search` maxLength: a longer param cannot
// name a real preacher and must not reach `GET /sermons`.
const MAX_ARTIST_LENGTH = 200
const INVALID_ARTIST_MESSAGE = 'Проповедник не найден'

const parseArtist = (param: string | string[] | undefined): null | string => {
  if (typeof param !== 'string') return null

  const artist = param.trim()
  if (!artist || artist.length > MAX_ARTIST_LENGTH) return null

  return artist
}

export const PreacherScreen = () => {
  const { artist: artistParam } = useLocalSearchParams<{ artist?: string }>()
  // The blur target is keyed by the CURRENT path: the screen is mounted from
  // both the listen stack and the search route, and the chrome resolves the
  // target by `usePathname()`.
  const pathname = usePathname()
  const artist = parseArtist(artistParam)
  const setHeaderTitle = useHeaderTitle()
  useScreenTransitionTracking()
  const { currentTheme } = useTheme()
  const { hasMore, isLoading, isLoadingMore, items, loadMore, loadMoreFailed } = usePreacherSermons(
    artist ?? '',
  )

  useEffect(() => {
    if (artist) setHeaderTitle(artist)
  }, [artist, setHeaderTitle])

  return (
    <BlurBackdrop routeKey={pathname}>
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        {artist ? (
          <PreacherSermonsList
            items={items}
            hasMore={hasMore}
            loadMore={loadMore}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            loadMoreFailed={loadMoreFailed}
          />
        ) : (
          <EmptyState message={INVALID_ARTIST_MESSAGE} />
        )}
      </View>
    </BlurBackdrop>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

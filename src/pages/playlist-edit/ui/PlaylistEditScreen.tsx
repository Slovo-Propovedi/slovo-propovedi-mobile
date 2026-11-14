import { useAction, useAtom } from '@reatom/npm-react'
import { useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  FAVORITES_PLAYLIST,
  loadMyPlaylists,
  myPlaylistsAtom,
  myPlaylistsLoadedAtom,
} from 'entities/playlist'
import { BLUR_TARGET_ROUTES, BlurBackdrop, EmptyState } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { PlaylistEditForm } from './PlaylistEditForm'

const NOT_FOUND_MESSAGE = 'Плейлист не найден'

/**
 * Экран редактирования локального (пользовательского) плейлиста.
 *
 * Открывается из шапки экрана плейлиста (`PlaylistEditButton`) по параметру
 * `playlist` — id редактируемого плейлиста. Плейлист берётся из
 * `myPlaylistsAtom`; при необходимости атом догидратируется. «Избранные» и
 * неизвестный id считаются ненайденными: редактировать их нельзя.
 */
export const PlaylistEditScreen = () => {
  const params = useLocalSearchParams<{ playlist: string }>()
  const playlistId = params.playlist ?? ''
  const { currentTheme } = useTheme()
  const [playlists] = useAtom(myPlaylistsAtom)
  const [isLoaded] = useAtom(myPlaylistsLoadedAtom)
  const loadPlaylists = useAction(loadMyPlaylists)

  useEffect(() => {
    if (!isLoaded) void loadPlaylists()
  }, [isLoaded, loadPlaylists])

  const playlist = playlists.find(
    item => item.id === playlistId && item.id !== FAVORITES_PLAYLIST.id,
  )

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.playlistEdit}>
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: currentTheme.background }]}
      >
        {playlist ? (
          <PlaylistEditForm playlist={playlist} />
        ) : isLoaded ? (
          <View style={styles.centered}>
            <EmptyState message={NOT_FOUND_MESSAGE} />
          </View>
        ) : null}
      </SafeAreaView>
    </BlurBackdrop>
  )
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  container: { flex: 1 },
})

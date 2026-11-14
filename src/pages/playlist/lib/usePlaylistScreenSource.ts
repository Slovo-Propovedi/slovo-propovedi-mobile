import { useLocalSearchParams } from 'expo-router'
import { useCustomPlaylistImport } from './useCustomPlaylistImport'
import { useHydrateMyPlaylists } from './useHydrateMyPlaylists'
import { usePlaylistById } from './usePlaylistById'

/**
 * Resolves the playlist a `PlaylistScreen` must render from the route params.
 *
 * A `custom` share link wins over any stale `playlist` param: the import
 * resolves the target id itself and leaves the share params in place (the
 * address bar keeps the shareable link). While it is in flight there is no
 * usable id yet — the screen renders the loading state instead of a premature
 * not-found. Once resolved, the id points at the local playlist, which tier 0
 * builds from the hydrated atom.
 */
export const usePlaylistScreenSource = () => {
  const params = useLocalSearchParams<{ custom?: string; playlist: string }>()

  useHydrateMyPlaylists()

  const { importedPlaylistId } = useCustomPlaylistImport()

  const isImportingCustomPlaylist = params.custom !== undefined && importedPlaylistId === null
  const playlistId =
    importedPlaylistId ?? (isImportingCustomPlaylist ? '' : (params.playlist ?? ''))
  const { isLoading, notFound, playlist } = usePlaylistById(playlistId)

  return { isImportingCustomPlaylist, isLoading, notFound, playlist }
}

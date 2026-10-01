import { useAtom } from '@reatom/npm-react'
import { useEffect, useMemo, useState } from 'react'
import {
  FAVORITES_PLAYLIST,
  type LocalPlaylistData,
  myPlaylistsAtom,
  type PlaylistData,
} from 'entities/playlist'
import { dynamicSectionsAtom } from 'entities/section'
import { resolvePlaylistFromApi } from './resolvePlaylistFromApi'
import { resolvePlaylistFromCache } from './resolvePlaylistFromCache'

interface PlaylistResolution {
  playlist: PlaylistData | undefined
  playlistId: string
  tier: ResolvedTier
}

type ResolvedTier = 'api' | 'cache' | 'sections' | null

// Tier 0: локальный «Избранные» резолвится сразу, без сети и кэша. Пустой
// снапшот-лист падает в `FAVORITES_PLAYLIST_DATA` (пустой плейлист-заглушка).
const FAVORITES_PLAYLIST_DATA: PlaylistData = {
  artwork: null,
  description: '',
  id: FAVORITES_PLAYLIST.id,
  sermons: [],
  title: FAVORITES_PLAYLIST.title,
}

const buildFavoritesPlaylist = (local: LocalPlaylistData | undefined): PlaylistData => {
  const sermons = local?.sermons ?? []
  if (sermons.length === 0) return FAVORITES_PLAYLIST_DATA
  return {
    artwork: null,
    description: '',
    id: FAVORITES_PLAYLIST.id,
    sermons,
    title: FAVORITES_PLAYLIST.title,
  }
}

export const usePlaylistById = (playlistId: string) => {
  const isFavorites = playlistId === FAVORITES_PLAYLIST.id
  const [sections] = useAtom(dynamicSectionsAtom)
  const [localPlaylists] = useAtom(myPlaylistsAtom)
  const [resolution, setResolution] = useState<PlaylistResolution>({
    playlist: undefined,
    playlistId: '',
    tier: null,
  })

  const favorites = useMemo(
    () =>
      isFavorites
        ? buildFavoritesPlaylist(localPlaylists.find(p => p.id === FAVORITES_PLAYLIST.id))
        : undefined,
    [isFavorites, localPlaylists],
  )

  const playlistFromSections = useMemo(
    () => sections.flatMap(s => s.playlists ?? []).find(p => p.id === playlistId),
    [sections, playlistId],
  )

  useEffect(() => {
    if (!playlistId || playlistFromSections || isFavorites) return
    let cancelled = false

    void (async () => {
      const cachedPlaylist = await resolvePlaylistFromCache(playlistId)
      if (cancelled) return
      if (cachedPlaylist) {
        setResolution({ playlist: cachedPlaylist, playlistId, tier: 'cache' })
        return
      }

      const apiPlaylist = await resolvePlaylistFromApi(playlistId)
      if (cancelled) return
      setResolution({ playlist: apiPlaylist, playlistId, tier: 'api' })
    })()

    return () => {
      cancelled = true
    }
  }, [isFavorites, playlistFromSections, playlistId])

  if (isFavorites) return { isLoading: false, notFound: false, playlist: favorites }

  const currentResolution = resolution.playlistId === playlistId ? resolution : null
  const playlist = playlistFromSections ?? currentResolution?.playlist
  const resolvedTier: ResolvedTier = playlistFromSections
    ? 'sections'
    : (currentResolution?.tier ?? null)
  const notFound = !playlistId || (!playlist && resolvedTier !== null)
  const isLoading = !playlist && !notFound

  return { isLoading, notFound, playlist }
}

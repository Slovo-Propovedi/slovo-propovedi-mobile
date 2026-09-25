import { useAtom } from '@reatom/npm-react'
import { useEffect, useMemo, useState } from 'react'
import { dynamicSectionsAtom } from 'entities/section'
import { type PlaylistData } from 'shared/model'
import { resolvePlaylistFromApi } from './resolvePlaylistFromApi'
import { resolvePlaylistFromCache } from './resolvePlaylistFromCache'

interface PlaylistResolution {
  playlist: PlaylistData | undefined
  playlistId: string
  tier: ResolvedTier
}

type ResolvedTier = 'api' | 'cache' | 'sections' | null

export const usePlaylistById = (playlistId: string) => {
  const [sections] = useAtom(dynamicSectionsAtom)
  const [resolution, setResolution] = useState<PlaylistResolution>({
    playlist: undefined,
    playlistId: '',
    tier: null,
  })

  const playlistFromSections = useMemo(
    () => sections.flatMap(s => s.playlists ?? []).find(p => p.id === playlistId),
    [sections, playlistId],
  )

  useEffect(() => {
    if (!playlistId || playlistFromSections) return
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
  }, [playlistFromSections, playlistId])

  const currentResolution = resolution.playlistId === playlistId ? resolution : null
  const playlist = playlistFromSections ?? currentResolution?.playlist
  const resolvedTier: ResolvedTier = playlistFromSections
    ? 'sections'
    : (currentResolution?.tier ?? null)
  const notFound = !playlistId || (!playlist && resolvedTier !== null)
  const isLoading = !playlist && !notFound

  return { isLoading, notFound, playlist }
}

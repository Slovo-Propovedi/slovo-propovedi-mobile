import { useAtom } from '@reatom/npm-react'
import { useEffect, useMemo, useState } from 'react'
import { dynamicSectionsAtom } from 'entities/section'
import { type PlaylistData } from 'shared/model'
import { resolvePlaylistFromCache } from './resolvePlaylistFromCache'

export const usePlaylistById = (playlistId: string) => {
  const [sections] = useAtom(dynamicSectionsAtom)
  const [cachedPlaylist, setCachedPlaylist] = useState<PlaylistData | undefined>(undefined)
  const [cacheResolved, setCacheResolved] = useState(false)

  const playlistFromSections = useMemo(
    () => sections.flatMap(s => s.playlists ?? []).find(p => p.id === playlistId),
    [sections, playlistId],
  )

  useEffect(() => {
    if (playlistFromSections || !playlistId) return
    let cancelled = false
    void resolvePlaylistFromCache(playlistId).then(result => {
      if (!cancelled) {
        setCachedPlaylist(result)
        setCacheResolved(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [playlistFromSections, playlistId])

  const playlist = playlistFromSections ?? cachedPlaylist
  const notFound = !playlistId || (!playlist && cacheResolved)
  const isLoading = !playlist && !notFound

  return { isLoading, notFound, playlist }
}

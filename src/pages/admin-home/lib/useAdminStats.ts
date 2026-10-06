import { useCallback, useEffect, useState } from 'react'
import { playlistsApi, sectionsApi, sermonsApi } from 'shared/api'
import { useSilentRefetchOnFocus } from 'shared/lib/hooks/useSilentRefetchOnFocus'

export interface AdminStats {
  isLoading: boolean
  playlists: null | number
  sections: null | number
  sermons: null | number
}

const INITIAL_STATS: AdminStats = {
  isLoading: true,
  playlists: null,
  sections: null,
  sermons: null,
}

/**
 * On silent refocus a failed request resolves to `null` (see `fetchStats`), so a
 * flaky endpoint would otherwise wipe a good counter. Keep the previous value for
 * failed fields; successful fields always win.
 * @param previous - Stats currently on screen.
 * @param next - Freshly fetched stats (`null` marks a failed request).
 */
const mergeStats = (previous: AdminStats, next: AdminStats): AdminStats => ({
  isLoading: false,
  playlists: next.playlists ?? previous.playlists,
  sections: next.sections ?? previous.sections,
  sermons: next.sermons ?? previous.sermons,
})

/** Счётчики сущностей для главной админки: каждый запрос независим (allSettled). */
export const useAdminStats = (): AdminStats => {
  const [stats, setStats] = useState(INITIAL_STATS)

  const fetchStats = useCallback(async (): Promise<AdminStats> => {
    const [sections, playlists, sermons] = await Promise.allSettled([
      sectionsApi.getSections().sectionControllerFindAll(),
      playlistsApi.getPlaylists().playlistControllerFindAll(),
      sermonsApi.getSermons().sermonControllerFindAll(),
    ])

    return {
      isLoading: false,
      playlists: playlists.status === 'fulfilled' ? playlists.value.count : null,
      sections: sections.status === 'fulfilled' ? sections.value.count : null,
      sermons:
        sermons.status === 'fulfilled'
          ? (sermons.value.count ?? sermons.value.sermons.length)
          : null,
    }
  }, [])

  useEffect(() => {
    let isActive = true

    void fetchStats().then(nextStats => {
      if (isActive) setStats(nextStats)
    })

    return () => {
      isActive = false
    }
  }, [fetchStats])

  useSilentRefetchOnFocus(
    useCallback(async () => {
      const next = await fetchStats()
      setStats(previous => mergeStats(previous, next))
    }, [fetchStats]),
  )

  return stats
}

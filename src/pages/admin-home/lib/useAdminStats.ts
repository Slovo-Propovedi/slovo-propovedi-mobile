import { useEffect, useState } from 'react'
import { playlistsApi, sectionsApi, sermonsApi } from 'shared/api'

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

/** Счётчики сущностей для главной админки: каждый запрос независим (allSettled). */
export const useAdminStats = (): AdminStats => {
  const [stats, setStats] = useState(INITIAL_STATS)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      const [sections, playlists, sermons] = await Promise.allSettled([
        sectionsApi.getSections().sectionControllerFindAll(),
        playlistsApi.getPlaylists().playlistControllerFindAll(),
        sermonsApi.getSermons().sermonControllerFindAll(),
      ])

      if (!isActive) return

      setStats({
        isLoading: false,
        playlists: playlists.status === 'fulfilled' ? playlists.value.count : null,
        sections: sections.status === 'fulfilled' ? sections.value.count : null,
        sermons:
          sermons.status === 'fulfilled'
            ? (sermons.value.count ?? sermons.value.sermons.length)
            : null,
      })
    }

    void load()

    return () => {
      isActive = false
    }
  }, [])

  return stats
}

import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { usePlayNewSermon } from 'entities/player'
import { useOfflineRetry } from 'shared/lib/network'
import { useListenNavigation } from 'shared/routing'
import type { PlaylistData } from 'shared/model'
import {
  dynamicSectionsAtom,
  fetchAllSections,
  isLoadingSectionsAtom,
  sectionDataSourceAtom,
} from '../model'
import { renderSection } from './renderSection'
import { SectionsSkeleton } from './skeleton'

export const DynamicSectionsSlider = () => {
  const playNewSermon = usePlayNewSermon()
  const { navigateToPlaylist, navigateToPlaylistList } = useListenNavigation()
  const [sections] = useAtom(dynamicSectionsAtom)
  const [isLoading] = useAtom(isLoadingSectionsAtom)
  const [dataSource] = useAtom(sectionDataSourceAtom)
  const fetchSections = useAction(fetchAllSections)

  useEffect(() => {
    void fetchSections()
  }, [fetchSections])

  useOfflineRetry({
    fetchFn: fetchSections,
    hasCachedData: dataSource === 'cache',
    isLoading,
    needsRetry: dataSource !== 'network',
  })

  const onItemPress = (playlist: PlaylistData) => {
    if (playlist.sermons.length && playlist.sermons.length < 2)
      return playNewSermon({ playlist, sermon: playlist.sermons[0] })

    navigateToPlaylist(playlist)
  }

  if (isLoading && sections.length === 0) return <SectionsSkeleton />

  return (
    <>
      {sections.map((section, index) =>
        renderSection({ index, navigateToPlaylistList, onItemPress, section }),
      )}
    </>
  )
}

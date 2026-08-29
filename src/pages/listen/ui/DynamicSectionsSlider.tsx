import { useAction, useAtom } from '@reatom/npm-react'
import { type ReactElement, useEffect } from 'react'
import { usePlayNewSermon } from 'entities/player'
import { useOfflineRetry } from 'shared/lib/network'
import { useListenNavigation } from 'shared/routing'
import { EmptyState } from 'shared/ui'
import type { PlaylistData, SectionData } from 'shared/model'
import {
  dynamicSectionsAtom,
  fetchAllSections,
  isLoadingSectionsAtom,
  sectionDataSourceAtom,
} from '../model'
import { FirstSectionRow } from './FirstSectionRow'
import { renderSection } from './renderSection'
import { SectionsSkeleton } from './skeleton'

interface DynamicSectionsSliderProps {
  leadingElement?: ReactElement
}

export const DynamicSectionsSlider = ({ leadingElement }: DynamicSectionsSliderProps) => {
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

  const renderSectionAt = (section: SectionData, index: number) =>
    renderSection({ index, navigateToPlaylistList, onItemPress, section })

  const renderSectionsFrom = (fromIndex: number) =>
    sections.slice(fromIndex).map((section, offset) => renderSectionAt(section, fromIndex + offset))

  if (leadingElement) {
    if (sections.length === 0) {
      if (isLoading)
        return (
          <>
            <FirstSectionRow
              leadingElement={leadingElement}
              right={<SectionsSkeleton count={1} />}
            />
            <SectionsSkeleton from={1} />
          </>
        )

      return <FirstSectionRow right={<EmptyState />} leadingElement={leadingElement} />
    }

    return (
      <>
        <FirstSectionRow leadingElement={leadingElement} right={renderSectionAt(sections[0], 0)} />
        {renderSectionsFrom(1)}
      </>
    )
  }

  if (sections.length === 0) return isLoading ? <SectionsSkeleton /> : <EmptyState />

  return <>{renderSectionsFrom(0)}</>
}

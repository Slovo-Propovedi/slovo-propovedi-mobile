import { useAction, useAtom } from '@reatom/npm-react'
import { type ReactElement, useEffect } from 'react'
import { usePlayNewSermon } from 'entities/player'
import { useOfflineRetry } from 'shared/lib/network'
import { useListenNavigation } from 'shared/routing'
import { EmptyState } from 'shared/ui'
import type { PlaylistData, SectionData } from 'shared/model'
import { getFirstSectionLayout } from '../lib/first-section-layout'
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
      if (isLoading) {
        const layout = getFirstSectionLayout(sections, isLoading)

        return (
          <>
            <FirstSectionRow
              button={leadingElement}
              stacked={layout.stacked}
              section={<SectionsSkeleton count={1} />}
              sectionMinWidth={layout.sectionMinWidth}
            />
            <SectionsSkeleton from={1} />
          </>
        )
      }

      return <FirstSectionRow button={leadingElement} section={<EmptyState />} />
    }

    const layout = getFirstSectionLayout(sections, isLoading)

    return (
      <>
        <FirstSectionRow
          button={leadingElement}
          stacked={layout.stacked}
          sectionMinWidth={layout.sectionMinWidth}
          section={renderSectionAt(sections[0], 0)}
        />
        {renderSectionsFrom(1)}
      </>
    )
  }

  if (sections.length === 0) return isLoading ? <SectionsSkeleton /> : <EmptyState />

  return <>{renderSectionsFrom(0)}</>
}

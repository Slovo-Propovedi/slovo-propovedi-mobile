import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { OnboardingTarget } from 'features/onboarding'
import { type PlaylistData } from 'entities/playlist'
import {
  dynamicSectionsAtom,
  fetchAllSections,
  isLoadingSectionsAtom,
  type SectionData,
  sectionDataSourceAtom,
} from 'entities/section'
import { useOfflineRetry } from 'shared/lib/network'
import { EmptyState } from 'shared/ui'
import { useListenNavigation } from '../lib/useListenNavigation'
import { renderSection } from './renderSection'
import { SectionsSkeleton } from './skeleton'

export const DynamicSectionsSlider = ({ onboardingTargetId }: { onboardingTargetId?: string }) => {
  const { navigateToPlaylist, navigateToPlaylistList } = useListenNavigation()
  const [sections] = useAtom(dynamicSectionsAtom)
  const [isLoading] = useAtom(isLoadingSectionsAtom)
  const [dataSource] = useAtom(sectionDataSourceAtom)
  const fetchSections = useAction(fetchAllSections)

  // Revalidate unless sections already came from the network. Startup hydration
  // (`hydrateCachedSections`) usually commits the cache before this mounts, so
  // `'cache'` must still trigger a request — otherwise a reload shows stale data
  // until the 30s retry. A remount after a network load (the sliders unmount
  // while the search is active) is skipped; pull-to-refresh calls the action
  // directly. The boolean dep keeps the `unknown → cache` hydration flip from
  // firing a second request.
  const hasNetworkData = dataSource === 'network'
  useEffect(() => {
    if (hasNetworkData) return
    void fetchSections()
  }, [hasNetworkData, fetchSections])

  useOfflineRetry({
    fetchFn: fetchSections,
    hasCachedData: dataSource === 'cache',
    isLoading,
    needsRetry: dataSource !== 'network',
  })

  const onItemPress = (playlist: PlaylistData) => {
    navigateToPlaylist(playlist)
  }

  const renderSectionAt = (section: SectionData, index: number) =>
    renderSection({ index, navigateToPlaylistList, onItemPress, section })

  const renderSectionsFrom = (fromIndex: number) =>
    sections.slice(fromIndex).map((section, offset) => renderSectionAt(section, fromIndex + offset))

  const renderContent = () => {
    if (sections.length === 0) return isLoading ? <SectionsSkeleton /> : <EmptyState />

    return <>{renderSectionsFrom(0)}</>
  }

  return <OnboardingTarget id={onboardingTargetId}>{renderContent()}</OnboardingTarget>
}

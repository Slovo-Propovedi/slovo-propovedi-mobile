import { useAtom } from '@reatom/npm-react'
import { SearchIslandMorph } from 'widgets/search-island/@x/morph'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { isTabIslandCollapsedAtom } from '../model/barMorph'
import { tabIslandMorphDriver } from '../model/tabIslandMorphDriver'

// Compact search affordance: the circle shares the tab island's shape axis and
// fades in exactly as the island folds into the row's active circle.
export const TabBarSearchCircle = ({ isActive }: { isActive: boolean }) => {
  const [isCollapsed] = useAtom(isTabIslandCollapsedAtom)
  const { progress, settled } = useAtomMorphDriver(tabIslandMorphDriver)

  return (
    <SearchIslandMorph
      isActive={isActive}
      isCollapsed={isCollapsed}
      collapseProgress={progress}
      isSettledCollapsed={settled}
    />
  )
}

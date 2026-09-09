import { memo, type NamedExoticComponent } from 'react'
import type { SermonData } from 'shared/model'
import { SermonSearchRow } from './SermonSearchRow'

interface SearchResultsRowProps {
  inHistory: boolean
  onPress: (sermon: SermonData) => void
  progress?: number
  sermon: SermonData
}

/**
 * Thin memo wrapper around SermonSearchRow that stabilizes onPress.
 * The parent passes a useCallback-stable `handlePress(sermon)`,
 * and this component bridges it to the row's `onPress: () => void`.
 * Re-renders only when sermon / onPress / history-derived props change.
 */
export const SearchResultsRow: NamedExoticComponent<SearchResultsRowProps> = memo(
  ({ inHistory, onPress, progress, sermon }) => (
    <SermonSearchRow
      sermon={sermon}
      progress={progress}
      inHistory={inHistory}
      onPress={() => onPress(sermon)}
    />
  ),
)

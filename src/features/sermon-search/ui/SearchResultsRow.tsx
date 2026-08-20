import { memo, type NamedExoticComponent } from 'react'
import type { SermonData } from 'shared/model'
import { SermonSearchRow } from './SermonSearchRow'

interface SearchResultsRowProps {
  onPress: (sermon: SermonData) => void
  sermon: SermonData
  storedProgress?: number
}

/**
 * Thin memo wrapper around SermonSearchRow that stabilizes onPress.
 * The parent passes a useCallback-stable `handlePress(sermon)`,
 * and this component bridges it to the row's `onPress: () => void`.
 * Re-renders only when sermon / storedProgress / onPress reference change.
 */
export const SearchResultsRow: NamedExoticComponent<SearchResultsRowProps> = memo(
  ({ onPress, sermon, storedProgress }) => (
    <SermonSearchRow
      sermon={sermon}
      storedProgress={storedProgress}
      onPress={() => onPress(sermon)}
    />
  ),
)

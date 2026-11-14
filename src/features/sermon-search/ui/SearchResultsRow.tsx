import { memo, type NamedExoticComponent, type ReactElement } from 'react'
import { type AudioPlayerData, type SermonData } from 'entities/sermon'
import { SermonSearchRow } from './SermonSearchRow'

/**
 * Thin memo wrapper around SermonSearchRow that stabilizes onPress.
 * The parent passes a useCallback-stable `handlePress(sermon)`,
 * and this component bridges it to the row's `onPress: () => void`.
 * Re-renders only when sermon / onPress / history-derived props change.
 */
export const SearchResultsRow: NamedExoticComponent<{
  inHistory: boolean
  menuButtonWrapper?: (button: ReactElement) => ReactElement
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onPress: (sermon: SermonData) => void
  onRemoveFromSearchHistory?: () => void
  progress?: number
  sermon: SermonData
}> = memo(
  ({
    inHistory,
    menuButtonWrapper,
    onAddToPlaylist,
    onPress,
    onRemoveFromSearchHistory,
    progress,
    sermon,
  }) => (
    <SermonSearchRow
      sermon={sermon}
      progress={progress}
      inHistory={inHistory}
      onPress={() => onPress(sermon)}
      onAddToPlaylist={onAddToPlaylist}
      menuButtonWrapper={menuButtonWrapper}
      onRemoveFromSearchHistory={onRemoveFromSearchHistory}
    />
  ),
)

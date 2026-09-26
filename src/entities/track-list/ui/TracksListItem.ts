import { memo } from 'react'
import { TracksListItemBase } from './TracksListItemBase'
import { TracksListItemSkeleton } from './TracksListItemSkeleton'

// The row skeleton hangs off the base row element. The list-level skeleton is
// attached to a list component (PlaylistSheetList.Skeleton) or imported
// standalone by screens with inline lists (TracksListSkeleton).
export const TracksListItem = Object.assign(memo(TracksListItemBase), {
  Skeleton: TracksListItemSkeleton,
})

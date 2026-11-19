import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'

export interface GroupState<T> {
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  items: T[]
}

export interface PagedSearch {
  playlists: PagedGroup<PlaylistData>
  preachers: PagedGroup<string>
  sermons: PagedGroup<SermonData>
}

interface PagedGroup<T> {
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  items: T[]
  loadMore: () => void
}

export const createEmptyGroup = <T>(): GroupState<T> => ({
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  items: [],
})

// True while the group is still the untouched empty state.
export const isEmptyGroup = <T>(group: GroupState<T>): boolean =>
  group.items.length === 0 && !group.hasMore && !group.isLoading && !group.isLoadingMore

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

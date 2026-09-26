import type { FetchedBooksGroupName, FetchedSermonsGroupName } from './bible'
import type { SermonData } from './sermon'
import type { PlaylistData } from 'shared/model'

export interface DB {
  books: Array<{
    books: SermonData[]
    groupName: FetchedBooksGroupName
  }>
  sermons: Array<{
    groupName: FetchedSermonsGroupName
    playlists: PlaylistData[]
  }>
}

// Алиасы для удобства
export type FetchedBookData = SermonData

// Типы групп (для фильтрации и опережающего объявления)
export interface FetchedBooksGroup {
  books: SermonData[]
  groupName: FetchedBooksGroupName
}

export type FetchedSermonData = SermonData

export interface FetchedSermonsGroup {
  groupName: FetchedSermonsGroupName
  playlists: PlaylistData[]
}

import { type PlaylistData, type SermonData } from '../domain/common'

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

// Типы групп (алиасы для совместимости)
export interface FetchedBooksGroup {
  books: SermonData[]
  groupName: FetchedBooksGroupName
}
// Сохраняем типы групп для фильтрации
export type FetchedBooksGroupName = 'notesForPreachers' | 'topicalAndThematic' | 'verseByVerse'
export type FetchedPlaylist = PlaylistData

export type FetchedSermonData = SermonData

export interface FetchedSermonsGroup {
  groupName: FetchedSermonsGroupName
  playlists: PlaylistData[]
}

export type FetchedSermonsGroupName = 'new' | 'onBible' | 'topical'

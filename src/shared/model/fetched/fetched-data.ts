import { type FetchedBooksGroupName, type FetchedSermonsGroupName } from '../domain/bible'

export interface DB {
  books: FetchedBooksGroup[]
  sermons: FetchedSermonsGroup[]
}

export type FetchedBookData = {
  artwork: string
  description?: string
  id: string
  textFileUrl?: string
  title: string
} & (
  | {
      chapter: number
      verse?: [from: number, to: number] | number
    }
  | {
      chapter?: undefined
      verse?: undefined
    }
)

export interface FetchedBooksGroup {
  books: FetchedBookData[]
  groupName: FetchedBooksGroupName
}

export interface FetchedPlaylist {
  artwork: string
  description?: string
  list: FetchedSermonData[]
  title: string
}

export type FetchedSermonData = {
  artist: string
  artwork: string
  audioUrl?: string
  description?: string
  id: string
  textFileUrl?: string
  title: string
  youtubeUrl?: string
} & (
  | {
      chapter: number
      verse?: [from: number, to: number] | number
    }
  | {
      chapter?: undefined
      verse?: undefined
    }
)

export interface FetchedSermonsGroup {
  groupName: FetchedSermonsGroupName
  playlists: FetchedPlaylist[]
}

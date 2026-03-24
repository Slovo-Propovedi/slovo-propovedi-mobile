import { type FetchedBooksGroupName, type FetchedSermonsGroupName } from '../domain/bible'

export interface DB {
  books: FetchedBooksGroup[]
  sermons: FetchedSermonsGroup[]
}

export type FetchedBookData = (
  | {
      chapter: number
      verse?: [from: number, to: number] | number
    }
  | {
      chapter?: undefined
      verse?: undefined
    }
) & {
  description?: string
  id: string
  previewUrl?: string
  textFileUrl?: string
  title: string
}

export interface FetchedBooksGroup {
  books: FetchedBookData[]
  groupName: FetchedBooksGroupName
}

export interface FetchedPlaylist {
  description?: string
  list: FetchedSermonData[]
  previewUrl?: string
  title: string
}

export type FetchedSermonData = {
  artist: string
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

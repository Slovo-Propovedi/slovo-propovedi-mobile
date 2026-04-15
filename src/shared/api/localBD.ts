import type {
  FetchedBooksGroupName,
  FetchedSermonsGroupName,
  PlaylistData,
  SermonData,
} from 'shared/model'
import { db } from './db'

export const localDB = {
  getBooks: (): Array<{
    books: SermonData[]
    groupName: FetchedBooksGroupName
  }> => db.books,
  getSermons: (): Array<{
    groupName: FetchedSermonsGroupName
    playlists: PlaylistData[]
  }> => db.sermons,
}

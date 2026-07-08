import { type FetchedBooksGroupName, type FetchedSermonsGroupName } from '../model/domain/bible'
import { type PlaylistData, type SermonData } from '../model/domain/common'
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

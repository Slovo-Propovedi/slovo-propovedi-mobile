import { type FetchedBooksGroupName, type FetchedSermonsGroupName } from 'shared/model'
import {
  actsBookList,
  ephesiansBookList,
  firstAndSecondThessaloniansBookList,
  firstCorinthiansBookList,
  firstPeteBookList,
  isThereAnUnforgivableSinBooks,
  jacobBookList,
  johnBookList,
  lukeBookList,
  markBookList,
  stephensSpeechBeforeSanhedrinBookList,
  unionWithChristBookList,
} from './bookLists'
import {
  actsPlaylist,
  ephesiansPlaylist,
  firstAndSecondThessaloniansPlaylist,
  firstCorinthiansPlaylist,
  firstPetePlaylist,
  isThereAnUnforgivableSinPlaylist,
  jacobPlaylist,
  johnPlaylist,
  lukePlaylist,
  markPlaylist,
  philemonPlaylist,
  philippiansPlaylist,
  revelationPlaylist,
  secondCorinthiansPlaylist,
  secondPetePlaylist,
  stephensSpeechBeforeSanhedrin,
  titusPlaylist,
  unionWithChristPlaylist,
} from './playlists'

export const db = {
  books: [
    {
      books: [...actsBookList, ...markBookList, ...johnBookList, ...lukeBookList],
      groupName: 'notesForPreachers' as FetchedBooksGroupName,
    },
    {
      books: [
        ...markBookList,
        ...lukeBookList,
        ...johnBookList,
        ...actsBookList,
        ...jacobBookList,
        ...firstPeteBookList,
        ...firstCorinthiansBookList,
        ...ephesiansBookList,
        ...firstAndSecondThessaloniansBookList,
      ],
      groupName: 'verseByVerse' as FetchedBooksGroupName,
    },
    {
      books: [
        ...unionWithChristBookList,
        ...isThereAnUnforgivableSinBooks,
        ...stephensSpeechBeforeSanhedrinBookList,
      ],
      groupName: 'topicalAndThematic' as FetchedBooksGroupName,
    },
  ],
  sermons: [
    {
      groupName: 'new' as FetchedSermonsGroupName,
      playlists: [
        unionWithChristPlaylist,
        isThereAnUnforgivableSinPlaylist,
        firstAndSecondThessaloniansPlaylist,
        titusPlaylist,
        philemonPlaylist,
        revelationPlaylist,
      ],
    },
    {
      groupName: 'onBible' as FetchedSermonsGroupName,
      playlists: [
        markPlaylist,
        lukePlaylist,
        johnPlaylist,
        actsPlaylist,
        jacobPlaylist,
        firstPetePlaylist,
        secondPetePlaylist,
        firstCorinthiansPlaylist,
        secondCorinthiansPlaylist,
        ephesiansPlaylist,
        philippiansPlaylist,
        firstAndSecondThessaloniansPlaylist,
        titusPlaylist,
        philemonPlaylist,
        revelationPlaylist,
      ],
    },
    {
      groupName: 'topical' as FetchedSermonsGroupName,
      playlists: [
        unionWithChristPlaylist,
        isThereAnUnforgivableSinPlaylist,
        stephensSpeechBeforeSanhedrin,
      ],
    },
  ],
}

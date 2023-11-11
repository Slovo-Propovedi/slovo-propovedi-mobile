import type { DB } from 'shared/types';
import { FetchedBooksGroupName, FetchedSermonsGroupName } from 'shared/types';
import {
  actsBookList,
  ephesiansBookList,
  firstAndSecondThessaloniansBookList,
  firstCorinthiansBookList,
  firstPeteBookList,
  isThereAnUnforgivableSinBookList,
  jacobBookList,
  johnBookList,
  lukeBookList,
  markBookList,
  stephensSpeechBeforeSanhedrinBookList,
  unionWithChristBookList,
} from './bookLists';
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
} from './playlists';

export const db: DB = {
  books: [
    {
      bookList: [actsBookList, markBookList, johnBookList, lukeBookList],
      groupName: FetchedBooksGroupName.NotesForPreachers,
    },
    {
      bookList: [
        markBookList,
        lukeBookList,
        johnBookList,
        actsBookList,
        jacobBookList,
        firstPeteBookList,
        firstCorinthiansBookList,
        ephesiansBookList,
        firstAndSecondThessaloniansBookList,
      ],
      groupName: FetchedBooksGroupName.VerseByVerse,
    },
    {
      bookList: [
        unionWithChristBookList,
        isThereAnUnforgivableSinBookList,
        stephensSpeechBeforeSanhedrinBookList,
      ],
      groupName: FetchedBooksGroupName.TopicalAndThematic,
    },
  ],
  sermons: [
    {
      groupName: FetchedSermonsGroupName.New,
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
      groupName: FetchedSermonsGroupName.OnBible,
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
      groupName: FetchedSermonsGroupName.Topical,
      playlists: [
        unionWithChristPlaylist,
        isThereAnUnforgivableSinPlaylist,
        stephensSpeechBeforeSanhedrin,
      ],
    },
  ],
};

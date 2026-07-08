import { type FetchedBooksGroupName, type FetchedSermonsGroupName } from '../../model/domain/bible'
import { isThereAnUnforgivableSinBooks } from './bookLists/topicalAndThematic/isThereAnUnforgivableSinBookList'
import { stephensSpeechBeforeSanhedrinBookList } from './bookLists/topicalAndThematic/stephensSpeechBeforeSanhedrinBookList'
import { unionWithChristBookList } from './bookLists/topicalAndThematic/unionWithChristBookList'
import { actsBookList } from './bookLists/verseByVerse/actsBookList'
import { ephesiansBookList } from './bookLists/verseByVerse/ephesiansBookList'
import { firstAndSecondThessaloniansBookList } from './bookLists/verseByVerse/firstAndSecondThessaloniansBookList'
import { firstCorinthiansBookList } from './bookLists/verseByVerse/firstCorinthiansBookList'
import { firstPeteBookList } from './bookLists/verseByVerse/firstPeteBookList'
import { jacobBookList } from './bookLists/verseByVerse/jacobBookList'
import { johnBookList } from './bookLists/verseByVerse/johnBookList'
import { lukeBookList } from './bookLists/verseByVerse/lukeBookList'
import { markBookList } from './bookLists/verseByVerse/markBookList'
import { actsPlaylist } from './playlists/onBibleBook/actsPlaylist'
import { ephesiansPlaylist } from './playlists/onBibleBook/ephesiansPlaylist'
import { firstAndSecondThessaloniansPlaylist } from './playlists/onBibleBook/firstAndSecondThessaloniansPlaylist'
import { firstCorinthiansPlaylist } from './playlists/onBibleBook/firstCorinthiansPlaylist'
import { firstPetePlaylist } from './playlists/onBibleBook/firstPetePlaylist'
import { jacobPlaylist } from './playlists/onBibleBook/jacobPlaylist'
import { johnPlaylist } from './playlists/onBibleBook/johnPlaylist'
import { lukePlaylist } from './playlists/onBibleBook/lukePlaylist'
import { markPlaylist } from './playlists/onBibleBook/markPlaylist'
import { philemonPlaylist } from './playlists/onBibleBook/philemonPlaylist'
import { philippiansPlaylist } from './playlists/onBibleBook/philippiansPlaylist'
import { revelationPlaylist } from './playlists/onBibleBook/revelationPlaylist'
import { secondCorinthiansPlaylist } from './playlists/onBibleBook/secondCorinthiansPlaylist'
import { secondPetePlaylist } from './playlists/onBibleBook/secondPetePlaylist'
import { titusPlaylist } from './playlists/onBibleBook/titusPlaylist'
import { isThereAnUnforgivableSinPlaylist } from './playlists/topical/isThereAnUnforgivableSinPlaylist'
import { stephensSpeechBeforeSanhedrin } from './playlists/topical/stephensSpeechBeforeSanhedrin'
import { unionWithChristPlaylist } from './playlists/topical/unionWithChristPlaylist'

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

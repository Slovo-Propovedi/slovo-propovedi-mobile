import type { FetchedBookData } from 'shared/model'
import { DEFAULT_ARTIST } from '../../constants'

const artwork =
  'https://slovo-istini.com/image/cache/image/pages/1221/image-19-08-23-02-50_700x1000.png'

export const stephensSpeechBeforeSanhedrinBookList: FetchedBookData[] = [
  {
    artist: DEFAULT_ARTIST,
    artwork,
    chapter: 7,
    id: '1212',
    title: 'Безграничный Бог. Деяния',
    verse: [1, 8],
  },
  {
    artist: DEFAULT_ARTIST,
    artwork,
    chapter: 7,
    id: '1313',
    title: 'Малоизвестный признак посланника Бога. Деяния',
    verse: [9, 16],
  },
]

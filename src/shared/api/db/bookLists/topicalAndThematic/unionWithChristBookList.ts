import { DEFAULT_API_URL } from '../../../../config/api-url'
import { type SermonShape } from '../../../../model/domain/common'
import { DEFAULT_ARTIST } from '../../constants'

export const unionWithChristBookList: SermonShape[] = [
  {
    artist: DEFAULT_ARTIST,
    artwork: `${DEFAULT_API_URL}/image/cache/image/pages/1207/image-02-06-23-02-51_700x1000.png`,
    id: '22222',
    title: 'Союз со Христом',
  },
]

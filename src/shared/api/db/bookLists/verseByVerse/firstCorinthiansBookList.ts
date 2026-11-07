import { DEFAULT_API_URL } from '../../../../config/api-url'
import { type SermonShape } from '../../../../model/domain/common'
import { DEFAULT_ARTIST } from '../../constants'

export const firstCorinthiansBookList: SermonShape[] = [
  {
    artist: DEFAULT_ARTIST,
    artwork: `${DEFAULT_API_URL}/image/categories/65/1_korin_(1).jpg`,
    id: '333',
    title: 'Первое послание к коринфянам',
  },
]

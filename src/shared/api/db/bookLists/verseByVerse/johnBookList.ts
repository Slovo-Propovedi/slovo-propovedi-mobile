import { DEFAULT_API_URL } from '../../../../config/api-url'
import { type SermonShape } from '../../../../model/domain/common'
import { DEFAULT_ARTIST } from '../../constants'

export const johnBookList: SermonShape[] = [
  {
    artist: DEFAULT_ARTIST,
    artwork: `${DEFAULT_API_URL}/image/categories/21/ioanna_(1).jpg`,
    id: '555',
    title: 'Евангелие от Иоанна',
  },
]

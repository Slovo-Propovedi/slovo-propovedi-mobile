import { DEFAULT_API_URL } from '../../../../config/api-url'
import { type SermonShape } from '../../../../model/domain/common'
import { DEFAULT_ARTIST } from '../../constants'

export const jacobBookList: SermonShape[] = [
  {
    artist: DEFAULT_ARTIST,
    artwork: `${DEFAULT_API_URL}/image/categories/23/whatsapp_image_2022-11-11_at_17.11.51.jpeg`,
    id: '444',
    title: 'Послание Иакова',
  },
]

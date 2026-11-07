import { DEFAULT_API_URL } from '../../../../config/api-url'
import { type SermonShape } from '../../../../model/domain/common'
import { DEFAULT_ARTIST } from '../../constants'

export const actsBookList: SermonShape[] = [
  {
    artist: DEFAULT_ARTIST,
    artwork: `${DEFAULT_API_URL}/image/categories/19/whatsapp_image_2022-11-11_at_17.09.37_(2).jpeg`,
    id: '1111',
    title: 'Деяния Апостолов',
  },
]

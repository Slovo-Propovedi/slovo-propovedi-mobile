import { DEFAULT_API_URL } from '../../../../config/api-url'
import { type SermonShape } from '../../../../model/domain/common'
import { DEFAULT_ARTIST } from '../../constants'

export const lukeBookList: SermonShape[] = [
  {
    artist: DEFAULT_ARTIST,
    artwork: `${DEFAULT_API_URL}/image/categories/78/whatsapp_image_2022-02-15_at_11.20.06.jpeg`,
    id: '6666',
    title: 'Евангелие от Луки',
  },
]

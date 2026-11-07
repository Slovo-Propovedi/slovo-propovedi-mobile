import { DEFAULT_API_URL } from '../../../../config/api-url'
import { type SermonShape } from '../../../../model/domain/common'
import { DEFAULT_ARTIST } from '../../constants'

export const firstPeteBookList: SermonShape[] = [
  {
    artist: DEFAULT_ARTIST,
    artwork: `${DEFAULT_API_URL}/image/categories/13/whatsapp_image_2022-11-11_at_17.11.51_(2).jpeg`,
    id: '333',
    title: 'Первое послание Петра',
  },
]

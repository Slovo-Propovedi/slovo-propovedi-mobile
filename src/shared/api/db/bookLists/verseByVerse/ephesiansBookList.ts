import { DEFAULT_API_URL } from '../../../../config/api-url'
import { type SermonShape } from '../../../../model/domain/common'
import { DEFAULT_ARTIST } from '../../constants'

export const ephesiansBookList: SermonShape[] = [
  {
    artist: DEFAULT_ARTIST,
    artwork: `${DEFAULT_API_URL}/image/categories/20/whatsapp_image_2022-11-11_at_17.09.38.jpeg`,
    id: '11',
    title: 'Послание к ефесянам',
  },
]

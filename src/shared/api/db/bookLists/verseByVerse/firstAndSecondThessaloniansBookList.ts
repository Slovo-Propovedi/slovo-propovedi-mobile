import { DEFAULT_API_URL } from '../../../../config/api-url'
import { type SermonShape } from '../../../../model/domain/common'
import { DEFAULT_ARTIST } from '../../constants'

export const firstAndSecondThessaloniansBookList: SermonShape[] = [
  {
    artist: DEFAULT_ARTIST,
    artwork: `${DEFAULT_API_URL}/image/categories/17/whatsapp_image_2022-11-11_at_17.11.52.jpeg`,
    id: '123',
    title: 'Первое и второе послание к фессалоникийцам',
  },
]

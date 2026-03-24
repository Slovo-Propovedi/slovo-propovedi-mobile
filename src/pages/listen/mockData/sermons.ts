import { DEFAULT_ARTIST } from 'shared/api'
import type { AudioPlayerData } from 'entities/player'

const DEFAULT_ARTWORK =
  'https://slovo-istini.com/image/categories/78/whatsapp_image_2022-02-15_at_11.20.06.jpeg'

export const mockSermons: AudioPlayerData[] = [
  {
    artist: DEFAULT_ARTIST,
    artwork: DEFAULT_ARTWORK,
    audioUrl:
      'https://slovo-istini.com/image/pages/977/osobennosti_evangeliya_ot_luki._luki_1_1-4.mp3',
    id: '1',
    title: 'Особенности Евангелия от Луки',
  },
  {
    artist: DEFAULT_ARTIST,
    artwork: DEFAULT_ARTWORK,
    audioUrl:
      'https://slovo-istini.com/image/pages/978/predskazanie_o_rojdenii_ioanna_krestitelya._luki_1_5-25.mp3',
    id: '2',
    title: 'Предсказание о рождении Иоанна Крестителя',
  },
  {
    artist: DEFAULT_ARTIST,
    artwork: DEFAULT_ARTWORK,
    audioUrl:
      'https://slovo-istini.com/image/pages/979/predskazanie_o_rojdenii_iisusa_hrista._luki_1_26-38.mp3',
    id: '3',
    title: 'Предсказание о рождении Иисуса Христа',
  },
  {
    artist: DEFAULT_ARTIST,
    artwork: DEFAULT_ARTWORK,
    audioUrl:
      'https://slovo-istini.com/image/pages/980/mariya_poseshchaet_elisavetu_i_proslavlyaet_boga._luki_1_39-56.mp3',
    id: '4',
    title: 'Мария посещает Елисавету',
  },
  {
    artist: DEFAULT_ARTIST,
    artwork: DEFAULT_ARTWORK,
    audioUrl:
      'https://slovo-istini.com/image/pages/981/rojdenie_ioanna_krestitelya._luki_1_57-80.mp3',
    id: '5',
    title: 'Рождение Иоанна Крестителя',
  },
]

export const mockNewSermons = mockSermons.slice(0, 3)

const DAILY_ARTWORK = 'https://slovo-istini.com/image/categories/default.jpeg'

export const mockListenEveryDay: AudioPlayerData[] = [
  {
    artist: DEFAULT_ARTIST,
    artwork: DAILY_ARTWORK,
    audioUrl: 'https://slovo-istini.com/audio/psalm_23.mp3',
    id: '6',
    title: 'Ежедневное чтение: Псалом 23',
  },
  {
    artist: DEFAULT_ARTIST,
    artwork: DAILY_ARTWORK,
    audioUrl: 'https://slovo-istini.com/audio/priтчи_10.mp3',
    id: '7',
    title: 'Ежедневное чтение: Притчи 10',
  },
]

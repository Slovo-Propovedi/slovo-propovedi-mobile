import { DEFAULT_API_URL } from '../../../../config/api-url'
import { type FetchedPlaylist } from '../../../../model/fetched/fetched-data'
import { DEFAULT_ARTIST } from '../../constants'

const artwork = `${DEFAULT_API_URL}/image/cache/image/pages/1207/image-02-06-23-02-51_700x1000.png`
export const unionWithChristPlaylist: FetchedPlaylist = {
  artwork,
  id: 'unionWithChrist',
  sermons: [
    {
      artist: DEFAULT_ARTIST,
      artwork,
      audioUrl: `${DEFAULT_API_URL}/image/pages/1207/soyuz_so_hristom.mp3`,
      id: '22222',
      title: 'Союз со Христом',
      youtubeUrl: 'https://youtu.be/Jq3Tiq7LLQU',
    },
  ],
  title: 'Союз со Христом',
}

import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'

export const resolvePlaylist = (sermon: SermonData): PlaylistData =>
  sermon.playlists?.[0] ?? {
    artwork: sermon.artwork,
    id: sermon.id,
    sermons: [sermon],
    title: sermon.title,
  }

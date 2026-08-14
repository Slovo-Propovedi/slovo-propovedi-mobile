import type { PlaylistData, SermonData } from 'shared/model'

export const resolvePlaylist = (sermon: SermonData): PlaylistData =>
  sermon.playlists?.[0] ?? {
    artwork: sermon.artwork,
    id: sermon.id,
    sermons: [sermon],
    title: sermon.title,
  }

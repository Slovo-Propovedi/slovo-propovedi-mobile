import { ENV } from 'shared/config'

export const buildPlaylistShareUrl = (playlistId: string) =>
  `https://${ENV.webHostname}/listen/playlist?playlist=${encodeURIComponent(playlistId)}`

import { Share } from 'react-native'
import { type PlaylistData } from 'shared/model'
import { buildPlaylistShareUrl } from './buildPlaylistShareUrl'

export const usePlaylistShare = (playlist: PlaylistData, onBeforeShare: () => void) => {
  const handleShare = async () => {
    onBeforeShare()
    const url = buildPlaylistShareUrl(playlist.id)
    try {
      await Share.share({ message: `${playlist.title} — ${url}`, url })
    } catch (caughtError) {
      console.warn('Share playlist failed:', caughtError)
    }
  }

  return { handleShare }
}

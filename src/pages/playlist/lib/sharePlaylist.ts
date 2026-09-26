import { Share } from 'react-native'

export interface SharePlaylistInput {
  text: string
  url: string
}

export type ShareResult = 'copied' | 'dismissed' | 'error' | 'shared'

export const sharePlaylist = async ({ text, url }: SharePlaylistInput): Promise<ShareResult> => {
  try {
    const result = await Share.share({ message: text, url })
    return result.action === Share.sharedAction ? 'shared' : 'dismissed'
  } catch (error) {
    console.warn('sharePlaylist failed:', error)
    return 'error'
  }
}

import { Share } from 'react-native'

export interface ShareLinkInput {
  text: string
  url: string
}

export type ShareResult = 'copied' | 'dismissed' | 'error' | 'shared'

export const shareLink = async ({ text, url }: ShareLinkInput): Promise<ShareResult> => {
  try {
    const result = await Share.share({ message: text, url })
    return result.action === Share.sharedAction ? 'shared' : 'dismissed'
  } catch (error) {
    console.warn('shareLink failed:', error)
    return 'error'
  }
}

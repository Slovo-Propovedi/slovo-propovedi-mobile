import { type SharePlaylistInput, type ShareResult } from './sharePlaylist'

export { type SharePlaylistInput, type ShareResult } from './sharePlaylist'

export const sharePlaylist = async ({ text, url }: SharePlaylistInput): Promise<ShareResult> => {
  if (typeof navigator.share === 'function')
    try {
      await navigator.share({ text, url })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed'
      console.warn('sharePlaylist failed, falling back to clipboard:', error)
    }

  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch (error) {
    console.warn('sharePlaylist clipboard fallback failed:', error)
    return 'error'
  }
}

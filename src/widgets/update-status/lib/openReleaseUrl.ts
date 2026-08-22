import { Linking } from 'react-native'

const HTTPS_PREFIX = 'https://'

export const openReleaseUrl = (url: null | string): void => {
  if (!url) {
    console.warn('[openReleaseUrl] Release URL is null, cannot open browser')
    return
  }
  if (!url.startsWith(HTTPS_PREFIX)) return

  Linking.openURL(url).catch((error: unknown) => {
    console.error('[update-status] Failed to open release URL:', error)
  })
}

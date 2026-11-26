import { Platform } from 'react-native'
import { isIOSUserAgent } from './isIOSUserAgent'

const IOS_WEB_SHELL_CLASS = 'ios-web'

/**
 * Marks <html> so `public/index.html` can size the shell with `100lvh` on iOS
 * web: `100dvh` there excludes the home-indicator band, which made the OS
 * letterbox the page with a background-colored strip. Idempotent and
 * native-safe — a no-op outside iOS web.
 */
export const ensureIosWebShellClass = (): void => {
  if (Platform.OS !== 'web' || !isIOSUserAgent()) return
  if (typeof document === 'undefined') return
  if (!document.documentElement) return

  document.documentElement.classList.add(IOS_WEB_SHELL_CLASS)
}

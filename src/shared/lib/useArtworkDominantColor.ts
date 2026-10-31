import { useEffect, useState } from 'react'
import { getColors, type ImageColorsResult } from 'react-native-image-colors'
import { reportError } from '../model/error-dialog'
import { hasUriProtocol } from './app-icon'

// One representative color usable as backgroundColor on every platform.
const representative = (colors: ImageColorsResult, fallback: string): string => {
  switch (colors.platform) {
    case 'android':
      return colors.dominant ?? fallback
    case 'ios':
      return colors.primary ?? fallback
    case 'web':
      return colors.dominant ?? fallback
    default:
      return fallback
  }
}

/**
 * Dominant artwork color as a CSS-safe '#RRGGBB' string; falls back while
 * loading and whenever extraction fails (web CORS error, unreachable image,
 * native download error). Native module boundary: URI is protocol-validated
 * and the whole call is wrapped — a failed cover tint must never crash the
 * player (Issue #45 policy).
 * @param uri - Artwork URI; values without a protocol are never fetched.
 * @param fallback - Color returned while loading and whenever extraction fails.
 */
export const useArtworkDominantColor = (
  uri: null | string | undefined,
  fallback: string,
): string => {
  const [color, setColor] = useState(fallback)

  useEffect(() => {
    if (!hasUriProtocol(uri)) return undefined
    let active = true

    getColors(uri, { cache: true, fallback, key: uri })
      .then(colors => {
        if (active) setColor(representative(colors, fallback))
      })
      .catch((error: unknown) => {
        // web: "Fail to load image: <src>" (no CORS headers / 404);
        // android: "[ImageColors] Could not download image." — failures are
        // not cached by the package, transient CORS problems self-heal.
        reportError(error, 'Artwork dominant color extraction failed')
        if (active) setColor(fallback)
      })

    return () => {
      active = false
    }
  }, [fallback, uri])

  return color
}

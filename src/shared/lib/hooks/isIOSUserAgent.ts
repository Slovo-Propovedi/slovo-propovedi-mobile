// iOS browsers and PWAs report env(safe-area-inset-bottom) = 0 through the probe,
// so web layout floors must be picked from the user agent. Guarded for non-browser
// runtimes (tests, native) where navigator is undefined.
export const isIOSUserAgent = (): boolean => {
  if (typeof navigator === 'undefined') return false

  const userAgent = navigator.userAgent ?? ''
  const platform = navigator.platform ?? ''
  const maxTouchPoints = navigator.maxTouchPoints ?? 0

  // iPadOS masquerades as MacIntel but exposes touch points.
  return /iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

export const watchPageVisibility = (onVisible: () => void): (() => void) => {
  if (typeof document === 'undefined') return () => {}

  const handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') onVisible()
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}

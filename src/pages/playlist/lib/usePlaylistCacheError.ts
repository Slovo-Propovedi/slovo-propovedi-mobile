import { useCallback, useEffect, useRef, useState } from 'react'
import { playlistCacheService } from './PlaylistCacheService'

/**
 * Surfaces the playlist cache service's sticky error in the header menu.
 * The error is shown once per occurrence: the ref guards against re-showing
 * the same error on every re-render, and is reset when the dialog closes.
 * @param cacheDialogVisible - Re-checks the service error when the cache dialog visibility changes.
 */
export const usePlaylistCacheError = (cacheDialogVisible: boolean) => {
  const [error, setError] = useState<Error | null>(null)
  const errorShownRef = useRef(false)
  const setErrorRef = useRef(setError)

  useEffect(() => {
    setErrorRef.current = setError
  }, [setError])

  useEffect(() => {
    if (!errorShownRef.current) {
      const currentError = playlistCacheService.getError()
      if (currentError) {
        setErrorRef.current(currentError)
        errorShownRef.current = true
      }
    }
  }, [cacheDialogVisible])

  const handleErrorClose = useCallback(() => {
    playlistCacheService.clearError()
    setError(null)
    errorShownRef.current = false
  }, [])

  return { error, handleErrorClose }
}

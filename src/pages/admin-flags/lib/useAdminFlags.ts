import { useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { type APITypes, featureFlagsApi } from 'shared/api'
import { reportError } from 'shared/model/error-dialog'

interface AdminFlagsState {
  flags: APITypes.FeatureFlag[]
  isError: boolean
  isLoading: boolean
  isRefreshing: boolean
  refresh: () => Promise<void>
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить фича-флаги'

const fetchFlags = () =>
  featureFlagsApi
    .getFeatureFlags()
    .featureFlagsControllerFindAll()
    .then(response => response.flags)

/**
 * Список фича-флагов админки (`GET /feature-flags`). Флагов мало, поэтому без
 * пагинации и поиска; данные тихо обновляются при возврате на экран (скелетон
 * показывается только до первой успешной загрузки).
 */
export const useAdminFlags = (): AdminFlagsState => {
  const [flags, setFlags] = useState<APITypes.FeatureFlag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isError, setIsError] = useState(false)
  const hasLoadedRef = useRef(false)

  const load = useCallback(async () => {
    const showSkeleton = !hasLoadedRef.current

    try {
      const next = await fetchFlags()
      setFlags(next)
      setIsError(false)
      hasLoadedRef.current = true
    } catch (error) {
      if (showSkeleton) setIsError(true)
      reportError(error, LOAD_ERROR_MESSAGE)
    } finally {
      if (showSkeleton) setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await load()
    } finally {
      setIsRefreshing(false)
    }
  }, [load])

  return { flags, isError, isLoading, isRefreshing, refresh }
}

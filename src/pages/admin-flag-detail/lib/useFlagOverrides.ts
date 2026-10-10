import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { type APITypes, featureFlagsApi } from 'shared/api'
import { reportError } from 'shared/model/error-dialog'

export interface FlagOverridesState {
  isError: boolean
  isLoading: boolean
  overrides: APITypes.FeatureFlagOverride[]
  refetch: () => Promise<void>
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить исключения'

/**
 * Существующие пер-пользовательские исключения флага
 * (`GET /feature-flags/{id}/overrides`; пустой список — валидный ответ). Грузится
 * при фокусе экрана и по `refetch` — деталь флага вызывает его после успешной
 * мутации override, чтобы список остался в синке.
 * @param id — идентификатор флага.
 */
export const useFlagOverrides = (id: string): FlagOverridesState => {
  const [overrides, setOverrides] = useState<APITypes.FeatureFlagOverride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const fetchOverrides = useCallback(async () => {
    if (!id) return []

    const response = await featureFlagsApi.getFeatureFlags().featureFlagsControllerFindOverrides(id)

    return response.overrides
  }, [id])

  const refetch = useCallback(async () => {
    try {
      setOverrides(await fetchOverrides())
      setIsError(false)
    } catch (error) {
      setIsError(true)
      reportError(error, LOAD_ERROR_MESSAGE)
    } finally {
      setIsLoading(false)
    }
  }, [fetchOverrides])

  useFocusEffect(
    useCallback(() => {
      void refetch()
    }, [refetch]),
  )

  return { isError, isLoading, overrides, refetch }
}

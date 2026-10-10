import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
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
 * мутации override, чтобы список остался в синке. Запросы секвенируются: новый
 * запрос отменяет предыдущий (last-started-wins), поэтому устаревший ответ не
 * перезатирает свежие данные. При ошибке старый список сохраняется.
 * @param id — идентификатор флага.
 */
export const useFlagOverrides = (id: string): FlagOverridesState => {
  const [overrides, setOverrides] = useState<APITypes.FeatureFlagOverride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const isActiveRef = useRef(true)
  const inFlightRef = useRef<AbortController | null>(null)

  const refetch = useCallback(async () => {
    if (!id) {
      setOverrides([])
      setIsLoading(false)
      setIsError(false)
      return
    }

    inFlightRef.current?.abort()
    const controller = new AbortController()
    inFlightRef.current = controller

    try {
      const response = await featureFlagsApi
        .getFeatureFlags()
        .featureFlagsControllerFindOverrides(id, { signal: controller.signal })

      if (!isActiveRef.current || controller.signal.aborted) return

      setOverrides(response.overrides)
      setIsError(false)
    } catch (error) {
      if (!isActiveRef.current || controller.signal.aborted) return

      setIsError(true)
      reportError(error, LOAD_ERROR_MESSAGE)
    } finally {
      if (isActiveRef.current && inFlightRef.current === controller) setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
      inFlightRef.current?.abort()
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void refetch()
    }, [refetch]),
  )

  return { isError, isLoading, overrides, refetch }
}

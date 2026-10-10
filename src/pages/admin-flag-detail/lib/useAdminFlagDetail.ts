import { useAction } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { type APITypes, featureFlagsApi } from 'shared/api'
import { useSilentRefetchOnFocus } from 'shared/lib/hooks/useSilentRefetchOnFocus'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { type FlagOverridesState, useFlagOverrides } from './useFlagOverrides'

interface AdminFlagDetailState {
  clearOverride: (userId: string) => Promise<void>
  flag: APITypes.FeatureFlag | null
  isDeleting: boolean
  isNotFound: boolean
  overridesState: FlagOverridesState
  remove: () => Promise<boolean>
  setOverride: (userId: string, value: APITypes.SetFeatureFlagOverrideRequestValue) => Promise<void>
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить фича-флаг'
const DELETE_ERROR_MESSAGE = 'Не удалось удалить фича-флаг'
const OVERRIDE_ERROR_MESSAGE = 'Не удалось сохранить исключение'
const OVERRIDE_GRANTED_MESSAGE = 'Флаг включён пользователю'
const OVERRIDE_DENIED_MESSAGE = 'Флаг выключен пользователю'
const OVERRIDE_CLEARED_MESSAGE = 'Исключение снято'

/**
 * Деталь фича-флага: загрузка, удаление и пер-пользовательские исключения
 * (grant/deny/clear). Отдельного `GET /feature-flags/{id}` нет — флаг выбирается из общего списка.
 * @param id — идентификатор флага.
 */
export const useAdminFlagDetail = (id: string): AdminFlagDetailState => {
  const showToastAction = useAction(showToast)
  const [flag, setFlag] = useState<APITypes.FeatureFlag | null>(null)
  const [isNotFound, setIsNotFound] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const overridesState = useFlagOverrides(id)
  const refetchOverrides = overridesState.refetch

  const fetchFlag = useCallback(async () => {
    const response = await featureFlagsApi.getFeatureFlags().featureFlagsControllerFindAll()

    return response.flags.find(item => item.id === id) ?? null
  }, [id])

  useEffect(() => {
    let isActive = true

    const load = async () => {
      if (!id) {
        if (isActive) setIsNotFound(true)
        return
      }

      try {
        const entity = await fetchFlag()
        if (!isActive) return

        if (entity) setFlag(entity)
        else setIsNotFound(true)
      } catch (error) {
        if (isActive) {
          setIsNotFound(true)
          reportError(error, LOAD_ERROR_MESSAGE)
        }
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [fetchFlag, id])

  useSilentRefetchOnFocus(
    useCallback(async () => {
      if (!id) return

      try {
        const refreshed = await fetchFlag()
        if (refreshed) setFlag(refreshed)
      } catch (error) {
        reportError(error, LOAD_ERROR_MESSAGE)
      }
    }, [fetchFlag, id]),
  )

  const remove = useCallback(async () => {
    setIsDeleting(true)
    try {
      await featureFlagsApi.getFeatureFlags().featureFlagsControllerRemove(id)
      return true
    } catch (error) {
      reportError(error, DELETE_ERROR_MESSAGE)
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [id])

  const setOverride = useCallback(
    async (userId: string, value: APITypes.SetFeatureFlagOverrideRequestValue) => {
      try {
        await featureFlagsApi
          .getFeatureFlags()
          .featureFlagsControllerSetOverride(id, userId, { value })
        showToastAction(value === 'grant' ? OVERRIDE_GRANTED_MESSAGE : OVERRIDE_DENIED_MESSAGE)
        await refetchOverrides()
      } catch (error) {
        reportError(error, OVERRIDE_ERROR_MESSAGE)
      }
    },
    [id, refetchOverrides, showToastAction],
  )

  const clearOverride = useCallback(
    async (userId: string) => {
      try {
        await featureFlagsApi.getFeatureFlags().featureFlagsControllerDeleteOverride(id, userId)
        showToastAction(OVERRIDE_CLEARED_MESSAGE)
        await refetchOverrides()
      } catch (error) {
        reportError(error, OVERRIDE_ERROR_MESSAGE)
      }
    },
    [id, refetchOverrides, showToastAction],
  )

  return { clearOverride, flag, isDeleting, isNotFound, overridesState, remove, setOverride }
}

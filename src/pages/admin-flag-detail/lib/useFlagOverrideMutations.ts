import { useAction } from '@reatom/npm-react'
import { useCallback } from 'react'
import { type APITypes, featureFlagsApi } from 'shared/api'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'

const OVERRIDE_ERROR_MESSAGE = 'Не удалось сохранить исключение'
const OVERRIDE_GRANTED_MESSAGE = 'Флаг включён пользователю'
const OVERRIDE_DENIED_MESSAGE = 'Флаг выключен пользователю'
const OVERRIDE_CLEARED_MESSAGE = 'Исключение снято'

/**
 * Мутации пер-пользовательских исключений флага: grant/deny (`PUT`) и clear
 * (`DELETE`). После успеха показывает тост и перезагружает список исключений,
 * чтобы UI остался в синке.
 * @param id — идентификатор флага.
 * @param refetchOverrides — перезагрузка списка исключений после мутации.
 */
export const useFlagOverrideMutations = (id: string, refetchOverrides: () => Promise<void>) => {
  const showToastAction = useAction(showToast)

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

  return { clearOverride, setOverride }
}

import { useCallback, useState } from 'react'
import { type APITypes, featureFlagsApi } from 'shared/api'
import { useSilentRefetchOnFocus } from 'shared/lib/hooks/useSilentRefetchOnFocus'
import { useCacheFirstEntity } from 'shared/lib/session-cache'
import { reportError } from 'shared/model/error-dialog'
import { flagDetailCache } from './flagDetailCache'
import { resolveOverrideAction } from './overrideAction'
import { useFlagOverrideMutations } from './useFlagOverrideMutations'
import { type FlagOverridesState, useFlagOverrides } from './useFlagOverrides'

interface AdminFlagDetailState {
  applyOverride: (userId: string, desiredEnabled: boolean) => Promise<void>
  flag: APITypes.FeatureFlag | null
  isDeleting: boolean
  isNotFound: boolean
  overridesState: FlagOverridesState
  remove: () => Promise<boolean>
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить фича-флаг'
const DELETE_ERROR_MESSAGE = 'Не удалось удалить фича-флаг'

/**
 * Деталь фича-флага: загрузка, удаление и пер-пользовательские исключения через
 * один тумблер эффективного состояния (`applyOverride`). Отдельного
 * `GET /feature-flags/{id}` нет — флаг выбирается из общего списка.
 * @param id — идентификатор флага.
 */
export const useAdminFlagDetail = (id: string): AdminFlagDetailState => {
  const [flag, setFlag] = useState<APITypes.FeatureFlag | null>(null)
  const [isNotFound, setIsNotFound] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const overridesState = useFlagOverrides(id)
  const refetchOverrides = overridesState.refetch
  const { clearOverride, setOverride } = useFlagOverrideMutations(id, refetchOverrides)

  const fetchFlag = useCallback(
    () =>
      flagDetailCache.fetchThrough(id, async () => {
        const response = await featureFlagsApi.getFeatureFlags().featureFlagsControllerFindAll()

        return response.flags.find(item => item.id === id) ?? null
      }),
    [id],
  )

  useCacheFirstEntity({
    cache: flagDetailCache,
    errorMessage: LOAD_ERROR_MESSAGE,
    fetcher: fetchFlag,
    id,
    onLoaded: entity => {
      if (entity) setFlag(entity)
      else setIsNotFound(true)
    },
    onNotFound: () => setIsNotFound(true),
  })

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

  const applyOverride = useCallback(
    async (userId: string, desiredEnabled: boolean) => {
      if (!flag) return

      const action = resolveOverrideAction(desiredEnabled, flag.enabled)

      if (action.type === 'clear') {
        await clearOverride(userId)
        return
      }

      await setOverride(userId, action.value)
    },
    [clearOverride, flag, setOverride],
  )

  return { applyOverride, flag, isDeleting, isNotFound, overridesState, remove }
}

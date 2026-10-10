import { action, atom } from '@reatom/framework'
import { featureFlagsApi, secureTokenStorage } from 'shared/api'
import { reportError } from 'shared/model/error-dialog'

const FEATURE_FLAGS_LOAD_ERROR_MESSAGE = 'Не удалось загрузить фича-флаги'

// null = флаги ещё не загружены (нет токена, запрос в полёте или ошибка).
// Потребители трактуют null как «доступ закрыт» — см. useFeatureFlag.
export const featureFlagsAtom = atom<null | Record<string, boolean>>(null, 'featureFlagsAtom')

export const fetchMyFeatureFlags = action(async ctx => {
  const accessToken = await secureTokenStorage.getAccessToken()
  if (!accessToken) return

  try {
    const { flags } = await featureFlagsApi
      .getFeatureFlags()
      .featureFlagsControllerGetEffectiveForMe()

    const flagsByKey: Record<string, boolean> = Object.fromEntries(
      flags.map(({ enabled, key }): [string, boolean] => [key, enabled]),
    )

    await ctx.schedule(() => {
      featureFlagsAtom(ctx, flagsByKey)
    })
  } catch (error) {
    console.error('fetchMyFeatureFlags failed:', error)
    reportError(error, FEATURE_FLAGS_LOAD_ERROR_MESSAGE)
  }
}, 'fetchMyFeatureFlags')

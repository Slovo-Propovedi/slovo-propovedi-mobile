import { action, atom } from '@reatom/framework'
import { featureFlagsApi } from 'shared/api'
import { showToast } from 'shared/model'

const FEATURE_FLAGS_LOAD_ERROR_MESSAGE = 'Не удалось загрузить фича-флаги'

// null = флаги ещё не загружены (запрос в полёте или ошибка).
// Потребители трактуют null как «доступ закрыт» — см. useFeatureFlag.
export const featureFlagsAtom = atom<null | Record<string, boolean>>(null, 'featureFlagsAtom')

// Internal — marks that the previous fetch already failed, so the toast shows
// only on the success→failure transition instead of on every foreground refetch.
const flagsFetchFailedAtom = atom<boolean>(false, 'flagsFetchFailedAtom')

// GET /feature-flags/me has optional auth: anonymous callers receive the global
// flag state, authenticated ones their effective flags (the Authorization header
// is attached by the axios request interceptor when a token exists). Always fetch.
export const fetchMyFeatureFlags = action(async ctx => {
  try {
    const { flags } = await featureFlagsApi
      .getFeatureFlags()
      .featureFlagsControllerGetEffectiveForMe()

    const flagsByKey: Record<string, boolean> = Object.fromEntries(
      flags.map(({ enabled, key }): [string, boolean] => [key, enabled]),
    )

    await ctx.schedule(() => {
      flagsFetchFailedAtom(ctx, false)
      featureFlagsAtom(ctx, flagsByKey)
    })
  } catch (error) {
    console.error('fetchMyFeatureFlags failed:', error)

    await ctx.schedule(() => {
      if (ctx.get(flagsFetchFailedAtom)) return

      flagsFetchFailedAtom(ctx, true)
      showToast(ctx, FEATURE_FLAGS_LOAD_ERROR_MESSAGE)
    })
  }
}, 'fetchMyFeatureFlags')

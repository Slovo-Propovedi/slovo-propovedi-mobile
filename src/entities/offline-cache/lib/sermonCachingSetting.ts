import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'

const SERMON_CACHING_ENABLED_KEY = 'sermon_caching_enabled'

export const sermonCachingEnabledAtom = atom<boolean>(true, 'sermonCachingEnabledAtom')

/**
 * Set the moment the user touches the toggle, never reset. The startup load is
 * dispatched from `app/_layout.tsx` after two awaited steps (orphan cleanup, registry
 * hydration), so its `getItem` can still be in flight when the user reaches the
 * Offline screen. That read then holds a value from *before* the user's press and
 * would snap the switch back — the user pressed, waited, and got the old state. The
 * press is the freshest intent, so the later hydration is stale by definition and
 * must not overwrite the atom (a failed persist reverts the atom but the user still
 * touched it — hydration must not resurrect what is on disk over that intent). Both
 * actions run in the same root ctx, so the flag is per-context state, not module state.
 */
const isSermonCachingUserTouchedAtom = atom<boolean>(false, 'isSermonCachingUserTouchedAtom')

/**
 * Optimistic: the touched flag and the atom flip synchronously, before the awaited
 * persist, so the UI and the queue gates react to the press immediately instead of
 * lagging by a whole AsyncStorage round-trip. If the persist rejects, the atom is
 * reverted to its previous value and the error is rethrown for the caller to log —
 * the switch never shows a setting that was not written.
 */
export const setSermonCachingEnabled = action(async (ctx, enabled: boolean) => {
  isSermonCachingUserTouchedAtom(ctx, true)

  const previousEnabled = ctx.get(sermonCachingEnabledAtom)
  sermonCachingEnabledAtom(ctx, enabled)

  try {
    await AsyncStorage.setItem(SERMON_CACHING_ENABLED_KEY, String(enabled))
  } catch (error) {
    sermonCachingEnabledAtom(ctx, previousEnabled)

    throw error
  }

  return enabled
}, 'setSermonCachingEnabled')

export const loadSermonCachingEnabled = action(async rootCtx => {
  try {
    const saved = await AsyncStorage.getItem(SERMON_CACHING_ENABLED_KEY)
    if (saved === null) return undefined

    const enabled = saved === 'true'

    // Hydration raced the user: the press already persisted its own value, so this
    // read is stale — report the stored value, leave the atom alone. Falls back to the
    // default-true atom only when nobody touched the switch while the read was in
    // flight, which is the normal cold-start path.
    if (rootCtx.get(isSermonCachingUserTouchedAtom)) return enabled

    sermonCachingEnabledAtom(rootCtx, enabled)

    return enabled
  } catch (error) {
    console.error('Failed to load sermon caching enabled:', error)

    return undefined
  }
}, 'loadSermonCachingEnabled')

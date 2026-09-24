import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'

const HAPTICS_ENABLED_KEY = 'haptics_enabled'

export const hapticsEnabledAtom = atom<boolean>(true, 'hapticsEnabledAtom')

export const setHapticsEnabled = action(async (ctx, enabled: boolean) => {
  await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, String(enabled))

  await ctx.schedule(() => {
    hapticsEnabledAtom(ctx, enabled)
  })

  return enabled
}, 'setHapticsEnabled')

export const loadHapticsEnabled = action(async rootCtx => {
  try {
    const saved = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY)
    if (saved === null) return undefined

    hapticsEnabledAtom(rootCtx, saved === 'true')

    return saved === 'true'
  } catch (error) {
    console.error('Failed to load haptics enabled:', error)

    return undefined
  }
}, 'loadHapticsEnabled')

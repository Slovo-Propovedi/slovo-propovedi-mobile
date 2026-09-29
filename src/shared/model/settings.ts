import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import { axiosInstance } from '../api/axiosInstance'
import { DEFAULT_API_URL } from '../config/api-url'
import { SERVER_URL } from '../config/server-storage-keys'

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

    const enabled = saved === 'true'

    hapticsEnabledAtom(rootCtx, enabled)

    return enabled
  } catch (error) {
    console.error('Failed to load haptics enabled:', error)

    return undefined
  }
}, 'loadHapticsEnabled')

export const serverUrlAtom = atom<string>(DEFAULT_API_URL, 'serverUrlAtom')

const syncAxiosBaseUrl = (url: string) => {
  axiosInstance.defaults.baseURL = url
}

export const setServerUrlAction = action(async (ctx, url: string) => {
  await AsyncStorage.setItem(SERVER_URL, url)
  await ctx.schedule(() => {
    syncAxiosBaseUrl(url)
    serverUrlAtom(ctx, url)
  })
  return url
}, 'setServerUrl')

export const initServerUrlAction = action(async ctx => {
  try {
    const stored = await AsyncStorage.getItem(SERVER_URL)
    if (stored)
      await ctx.schedule(() => {
        syncAxiosBaseUrl(stored)
        serverUrlAtom(ctx, stored)
      })
  } catch (error) {
    console.error('Error loading server URL:', error)
  }
}, 'initServerUrl')

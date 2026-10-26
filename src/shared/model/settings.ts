import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import { axiosInstance } from '../api/axiosInstance'
import { DEFAULT_API_URL } from '../config/api-url'
import { SERVER_URL } from '../config/server-storage-keys'
import { resetSessionForServerChange } from './serverUrlSession'

const HAPTICS_ENABLED_KEY = 'haptics_enabled'
const TOURS_DISABLED_KEY = 'tours_disabled'
export const TOURS_SEEN_VERSION_KEY = 'tours_seen_version'

export const hapticsEnabledAtom = atom<boolean>(true, 'hapticsEnabledAtom')

export const toursDisabledAtom = atom<boolean>(false, 'toursDisabledAtom')

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

export const setToursDisabled = action(async (ctx, disabled: boolean) => {
  await AsyncStorage.setItem(TOURS_DISABLED_KEY, String(disabled))

  await ctx.schedule(() => {
    toursDisabledAtom(ctx, disabled)
  })

  return disabled
}, 'setToursDisabled')

export const loadToursDisabled = action(async rootCtx => {
  try {
    const saved = await AsyncStorage.getItem(TOURS_DISABLED_KEY)
    if (saved === null) return undefined

    const disabled = saved === 'true'

    toursDisabledAtom(rootCtx, disabled)

    return disabled
  } catch (error) {
    console.error('Failed to load tours disabled:', error)

    return undefined
  }
}, 'loadToursDisabled')

export const setToursSeenVersion = action(async (_ctx, version: string) => {
  await AsyncStorage.setItem(TOURS_SEEN_VERSION_KEY, version)

  return version
}, 'setToursSeenVersion')

export const serverUrlAtom = atom<string>(DEFAULT_API_URL, 'serverUrlAtom')

const syncAxiosBaseUrl = (url: string) => {
  axiosInstance.defaults.baseURL = url
}

export const setServerUrlAction = action(async (ctx, url: string) => {
  if (url !== ctx.get(serverUrlAtom)) await resetSessionForServerChange(ctx)

  await AsyncStorage.setItem(SERVER_URL, url)
  await ctx.schedule(() => {
    syncAxiosBaseUrl(url)
    serverUrlAtom(ctx, url)
  })
  return url
}, 'setServerUrl')

// Адрес сервера обязан быть https: на него уходят токены администратора.
const isHttpsUrl = (url: string) => /^https:\/\/.+/.test(url)

export const initServerUrlAction = action(async ctx => {
  try {
    const stored = await AsyncStorage.getItem(SERVER_URL)
    if (!stored) return

    // Legacy/испорченное значение без https игнорируем: остаёмся на дефолтном
    // адресе, чтобы не отправлять токены по открытому каналу.
    if (!isHttpsUrl(stored)) {
      console.warn('Ignoring stored server URL without https://:', stored)
      return
    }

    await ctx.schedule(() => {
      syncAxiosBaseUrl(stored)
      serverUrlAtom(ctx, stored)
    })
  } catch (error) {
    console.error('Error loading server URL:', error)
  }
}, 'initServerUrl')

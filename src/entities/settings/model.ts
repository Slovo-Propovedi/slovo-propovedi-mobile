import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import { axiosInstance } from 'shared/api/axiosInstance'
import { DEFAULT_API_URL, SERVER_URL } from 'shared/config'

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

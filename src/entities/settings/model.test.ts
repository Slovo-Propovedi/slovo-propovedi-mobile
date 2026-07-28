jest.mock('shared/api/axiosInstance', () => ({
  axiosInstance: { defaults: { baseURL: 'https://api.slovo-propovedi.ru' } },
}))

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { DEFAULT_API_URL, SERVER_URL } from 'shared/config'
import { serverUrlAtom, setServerUrlAction } from './model'

const mockedAxiosInstance = jest.requireMock('shared/api/axiosInstance').axiosInstance as {
  defaults: { baseURL: string }
}

describe('settings model', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxiosInstance.defaults.baseURL = DEFAULT_API_URL
  })

  test('serverUrlAtom has default value', () => {
    const ctx = createCtx()
    expect(ctx.get(serverUrlAtom)).toBe(DEFAULT_API_URL)
  })

  test('setServerUrlAction updates atom and persists', async () => {
    const ctx = createCtx()
    const newUrl = 'https://custom.example.com'

    await setServerUrlAction(ctx, newUrl)

    expect(ctx.get(serverUrlAtom)).toBe(newUrl)
    expect(await AsyncStorage.getItem(SERVER_URL)).toBe(newUrl)
    expect(mockedAxiosInstance.defaults.baseURL).toBe(newUrl)
  })

  test('setServerUrlAction updates baseURL on axiosInstance', async () => {
    const ctx = createCtx()
    const newUrl = 'https://other.example.com'

    await setServerUrlAction(ctx, newUrl)

    expect(mockedAxiosInstance.defaults.baseURL).toBe(newUrl)
  })
})

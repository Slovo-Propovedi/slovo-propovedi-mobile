jest.mock('shared/api/axiosInstance', () => ({
  axiosInstance: { defaults: { baseURL: 'https://api.slovo-propovedi.ru' } },
}))

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx, type Ctx } from '@reatom/framework'
import { DEFAULT_API_URL, SERVER_URL } from 'shared/config'
import {
  hapticsEnabledAtom,
  loadHapticsEnabled,
  serverUrlAtom,
  setHapticsEnabled,
  setServerUrlAction,
} from './settings'

const HAPTICS_ENABLED_KEY = 'haptics_enabled'

const mockedAxiosInstance = jest.requireMock('shared/api/axiosInstance').axiosInstance as {
  defaults: { baseURL: string }
}

describe('settings model', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
    jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(null)
    jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue(undefined)
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockedAxiosInstance.defaults.baseURL = DEFAULT_API_URL
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('serverUrl', () => {
    test('serverUrlAtom has default value', () => {
      expect(ctx.get(serverUrlAtom)).toBe(DEFAULT_API_URL)
    })

    test('setServerUrlAction updates atom, storage and axios baseURL', async () => {
      const newUrl = 'https://custom.example.com'

      await setServerUrlAction(ctx, newUrl)

      expect(ctx.get(serverUrlAtom)).toBe(newUrl)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(SERVER_URL, newUrl)
      expect(mockedAxiosInstance.defaults.baseURL).toBe(newUrl)
    })
  })

  describe('setHapticsEnabled', () => {
    test('writes the value to AsyncStorage and updates the atom', async () => {
      await setHapticsEnabled(ctx, true)

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(HAPTICS_ENABLED_KEY, 'true')
      expect(ctx.get(hapticsEnabledAtom)).toBe(true)
    })

    test('persists the value before the atom updates', async () => {
      const atomValueAtWrite = jest.fn()
      ;(AsyncStorage.setItem as jest.Mock).mockImplementationOnce(async () => {
        atomValueAtWrite(ctx.get(hapticsEnabledAtom))
      })

      const update = setHapticsEnabled(ctx, false)

      expect(ctx.get(hapticsEnabledAtom)).toBe(true)

      await update

      expect(atomValueAtWrite).toHaveBeenCalledWith(true)
      expect(ctx.get(hapticsEnabledAtom)).toBe(false)
    })
  })

  describe('loadHapticsEnabled', () => {
    test('loads true from AsyncStorage', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('true')

      const result = await loadHapticsEnabled(ctx)

      expect(result).toBe(true)
      expect(ctx.get(hapticsEnabledAtom)).toBe(true)
    })

    test('loads false from AsyncStorage', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('false')

      const result = await loadHapticsEnabled(ctx)

      expect(result).toBe(false)
      expect(ctx.get(hapticsEnabledAtom)).toBe(false)
    })

    test('keeps the default true when storage is empty', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await loadHapticsEnabled(ctx)

      expect(result).toBeUndefined()
      expect(ctx.get(hapticsEnabledAtom)).toBe(true)
    })

    test('logs the error and keeps the atom unchanged when storage rejects', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('storage failure'))

      await expect(loadHapticsEnabled(ctx)).resolves.toBeUndefined()

      expect(console.error).toHaveBeenCalledWith(
        'Failed to load haptics enabled:',
        expect.any(Error),
      )
      expect(ctx.get(hapticsEnabledAtom)).toBe(true)
    })
  })
})

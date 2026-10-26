jest.mock('shared/api/axiosInstance', () => ({
  axiosInstance: { defaults: { baseURL: 'https://api.slovo-propovedi.ru' } },
}))
jest.mock('./serverUrlSession', () => ({ resetSessionForServerChange: jest.fn() }))

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx, type Ctx } from '@reatom/framework'
import { DEFAULT_API_URL } from '../config/api-url'
import { SERVER_URL } from '../config/server-storage-keys'
import { resetSessionForServerChange } from './serverUrlSession'
import {
  hapticsEnabledAtom,
  loadHapticsEnabled,
  loadToursDisabled,
  serverUrlAtom,
  setHapticsEnabled,
  setServerUrlAction,
  setToursDisabled,
  toursDisabledAtom,
} from './settings'

const HAPTICS_ENABLED_KEY = 'haptics_enabled'
const TOURS_DISABLED_KEY = 'tours_disabled'
const STORAGE_FAILURE_MESSAGE = 'storage failure'

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
    jest.mocked(resetSessionForServerChange).mockClear()
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

    test('setServerUrlAction resets the session before switching to another server', async () => {
      await setServerUrlAction(ctx, 'https://custom.example.com')

      expect(resetSessionForServerChange).toHaveBeenCalledTimes(1)
      expect(jest.mocked(resetSessionForServerChange).mock.invocationCallOrder[0]).toBeLessThan(
        jest.mocked(AsyncStorage.setItem).mock.invocationCallOrder.at(-1) ?? 0,
      )
    })

    test('setServerUrlAction keeps the session when the URL is unchanged', async () => {
      await setServerUrlAction(ctx, DEFAULT_API_URL)

      expect(resetSessionForServerChange).not.toHaveBeenCalled()
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
      ;(AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error(STORAGE_FAILURE_MESSAGE))

      await expect(loadHapticsEnabled(ctx)).resolves.toBeUndefined()

      expect(console.error).toHaveBeenCalledWith(
        'Failed to load haptics enabled:',
        expect.any(Error),
      )
      expect(ctx.get(hapticsEnabledAtom)).toBe(true)
    })
  })

  describe('setToursDisabled', () => {
    test('writes the value to AsyncStorage and updates the atom', async () => {
      await setToursDisabled(ctx, true)

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(TOURS_DISABLED_KEY, 'true')
      expect(ctx.get(toursDisabledAtom)).toBe(true)
    })

    test('persists the value before the atom updates', async () => {
      const atomValueAtWrite = jest.fn()
      ;(AsyncStorage.setItem as jest.Mock).mockImplementationOnce(async () => {
        atomValueAtWrite(ctx.get(toursDisabledAtom))
      })

      const update = setToursDisabled(ctx, true)

      expect(ctx.get(toursDisabledAtom)).toBe(false)

      await update

      expect(atomValueAtWrite).toHaveBeenCalledWith(false)
      expect(ctx.get(toursDisabledAtom)).toBe(true)
    })
  })

  describe('loadToursDisabled', () => {
    test('loads true from AsyncStorage', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('true')

      const result = await loadToursDisabled(ctx)

      expect(result).toBe(true)
      expect(ctx.get(toursDisabledAtom)).toBe(true)
    })

    test('loads false from AsyncStorage', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('false')

      const result = await loadToursDisabled(ctx)

      expect(result).toBe(false)
      expect(ctx.get(toursDisabledAtom)).toBe(false)
    })

    test('keeps the default false when storage is empty', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await loadToursDisabled(ctx)

      expect(result).toBeUndefined()
      expect(ctx.get(toursDisabledAtom)).toBe(false)
    })

    test('logs the error and keeps the atom unchanged when storage rejects', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error(STORAGE_FAILURE_MESSAGE))

      await expect(loadToursDisabled(ctx)).resolves.toBeUndefined()

      expect(console.error).toHaveBeenCalledWith(
        'Failed to load tours disabled:',
        expect.any(Error),
      )
      expect(ctx.get(toursDisabledAtom)).toBe(false)
    })
  })
})

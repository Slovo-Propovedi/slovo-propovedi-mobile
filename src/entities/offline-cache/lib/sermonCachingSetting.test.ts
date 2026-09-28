import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx, type Ctx } from '@reatom/framework'
import {
  loadSermonCachingEnabled,
  sermonCachingEnabledAtom,
  setSermonCachingEnabled,
} from './sermonCachingSetting'

const STORAGE_FAILURE_MESSAGE = 'storage failure'

describe('sermonCachingSetting model', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
    jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(null)
    jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue(undefined)
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('setSermonCachingEnabled (optimistic)', () => {
    test('flips the atom synchronously, before the storage write resolves', async () => {
      let resolveWrite: () => void = () => {}
      jest.mocked(AsyncStorage.setItem).mockImplementationOnce(
        () =>
          new Promise<void>(resolve => {
            resolveWrite = resolve
          }),
      )

      const update = setSermonCachingEnabled(ctx, false)

      expect(ctx.get(sermonCachingEnabledAtom)).toBe(false)

      resolveWrite()
      await update

      expect(ctx.get(sermonCachingEnabledAtom)).toBe(false)
    })

    test('reverts the atom and rejects when the storage write fails', async () => {
      jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error(STORAGE_FAILURE_MESSAGE))

      await expect(setSermonCachingEnabled(ctx, false)).rejects.toThrow(STORAGE_FAILURE_MESSAGE)

      expect(ctx.get(sermonCachingEnabledAtom)).toBe(true)
    })
  })

  describe('sermonCaching race with the startup hydration', () => {
    // The startup load is dispatched after two awaited steps in app/_layout.tsx, so
    // its getItem can still be in flight when the user presses the toggle. The read
    // is held open, the press lands, then the read resolves with a value that
    // predates the press.
    const raceWithSlowStartupRead = async (pressedEnabled: boolean, storedValue: string) => {
      let resolveRead = (_value: null | string) => {}
      const mockedGetItem = jest.mocked(AsyncStorage.getItem)
      mockedGetItem.mockImplementation(
        () =>
          new Promise<null | string>(resolve => {
            resolveRead = resolve
          }),
      )

      const load = loadSermonCachingEnabled(ctx)
      await setSermonCachingEnabled(ctx, pressedEnabled)
      resolveRead(storedValue)
      await load

      return ctx.get(sermonCachingEnabledAtom)
    }

    test('a slow startup read does not overwrite the user turning caching off', async () => {
      await expect(raceWithSlowStartupRead(false, 'true')).resolves.toBe(false)
    })

    test('a slow startup read does not overwrite the user turning caching back on', async () => {
      await expect(raceWithSlowStartupRead(true, 'false')).resolves.toBe(true)
    })

    test('a startup read with no press in between still hydrates the atom', async () => {
      jest.mocked(AsyncStorage.getItem).mockResolvedValue('false')

      await loadSermonCachingEnabled(ctx)

      expect(ctx.get(sermonCachingEnabledAtom)).toBe(false)
    })
  })
})

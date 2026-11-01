import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import {
  reloadAsync,
  type UpdateInfo,
  type UpdateInfoNew,
  UpdateInfoType,
  type UseUpdatesReturnType,
} from 'expo-updates'
import { isPlayingAtom } from 'entities/player'
import { renderHookWithProviders } from 'shared/mocks'
import { updateDialogVisibleAtom, updateStateAtom } from 'shared/model'
import { useOtaAutoApply } from './index.native'

// entities/player pulls native expo-audio, which throws at import in Jest.
jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn(), setAudioModeAsync: jest.fn() }))

let mockUpdates: Partial<UseUpdatesReturnType> = {}

jest.mock('expo-updates', () => ({
  reloadAsync: jest.fn(async () => undefined),
  UpdateInfoType: { NEW: 'new', ROLLBACK: 'rollback' },
  useUpdates: () => mockUpdates,
}))

jest.useFakeTimers()

const mockReloadAsync = jest.mocked(reloadAsync)
const UPDATE_ID = 'update-1'

const newUpdate = (updateId: string): UpdateInfoNew => ({
  createdAt: new Date(0),
  manifest: { assets: [], commitTime: 0, id: updateId },
  type: UpdateInfoType.NEW,
  updateId,
})

const rollback = (): UpdateInfo => ({
  ...newUpdate(UPDATE_ID),
  manifest: undefined,
  type: UpdateInfoType.ROLLBACK,
  updateId: undefined,
})

const setUpdates = (downloadedUpdate: UpdateInfo): void => {
  mockUpdates = {
    downloadedUpdate,
    isDownloading: false,
    isRestarting: false,
    isUpdatePending: true,
  }
}

const setPlaying = async (ctx: ReturnType<typeof createCtx>, isPlaying: boolean) => {
  await act(async () => {
    isPlayingAtom(ctx, isPlaying)
  })
}

const mount = async (options: { playing?: boolean; update?: UpdateInfo } = {}) => {
  jest.clearAllMocks()
  const ctx = createCtx()
  updateStateAtom(ctx, 'idle')
  updateDialogVisibleAtom(ctx, false)
  if (options.playing) await setPlaying(ctx, true)
  setUpdates(options.update ?? newUpdate(UPDATE_ID))

  return renderHookWithProviders(() => useOtaAutoApply(), { ctx })
}

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

describe('useOtaAutoApply', () => {
  test('does not reload before the 5s delay', async () => {
    await mount()
    await advance(4999)
    expect(mockReloadAsync).not.toHaveBeenCalled()
    await advance(1)
    expect(mockReloadAsync).toHaveBeenCalledTimes(1)
  })

  test('reloads once when idle with a pending NEW bundle', async () => {
    await mount()
    await advance(5000)
    expect(mockReloadAsync).toHaveBeenCalledTimes(1)
  })

  test('applies a pending bundle only once per session', async () => {
    const { rerender } = await mount()
    await advance(5000)
    expect(mockReloadAsync).toHaveBeenCalledTimes(1)
    setUpdates(newUpdate(UPDATE_ID))
    await rerender(undefined)
    await advance(60_000)
    expect(mockReloadAsync).toHaveBeenCalledTimes(1)
  })

  test.each([
    { name: 'never reloads for a ROLLBACK directive', options: { update: rollback() } },
    { name: 'does not reload while the player is playing', options: { playing: true } },
  ])('$name', async ({ options }) => {
    await mount(options)
    await advance(10_000)
    expect(mockReloadAsync).not.toHaveBeenCalled()
  })

  test.each([
    { name: 'arms a fresh 5s window when playback pauses', playing: true },
    { name: 'cancels the armed reload when playback starts, re-arms on pause', playing: false },
  ])('$name', async ({ playing }) => {
    const { ctx } = await mount({ playing })
    if (!playing) await advance(3000)
    await setPlaying(ctx, !playing)
    await advance(playing ? 0 : 10_000)
    expect(mockReloadAsync).not.toHaveBeenCalled()
    await setPlaying(ctx, false)
    await advance(4999)
    expect(mockReloadAsync).not.toHaveBeenCalled()
    await advance(1)
    expect(mockReloadAsync).toHaveBeenCalledTimes(1)
  })
})

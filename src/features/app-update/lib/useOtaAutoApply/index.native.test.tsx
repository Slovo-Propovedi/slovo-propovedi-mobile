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
import { DarkTheme, LightTheme, themeModeAtom } from 'shared/ui/theme'
import { useOtaAutoApply } from './index.native'

// entities/player pulls native expo-audio, which throws at import in Jest.
jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn(), setAudioModeAsync: jest.fn() }))

let mockUpdates: Partial<UseUpdatesReturnType> = {}

jest.mock('expo-updates', () => ({
  reloadAsync: jest.fn(async () => undefined),
  UpdateInfoType: { NEW: 'new', ROLLBACK: 'rollback' },
  useUpdates: () => mockUpdates,
}))

interface ReloadScreenAssetMock {
  downloadAsync: jest.Mock
  downloaded: boolean
  localUri: string
  uri: string
}

// jest-expo maps every image to the same module id (1), so give the two splash
// images explicit ids to keep the Asset.fromModule mapping readable and distinct.
jest.mock('../../../../../assets/splash.png', () => 101)
jest.mock('../../../../../assets/dark-splash-icon.png', () => 202)

jest.mock('expo-asset', () => {
  const createAssetMock = (localUri: string): ReloadScreenAssetMock => {
    const asset = {
      downloadAsync: jest.fn(),
      downloaded: false,
      localUri,
      uri: `https://mock/${localUri.split('/').pop()}`,
    }
    asset.downloadAsync.mockResolvedValue(asset)
    return asset
  }

  const fallbackAsset = createAssetMock('file:///mock-asset')
  const splashAsset = createAssetMock('file:///data/user/0/splash.png')
  const darkSplashAsset = createAssetMock('file:///data/user/0/dark-splash-icon.png')
  const assetsByModule = new Map([
    [101, splashAsset],
    [202, darkSplashAsset],
  ])
  const fromModule = jest.fn((module: number) => assetsByModule.get(module) ?? fallbackAsset)

  return { Asset: { fromModule }, mockReloadScreenAssets: { darkSplashAsset, splashAsset } }
})

const { darkSplashAsset, splashAsset } = jest.requireMock<{
  mockReloadScreenAssets: {
    darkSplashAsset: ReloadScreenAssetMock
    splashAsset: ReloadScreenAssetMock
  }
}>('expo-asset').mockReloadScreenAssets

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

  test('mirrors the light splash on the reload screen', async () => {
    await mount()
    await advance(5000)
    expect(mockReloadAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        reloadScreenOptions: expect.objectContaining({
          backgroundColor: LightTheme.primary,
          fade: true,
          image: splashAsset.localUri,
          imageResizeMode: 'contain',
          spinner: { enabled: false },
        }),
      }),
    )
  })

  test('mirrors the dark splash on the reload screen', async () => {
    const { ctx } = await mount()
    await act(async () => {
      themeModeAtom(ctx, 'dark')
    })
    await advance(5000)
    expect(mockReloadAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        reloadScreenOptions: expect.objectContaining({
          backgroundColor: DarkTheme.background,
          image: darkSplashAsset.localUri,
        }),
      }),
    )
  })

  test('still reloads without an icon when the asset cannot be downloaded', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    splashAsset.downloadAsync.mockRejectedValueOnce(new Error('asset download failed'))
    await mount()
    await advance(5000)

    expect(mockReloadAsync).toHaveBeenCalledTimes(1)
    const reloadOptions = mockReloadAsync.mock.calls[0]?.[0]
    expect(reloadOptions?.reloadScreenOptions?.image).toBeUndefined()
    jest.restoreAllMocks()
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

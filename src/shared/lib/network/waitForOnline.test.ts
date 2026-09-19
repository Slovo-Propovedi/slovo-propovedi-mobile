import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import { waitForOnline } from './waitForOnline'

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn() },
}))

const ONLINE_STATE = { isConnected: true, isInternetReachable: true } as unknown as NetInfoState
const OFFLINE_STATE = { isConnected: false, isInternetReachable: false } as unknown as NetInfoState
const WIFI_NO_INTERNET_STATE = {
  isConnected: true,
  isInternetReachable: false,
} as unknown as NetInfoState

const mockedFetch = jest.mocked(NetInfo.fetch)

describe('waitForOnline', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockedFetch.mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('resolves true immediately when online (single check)', async () => {
    mockedFetch.mockResolvedValue(ONLINE_STATE)

    await expect(waitForOnline(5000)).resolves.toBe(true)
    expect(mockedFetch).toHaveBeenCalledTimes(1)
  })

  test('resolves true after offline polls once connectivity returns', async () => {
    mockedFetch
      .mockResolvedValueOnce(OFFLINE_STATE)
      .mockResolvedValueOnce(OFFLINE_STATE)
      .mockResolvedValueOnce(ONLINE_STATE)

    const promise = waitForOnline(10_000)
    await jest.advanceTimersByTimeAsync(2000)

    await expect(promise).resolves.toBe(true)
    expect(mockedFetch).toHaveBeenCalledTimes(3)
  })

  test('resolves false when timeout elapses while still offline', async () => {
    mockedFetch.mockResolvedValue(OFFLINE_STATE)

    const promise = waitForOnline(3000)
    await jest.advanceTimersByTimeAsync(3500)

    await expect(promise).resolves.toBe(false)
  })

  test('keeps polling while the interface is connected but internet is unreachable', async () => {
    mockedFetch.mockResolvedValue(WIFI_NO_INTERNET_STATE)

    const promise = waitForOnline(3000)
    await jest.advanceTimersByTimeAsync(3500)

    await expect(promise).resolves.toBe(false)
    expect(mockedFetch).toHaveBeenCalledTimes(4)
  })

  test('checks immediately with zero timeout and gives up if offline', async () => {
    mockedFetch.mockResolvedValue(OFFLINE_STATE)

    await expect(waitForOnline(0)).resolves.toBe(false)
    expect(mockedFetch).toHaveBeenCalledTimes(1)
  })

  test('returns early without polling when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(waitForOnline(5000, controller.signal)).resolves.toBe(false)
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  test('returns early when the signal aborts during polling', async () => {
    mockedFetch.mockResolvedValue(OFFLINE_STATE)
    const controller = new AbortController()

    const promise = waitForOnline(10_000, controller.signal)
    await jest.advanceTimersByTimeAsync(1000)
    controller.abort()
    await jest.advanceTimersByTimeAsync(1000)

    await expect(promise).resolves.toBe(false)
    expect(mockedFetch).toHaveBeenCalledTimes(2)
  })
})

import NetInfo, { type NetInfoState, NetInfoStateType } from '@react-native-community/netinfo'
import { isOnlineAtom } from 'shared/model/network'
import { ctx } from '../reatom-ctx'
import { subscribeToNetwork } from './networkSubscription'

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn() },
  NetInfoStateType: {
    bluetooth: 'bluetooth',
    cellular: 'cellular',
    ethernet: 'ethernet',
    none: 'none',
    other: 'other',
    unknown: 'unknown',
    vpn: 'vpn',
    wifi: 'wifi',
    wimax: 'wimax',
  },
}))

const makeState = (isConnected: boolean, isInternetReachable: boolean | null): NetInfoState => ({
  details: { isConnectionExpensive: false },
  isConnected,
  isInternetReachable,
  type: NetInfoStateType.other,
})

const mockedAddEventListener = jest.mocked(NetInfo.addEventListener)

describe('subscribeToNetwork', () => {
  let listener: (state: NetInfoState) => void

  beforeEach(() => {
    jest.clearAllMocks()
    isOnlineAtom(ctx, true)
    mockedAddEventListener.mockImplementation(callback => {
      listener = callback
      return () => {}
    })
  })

  test('writes true into isOnlineAtom when internet is reachable', () => {
    const unsubscribe = subscribeToNetwork()

    listener(makeState(true, true))

    expect(ctx.get(isOnlineAtom)).toBe(true)
    unsubscribe()
  })

  test('writes false into isOnlineAtom when the interface is connected but internet is unreachable', () => {
    const unsubscribe = subscribeToNetwork()

    listener(makeState(true, false))

    expect(ctx.get(isOnlineAtom)).toBe(false)
    unsubscribe()
  })

  test('falls back to the interface flag while reachability is unknown', () => {
    const unsubscribe = subscribeToNetwork()

    listener(makeState(true, null))

    expect(ctx.get(isOnlineAtom)).toBe(true)
    unsubscribe()
  })
})

import { type NetInfoState, NetInfoStateType } from '@react-native-community/netinfo'
import { isNetInfoOnline } from './isNetInfoOnline'

// NetInfoState types isInternetReachable as boolean | null, but the web first
// emission is genuinely undefined — the cast keeps the factory honest about it.
const makeState = (
  isConnected: boolean,
  isInternetReachable: boolean | null | undefined,
): NetInfoState => ({
  details: { isConnectionExpensive: false },
  isConnected,
  isInternetReachable: isInternetReachable as boolean | null,
  type: NetInfoStateType.other,
})

describe('isNetInfoOnline', () => {
  test('true when internet is reachable and the interface is connected', () => {
    expect(isNetInfoOnline(makeState(true, true))).toBe(true)
  })

  test('false when the interface is connected but internet is unreachable', () => {
    expect(isNetInfoOnline(makeState(true, false))).toBe(false)
  })

  test('falls back to the interface flag while reachability is unknown', () => {
    expect(isNetInfoOnline(makeState(true, null))).toBe(true)
  })

  test('true when reachability is undefined (web first emission) and the interface is connected', () => {
    expect(isNetInfoOnline(makeState(true, undefined))).toBe(true)
  })

  test('false when reachability is unknown and the interface is down', () => {
    expect(isNetInfoOnline(makeState(false, null))).toBe(false)
  })

  test('false when both flags are false', () => {
    expect(isNetInfoOnline(makeState(false, false))).toBe(false)
  })
})

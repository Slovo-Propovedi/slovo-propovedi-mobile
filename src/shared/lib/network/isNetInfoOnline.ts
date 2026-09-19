import type { NetInfoState } from '@react-native-community/netinfo'

// isInternetReachable is null while unknown (and on web) — fall back to the
// interface flag so web and cold-start keep the previous behavior.
export const isNetInfoOnline = (state: NetInfoState): boolean =>
  Boolean(state.isInternetReachable ?? state.isConnected)

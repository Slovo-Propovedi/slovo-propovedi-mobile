import NetInfo from '@react-native-community/netinfo'
import { ctx } from 'shared/lib/reatom-ctx'
import { isOnlineAtom } from 'shared/model'

export const subscribeToNetwork = (): (() => void) =>
  NetInfo.addEventListener(state => {
    isOnlineAtom(ctx, Boolean(state.isConnected))
  })

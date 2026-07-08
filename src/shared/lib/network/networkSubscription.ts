import NetInfo from '@react-native-community/netinfo'
import { isOnlineAtom } from '../../model/network'
import { ctx } from '../reatom-ctx'

export const subscribeToNetwork = (): (() => void) =>
  NetInfo.addEventListener(state => {
    isOnlineAtom(ctx, Boolean(state.isConnected))
  })

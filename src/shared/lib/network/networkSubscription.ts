import NetInfo from '@react-native-community/netinfo'
import { isOnlineAtom } from '../../model/network'
import { ctx } from '../reatom-ctx'
import { isNetInfoOnline } from './isNetInfoOnline'

export const subscribeToNetwork = (): (() => void) =>
  NetInfo.addEventListener(state => {
    isOnlineAtom(ctx, isNetInfoOnline(state))
  })

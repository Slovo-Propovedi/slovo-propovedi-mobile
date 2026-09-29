import NetInfo from '@react-native-community/netinfo'
import { setOnlineStatus } from 'shared/model/network'
import { ctx } from '../reatom-ctx'
import { isNetInfoOnline } from './isNetInfoOnline'

export const subscribeToNetwork = (): (() => void) =>
  NetInfo.addEventListener(state => {
    setOnlineStatus(ctx, isNetInfoOnline(state))
  })

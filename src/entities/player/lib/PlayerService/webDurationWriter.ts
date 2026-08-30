import AsyncStorage from '@react-native-async-storage/async-storage'
import { CURRENT_SOUND_DURATION } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import type { WebPlayerState } from './webPlayerState'
import { setDurationAction } from '../../model'

export const writeWebDuration = (state: WebPlayerState, durationMs: number) => {
  void setDurationAction(ctx, durationMs)
  state.setDuration(durationMs)
  void AsyncStorage.setItem(CURRENT_SOUND_DURATION, String(durationMs))
}

export const resetWebDuration = (state: WebPlayerState) => {
  void setDurationAction(ctx, 0)
  state.setDuration(0)
}

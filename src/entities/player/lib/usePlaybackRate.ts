import { useAtom } from '@reatom/npm-react'
import { playbackRateAtom } from '../playback-rate'
import { usePlayer } from './usePlayer'

export const usePlaybackRate = () => {
  const [rate] = useAtom(playbackRateAtom)
  const { setPlaybackRate } = usePlayer()

  return { rate, setPlaybackRate }
}

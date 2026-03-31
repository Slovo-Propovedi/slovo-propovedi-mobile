import { useAtom } from '@reatom/npm-react'
import {
  currentAudioAtom,
  durationAtom,
  isBufferingAtom,
  isPlayingAtom,
  positionAtom,
  volumeAtom,
} from '../model'

export const usePlayerState = () => {
  const [currentAudio] = useAtom(currentAudioAtom)
  const [duration] = useAtom(durationAtom)
  const [isBuffering] = useAtom(isBufferingAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const [position] = useAtom(positionAtom)
  const [volume] = useAtom(volumeAtom)

  return {
    currentAudio,
    duration,
    isBuffering,
    isPlaying,
    position,
    volume,
  }
}

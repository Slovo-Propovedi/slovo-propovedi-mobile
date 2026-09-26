import { useAtom } from '@reatom/npm-react'
import { cacheUpdateTriggerAtom } from 'entities/offline-cache'
import { currentAudioAtom, isPlayingAtom } from 'entities/player'

export const usePlaylistPlayerState = () => {
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)

  return { cacheTrigger, currentAudio, isPlaying }
}

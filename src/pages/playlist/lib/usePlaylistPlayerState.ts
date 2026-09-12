import { useAtom } from '@reatom/npm-react'
import { currentAudioAtom, isPlayingAtom } from 'entities/player'
import { cacheUpdateTriggerAtom } from 'shared/lib/cache-triggers'

export const usePlaylistPlayerState = () => {
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)

  return { cacheTrigger, currentAudio, isPlaying }
}

import { useAtom } from '@reatom/npm-react'
import { currentAudioAtom, downloadingAudioUrlAtom, isPlayingAtom } from 'entities/player'
import { cacheUpdateTriggerAtom } from 'shared/lib/cache-triggers'
import { isCachingPlaylistAtom } from '../model'

export const usePlaylistPlayerState = () => {
  const [currentAudio] = useAtom(currentAudioAtom)
  const [downloadingUrl] = useAtom(downloadingAudioUrlAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const [isCaching] = useAtom(isCachingPlaylistAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)

  return { cacheTrigger, currentAudio, downloadingUrl, isCaching, isPlaying }
}

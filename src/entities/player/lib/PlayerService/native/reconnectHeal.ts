import { ctx } from 'shared/lib/reatom-ctx'
import { isBufferingAtom, isPlayingAtom, positionAtom } from '../../../model'
import { audioLoader } from './AudioLoader'

interface HealablePlayerService {
  loadAudio: (audioUrl: string, initialPositionMs?: number) => Promise<unknown>
  play: () => Promise<void>
  replaceAudio: (audioUrl: string, initialPositionMs?: number) => Promise<unknown>
}

const CACHE_URI_PREFIX = 'file://'

export const recoverStreamAfterReconnect = async (
  service: HealablePlayerService,
  audioUrl: string,
): Promise<void> => {
  if (!audioUrl) return
  const lastResolvedUrl = audioLoader.getLastResolvedUrl()
  if (lastResolvedUrl === null || lastResolvedUrl.startsWith(CACHE_URI_PREFIX)) return
  if (!audioLoader.isPlayerLoaded()) {
    await service.loadAudio(audioUrl, ctx.get(positionAtom))
    return
  }
  const isPlaying = ctx.get(isPlayingAtom)
  const isBuffering = ctx.get(isBufferingAtom)
  if (isPlaying && !isBuffering) return
  const shouldResume = isPlaying
  await service.replaceAudio(audioUrl, ctx.get(positionAtom))
  if (shouldResume) await service.play()
}

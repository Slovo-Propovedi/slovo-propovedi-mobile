import { ctx } from 'shared/lib/reatom-ctx'
import type { LockScreenMetadata } from '../types'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  isBufferingAtom,
  isPlayingAtom,
  positionAtom,
} from '../../../model'
import { isStalledOfflineAtom } from '../../stalledOffline'
import { audioLoader } from './AudioLoader'

interface HealablePlayerService {
  loadAudio: (audioUrl: string, initialPositionMs?: number) => Promise<unknown>
  play: () => Promise<void>
  reassertLockScreenMetadata: (metadata: LockScreenMetadata) => void
  replaceAudio: (audioUrl: string, initialPositionMs?: number) => Promise<unknown>
}

const CACHE_URI_PREFIX = 'file://'

const buildLockScreenMetadata = (): LockScreenMetadata | null => {
  const currentAudio = ctx.get(currentAudioAtom)
  if (!currentAudio) return null
  const currentPlaylist = ctx.get(currentPlaylistAtom)

  return {
    albumTitle: currentPlaylist?.title,
    artist: currentAudio.artist,
    artworkUrl: currentAudio.artwork,
    title: currentAudio.title,
  }
}

const reassertMetadata = (service: HealablePlayerService): void => {
  const metadata = buildLockScreenMetadata()
  if (metadata) service.reassertLockScreenMetadata(metadata)
}

export const recoverStreamAfterReconnect = async (
  service: HealablePlayerService,
  audioUrl: string,
): Promise<void> => {
  if (!audioUrl) return
  const lastResolvedUrl = audioLoader.getLastResolvedUrl()
  if (lastResolvedUrl === null || lastResolvedUrl.startsWith(CACHE_URI_PREFIX)) return
  if (!audioLoader.isPlayerLoaded()) {
    const player = await service.loadAudio(audioUrl, ctx.get(positionAtom))
    if (player) reassertMetadata(service)
    return
  }
  const isPlaying = ctx.get(isPlayingAtom)
  const isBuffering = ctx.get(isBufferingAtom)
  if (isPlaying && !isBuffering) return
  // A stall while offline auto-paused playback (Issue #109); the flag survives
  // until AudioLoader clears it on the next loadAudio/replaceAudio, so the heal
  // resumes exactly the track that stalled.
  const stalledOffline = ctx.get(isStalledOfflineAtom)
  const shouldResume = isPlaying || stalledOffline
  const player = await service.replaceAudio(audioUrl, ctx.get(positionAtom))
  if (shouldResume) await service.play()
  if (player) reassertMetadata(service)
}

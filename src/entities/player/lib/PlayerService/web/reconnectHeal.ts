import { ctx } from 'shared/lib/reatom-ctx'
import { isStalledOfflineAtom, setIsStalledOfflineAction } from '../../stalledOffline'

interface HealableWebPlayerService {
  getState: () => { isBuffering: boolean; isPlaying: boolean; position: number }
  play: () => Promise<void>
  replaceAudio: (audioUrl: string, initialPositionMs?: number) => Promise<unknown>
}

export const recoverStreamAfterReconnect = async (
  service: HealableWebPlayerService,
  audioUrl: string,
): Promise<void> => {
  if (!audioUrl) return
  const { isBuffering, isPlaying, position } = service.getState()
  if (isPlaying && !isBuffering) return
  // A stream error while offline set the flag (Issue #109). Capture it before
  // replaceAudio — the web player has no AudioLoader chokepoint to clear it, so
  // the heal clears it right after capture.
  const stalledOffline = ctx.get(isStalledOfflineAtom)
  void setIsStalledOfflineAction(ctx, false)
  const shouldResume = isPlaying || stalledOffline
  await service.replaceAudio(audioUrl, position)
  if (shouldResume) await service.play()
}

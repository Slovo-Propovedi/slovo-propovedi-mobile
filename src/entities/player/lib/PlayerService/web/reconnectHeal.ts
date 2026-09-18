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
  const shouldResume = isPlaying
  await service.replaceAudio(audioUrl, position)
  if (shouldResume) await service.play()
}

import { type Ctx } from '@reatom/framework'
import {
  getResumePosition,
  historyAtom,
  recordSermonSwitchAction,
} from 'entities/listening-history/@x/player'
import { type AudioPlayerData, type PlaylistData, toAudioPlayerData } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { savePlaybackProgress } from '../../lib/playbackProgress'
import { currentAudioAtom, durationAtom, positionAtom } from '../../model'
import { playSafely } from './playSafely'

interface ExecuteTrackSwitchParams {
  ctx: Ctx
  newIndex: number
  play: () => Promise<void>
  playlist: PlaylistData
  replaceAudio: (url: string, positionMs?: number) => Promise<unknown>
  setCurrentAudio: (audio: AudioPlayerData) => Promise<unknown>
  setLockScreenMetadata: (metadata: {
    albumTitle: string
    artist: string
    artworkUrl: null | string
    title: string
  }) => void
}

export const executeTrackSwitch = async ({
  ctx,
  newIndex,
  play,
  playlist,
  replaceAudio,
  setCurrentAudio,
  setLockScreenMetadata,
}: ExecuteTrackSwitchParams): Promise<void> => {
  const track = playlist.sermons[newIndex]

  const baseAudio = toAudioPlayerData(track)
  if (!baseAudio) {
    console.warn('[executeTrackSwitch] target sermon has no audioUrl, skipping switch')
    return
  }

  const newAudio: AudioPlayerData = { ...baseAudio, artwork: playlist.artwork }

  const oldAudio = ctx.get(currentAudioAtom)
  const oldPositionMs = ctx.get(positionAtom)

  // Persist new track's start position for crash-consistency (matches auto-advance path)
  const history = ctx.get(historyAtom)
  const resumeMs = getResumePosition(history, baseAudio.id)
  void savePlaybackProgress(ctx, { positionMs: resumeMs, sermonId: baseAudio.id }).catch(error => {
    console.error('[executeTrackSwitch] savePlaybackProgress failed:', error)
    reportError(error, 'Ошибка при сохранении позиции трека')
  })

  // Flush old track's position to history before switching
  if (oldAudio?.id && oldAudio.id !== baseAudio.id)
    void recordSermonSwitchAction(ctx, {
      markOldCompleted: false,
      newAudio,
      newPlaylist: playlist,
      oldDurationMs: ctx.get(durationAtom),
      oldPositionMs: Math.max(0, oldPositionMs),
      oldSermonId: oldAudio.id,
    }).catch(error => {
      console.error('[executeTrackSwitch] history flush failed:', error)
      reportError(error, 'Ошибка при сохранении позиции предыдущего трека')
    })

  await setCurrentAudio(newAudio)
  await replaceAudio(newAudio.audioUrl, resumeMs)

  // Play before setting lock-screen metadata (matches usePlaySermon; fixes lock-screen notification)
  await playSafely(play)

  setLockScreenMetadata({
    albumTitle: playlist.title,
    artist: newAudio.artist,
    artworkUrl: newAudio.artwork,
    title: newAudio.title,
  })
}

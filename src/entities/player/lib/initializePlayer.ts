import AsyncStorage from '@react-native-async-storage/async-storage'
import z from 'zod'
import {
  CURRENT_AUDIO,
  CURRENT_PLAYLIST,
  CURRENT_REPEAT_MODE,
  CURRENT_SOUND_POSITION,
  CURRENT_SOUND_VOLUME,
} from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { audioPlayerDataSchema, getParseJsonWithSchema, playlistDataSchema } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import {
  repeatModeSchema,
  setCurrentAudioAction,
  setCurrentPlaylistAction,
  setRepeatModeAction,
} from '../model'
import { playbackProgressSchema } from './playbackProgress'
import { playerService } from './PlayerService'
import { audioModeManager } from './PlayerService/AudioModeManager'
import {
  readStartupAttempts,
  resetStartupAttempts,
  shouldSkipRestore,
  writeStartupAttempts,
} from './startupGuard'

const parseAudioPlayerData = getParseJsonWithSchema(audioPlayerDataSchema)
const parsePlaylistData = getParseJsonWithSchema(playlistDataSchema)
const parsePlaybackProgress = getParseJsonWithSchema(playbackProgressSchema)

export const initializePlayer = async () => {
  try {
    const startupAttempts = await readStartupAttempts()

    if (shouldSkipRestore(startupAttempts)) {
      console.warn('[initializePlayer] skipping player restore after repeated startup crashes')
      await resetStartupAttempts()
      return
    }

    await writeStartupAttempts(startupAttempts + 1)

    // Unconditional configure: re-assert audio mode even without a restored track.
    // Isolated so a hard failure doesn't skip restoring track/playlist/volume/repeat.
    try {
      await audioModeManager.configure()
    } catch (error) {
      console.warn('[initializePlayer] Failed to configure audio mode:', error)
    }

    const stored = await AsyncStorage.multiGet([
      CURRENT_AUDIO,
      CURRENT_PLAYLIST,
      CURRENT_SOUND_POSITION,
      CURRENT_SOUND_VOLUME,
      CURRENT_REPEAT_MODE,
    ])
    const storedMap = Object.fromEntries(stored)
    const storedCurrentAudio = storedMap[CURRENT_AUDIO]
    const storedCurrentPlaylist = storedMap[CURRENT_PLAYLIST]
    const storedSoundPosition = storedMap[CURRENT_SOUND_POSITION]
    const storedVolume = storedMap[CURRENT_SOUND_VOLUME]
    const storedRepeatMode = storedMap[CURRENT_REPEAT_MODE]

    const parsedVolume = storedVolume ? Number(storedVolume) : null
    const { data: parsedRepeat } = repeatModeSchema.safeParse(storedRepeatMode)
    const audio = parseAudioPlayerData(storedCurrentAudio)
    const playlist = parsePlaylistData(storedCurrentPlaylist)
    const parsedProgress = parsePlaybackProgress(storedSoundPosition)
    const { data: validVolume } = z.number().safeParse(parsedVolume)

    if (validVolume) await playerService.setVolume(validVolume)
    if (parsedRepeat) await setRepeatModeAction(ctx, parsedRepeat)

    if (audio) {
      await setCurrentAudioAction(ctx, audio)
      const resumeMs = computeResumeMs(parsedProgress, audio.id)
      await playerService.loadAudio(audio.audioUrl, resumeMs)
      playerService.setLockScreenMetadata({
        albumTitle: playlist?.title,
        artist: audio.artist,
        artworkUrl: audio.artwork,
        title: audio.title,
      })
    }

    if (playlist) await setCurrentPlaylistAction(ctx, playlist)
  } catch (error) {
    console.error('Error initializing player data:', error)
    reportError(error, 'Ошибка при восстановлении плеера')
  }
}

const computeResumeMs = (
  parsedProgress:
    { durationMs?: number; positionMs: number; savedAtMs: number; sermonId: string } | undefined,
  currentSermonId: string,
): number => {
  if (!parsedProgress || parsedProgress.sermonId !== currentSermonId) return 0

  const { durationMs: duration, positionMs } = parsedProgress

  if (typeof duration === 'number' && duration > 0) return Math.min(positionMs, duration)
  return positionMs
}

import AsyncStorage from '@react-native-async-storage/async-storage'
import z from 'zod'
import {
  CURRENT_AUDIO,
  CURRENT_EQUALIZER_ENABLED,
  CURRENT_EQUALIZER_GAINS,
  CURRENT_PLAYBACK_RATE,
  CURRENT_PLAYLIST,
  CURRENT_REPEAT_MODE,
  CURRENT_SOUND_BALANCE,
  CURRENT_SOUND_PITCH,
  CURRENT_SOUND_POSITION,
  CURRENT_SOUND_VOLUME,
} from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import {
  repeatModeSchema,
  setCurrentAudioAction,
  setCurrentPlaylistAction,
  setRepeatModeAction,
} from '../model'
import { playbackRateSchema } from '../playback-rate'
import { computeResumeMs } from './playbackProgress'
import { playerService } from './PlayerService'
import { audioModeManager } from './PlayerService/native/AudioModeManager'
import {
  parseAudioPlayerData,
  parsePlaybackProgress,
  parsePlaylistData,
} from './playerStorageParsers'
import { setupReconnectRecovery } from './reconnectRecovery'
import { restoreAudioSettings } from './restoreAudioSettings'
import {
  readStartupAttempts,
  resetStartupAttempts,
  shouldSkipRestore,
  writeStartupAttempts,
} from './startupGuard'

export const initializePlayer = async () => {
  // Must run before the skip-restore early return: reconnect recovery also
  // re-caches the current track when restore is skipped.
  setupReconnectRecovery()
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
      CURRENT_PLAYBACK_RATE,
      CURRENT_SOUND_BALANCE,
      CURRENT_EQUALIZER_ENABLED,
      CURRENT_EQUALIZER_GAINS,
      CURRENT_SOUND_PITCH,
    ])
    const storedMap = Object.fromEntries(stored)
    const storedCurrentAudio = storedMap[CURRENT_AUDIO]
    const storedCurrentPlaylist = storedMap[CURRENT_PLAYLIST]
    const storedSoundPosition = storedMap[CURRENT_SOUND_POSITION]
    const storedVolume = storedMap[CURRENT_SOUND_VOLUME]
    const storedRepeatMode = storedMap[CURRENT_REPEAT_MODE]
    const storedPlaybackRate = storedMap[CURRENT_PLAYBACK_RATE]

    const parsedVolume = storedVolume ? Number(storedVolume) : null
    const parsedRate = storedPlaybackRate ? Number(storedPlaybackRate) : null
    const { data: parsedRepeat } = repeatModeSchema.safeParse(storedRepeatMode)
    const audio = parseAudioPlayerData(storedCurrentAudio)
    const playlist = parsePlaylistData(storedCurrentPlaylist)
    const parsedProgress = parsePlaybackProgress(storedSoundPosition)
    const volumeResult = z.number().min(0).max(1).safeParse(parsedVolume)
    const { data: validRate } = playbackRateSchema.safeParse(parsedRate)

    if (volumeResult.success) await playerService.setVolume(volumeResult.data)
    if (validRate) await playerService.setPlaybackRate(validRate)
    restoreAudioSettings(storedMap)
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

    // A completed restore — even a partial one (no stored track, or a track that
    // failed validation) — proves startup did not crash. Reset the guard so
    // normal open/close cycles never accumulate to the skip threshold; only a
    // thrown error (below) leaves the counter incremented.
    await resetStartupAttempts()
  } catch (error) {
    console.error('Error initializing player data:', error)
    reportError(error, 'Ошибка при восстановлении плеера')
  }
}

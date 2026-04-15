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
import { parseJsonWithSchema, playlistDataSchema } from 'shared/model'
import {
  repeatModeSchema,
  setCurrentAudioAction,
  setCurrentPlaylistAction,
  setRepeatModeAction,
} from '../model'
import { audioPlayerDataSchema } from '../ui/PlayerControls.types'
import { playerService } from './PlayerService'

export const initializePlayer = async () => {
  try {
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
    const audio = parseJsonWithSchema(audioPlayerDataSchema)(storedCurrentAudio)
    const playlist = parseJsonWithSchema(playlistDataSchema)(storedCurrentPlaylist)
    const { data: validVolume } = z.number().safeParse(parsedVolume)

    if (validVolume) await playerService.setVolume(validVolume)
    if (parsedRepeat) await setRepeatModeAction(ctx, parsedRepeat)

    if (audio) {
      await setCurrentAudioAction(ctx, audio)
      await playerService.loadAudio(audio.audioUrl, Number(storedSoundPosition) || 0)
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
  }
}

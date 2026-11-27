import AsyncStorage from '@react-native-async-storage/async-storage'
import { action } from '@reatom/framework'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { CURRENT_AUDIO } from 'shared/config'
import { currentAudioAtom } from '../model'
import { toPersistedAudio } from './persistedAudio'

// Startup-restore path only. The mini pill must exist on the first frame, so the
// atom flips BEFORE the slower storage write; user actions keep the opposite
// order in `setCurrentAudio` (persist, then update the UI). The re-write is
// best-effort: the track was just read and normalized in memory, so a failed
// write must not abort the restore and skip `loadAudio` (the pill would show an
// unloaded track).
export const hydrateCurrentAudio = action(async (ctx, audio: AudioPlayerData) => {
  const persisted = toPersistedAudio(audio)
  currentAudioAtom(ctx, persisted)

  try {
    await AsyncStorage.setItem(CURRENT_AUDIO, JSON.stringify(persisted))
  } catch (error) {
    console.error('Failed to persist hydrated current audio:', error)
  }

  return persisted
}, 'hydrateCurrentAudio')

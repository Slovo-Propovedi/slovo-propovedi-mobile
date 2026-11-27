import AsyncStorage from '@react-native-async-storage/async-storage'
import { action } from '@reatom/framework'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { CURRENT_AUDIO } from 'shared/config'
import { currentAudioAtom } from '../model'
import { toPersistedAudio } from './persistedAudio'

// Startup-restore path only. The mini pill must exist on the first frame, so the
// atom flips BEFORE the slower storage write; user actions keep the opposite
// order in `setCurrentAudio` (persist, then update the UI).
export const hydrateCurrentAudio = action(async (ctx, audio: AudioPlayerData) => {
  const persisted = toPersistedAudio(audio)
  currentAudioAtom(ctx, persisted)
  await AsyncStorage.setItem(CURRENT_AUDIO, JSON.stringify(persisted))

  return persisted
}, 'hydrateCurrentAudio')

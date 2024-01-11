import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Audio } from 'expo-av';
import { create } from 'zustand';
import { CURRENT_SOUND_DURATION, CURRENT_SOUND_POSITION } from 'shared';

interface PlayerStoreStates {
  currentSound: Audio.Sound | null;
  currentSoundDuration: number;

  currentSoundPosition: number;

  isCurrentSoundBuffering: boolean;

  isPlayingCurrentAudio: boolean;
}

interface PlayerStore extends PlayerStoreStates {
  resetStates: () => void;

  setCurrentSound: (sound: Audio.Sound | null) => void;

  setCurrentSoundDuration: (duration: number) => Promise<void>;

  setCurrentSoundPosition: (position: number) => Promise<void>;
  setIsCurrentSoundBuffering: (value: boolean) => void;
  setIsPlayingCurrentAudio: (value: boolean) => void;
}

const initialState: PlayerStoreStates = {
  currentSound: null,
  currentSoundDuration: 0,

  currentSoundPosition: 0,

  isCurrentSoundBuffering: false,

  isPlayingCurrentAudio: false,
};

export const usePlayerStore = create<PlayerStore>(set => ({
  ...initialState,

  resetStates: () =>
    set(state => ({
      ...state,
      ...initialState,
    })),
  setCurrentSound: sound =>
    set(state => ({
      ...state,
      currentSound: sound,
    })),

  setCurrentSoundDuration: async duration => {
    set(state => ({
      ...state,
      currentSoundDuration: duration,
    }));
    await AsyncStorage.setItem(CURRENT_SOUND_DURATION, `${duration}`);
  },
  setCurrentSoundPosition: async position => {
    set(state => ({
      ...state,
      currentSoundPosition: position,
    }));
    await AsyncStorage.setItem(CURRENT_SOUND_POSITION, `${position}`);
  },

  setIsCurrentSoundBuffering: value =>
    set(state => ({
      ...state,
      isCurrentSoundBuffering: value,
    })),
  setIsPlayingCurrentAudio: value =>
    set(state => ({
      ...state,
      isPlayingCurrentAudio: value,
    })),
}));

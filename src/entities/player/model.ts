import type { Audio } from 'expo-av';
import { create } from 'zustand';

interface PlayerStoreStates {
  currentSound: Audio.Sound | null;
  currentSoundDuration: number;
  currentSoundPosition: number;

  isPlayingCurrentAudio: boolean;

  playbackStatusInterval: NodeJS.Timeout | null;
}

interface PlayerStore extends PlayerStoreStates {
  resetPlaybackStatusInterval: () => void;
  resetStates: () => void;
  setCurrentSound: (sound: Audio.Sound | null) => void;

  setCurrentSoundDuration: (duration: number) => void;

  setCurrentSoundPosition: (position: number) => void;
  setIsPlayingCurrentAudio: (value: boolean) => void;

  setPlaybackStatusInterval: (timeout: NodeJS.Timeout | null) => void;
}

const initialState: PlayerStoreStates = {
  currentSound: null,
  currentSoundDuration: 0,

  currentSoundPosition: 0,

  isPlayingCurrentAudio: false,

  playbackStatusInterval: null,
};

export const usePlayerStore = create<PlayerStore>((set) => ({
  ...initialState,

  resetPlaybackStatusInterval: () => {
    set((state) => ({
      ...state,
      playbackStatusInterval: null,
    }));
  },
  resetStates: () => {
    set((state) => ({
      ...state,
      ...initialState,
    }));
  },
  setCurrentSound: (Sound) => {
    set((state) => ({
      ...state,
      currentSound: Sound,
    }));
  },

  setCurrentSoundDuration: (duration) => {
    set((state) => ({
      ...state,
      currentSoundDuration: duration,
    }));
  },

  setCurrentSoundPosition: (position) => {
    set((state) => ({
      ...state,
      currentSoundPosition: position,
    }));
  },

  setIsPlayingCurrentAudio: (value) => {
    set((state) => ({
      ...state,
      isPlayingCurrentAudio: value,
    }));
  },

  setPlaybackStatusInterval: (timeout) => {
    set((state) => ({
      ...state,
      playbackStatusInterval: timeout,
    }));
  },
}));

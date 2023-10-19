import type { Audio } from 'expo-av';
import { create } from 'zustand';

interface PlayerStore {
  currentSound: Audio.Sound | null;
  currentSoundDuration: number;
  currentSoundPosition: number;

  isPlayingCurrentAudio: boolean;

  playbackStatusInterval: NodeJS.Timeout | null;

  resetPlaybackStatusInterval: () => void;
  resetStates: () => void;
  setCurrentSound: (sound: Audio.Sound | null) => void;

  setCurrentSoundDuration: (duration: number) => void;

  setCurrentSoundPosition: (position: number) => void;
  setIsPlayingCurrentAudio: (value: boolean) => void;

  setPlaybackStatusInterval: (timeout: NodeJS.Timeout | null) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentAudio: null,
  currentSound: null,
  currentSoundDuration: 0,

  currentSoundPosition: 0,

  isPlayingCurrentAudio: false,

  playbackStatusInterval: null,

  resetPlaybackStatusInterval: () => {
    set((state) => ({
      ...state,
      playbackStatusInterval: null,
    }));
  },
  resetStates: () => {
    set((state) => ({
      ...state,
      currentAudio: null,
      currentSound: null,
      currentSoundDuration: 0,

      currentSoundPosition: 0,

      isPlayingCurrentAudio: false,

      playbackStatusInterval: null,
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

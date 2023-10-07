import { Audio } from 'expo-av';
import { create } from 'zustand';

interface PlayerStore {
  currentSound: Audio.Sound | null;
  currentSoundPosition: number;
  currentSoundDuration: number;

  isPlayingCurrentAudio: boolean;

  playbackStatusInterval: NodeJS.Timeout | null;

  setCurrentSound: (sound: Audio.Sound | null) => void;
  setCurrentSoundPosition: (position: number) => void;
  setCurrentSoundDuration: (duration: number) => void;

  setIsPlayingCurrentAudio: (value: boolean) => void;

  setPlaybackStatusInterval: (timeout: NodeJS.Timeout | null) => void;
  resetPlaybackStatusInterval: () => void;

  resetStates: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentSound: null,
  currentSoundPosition: 0,
  currentSoundDuration: 0,

  currentAudio: null,

  isPlayingCurrentAudio: false,

  playbackStatusInterval: null,

  setCurrentSound: (Sound) => {
    set((state) => ({
      ...state,
      currentSound: Sound,
    }));
  },
  setCurrentSoundPosition: (position) => {
    set((state) => ({
      ...state,
      currentSoundPosition: position,
    }));
  },
  setCurrentSoundDuration: (duration) => {
    set((state) => ({
      ...state,
      currentSoundDuration: duration,
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

  resetPlaybackStatusInterval: () => {
    set((state) => ({
      ...state,
      playbackStatusInterval: null,
    }));
  },

  resetStates: () => {
    set((state) => ({
      ...state,
      currentSound: null,
      currentSoundPosition: 0,
      currentSoundDuration: 0,

      currentAudio: null,

      isPlayingCurrentAudio: false,

      playbackStatusInterval: null,
    }));
  },
}));

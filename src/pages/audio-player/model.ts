import { Audio } from 'expo-av';
import { create } from 'zustand';
import { PlaylistData } from 'widgets';
import { AudioPlayerData } from './ui';

interface PlayerStore {
  currentSound: Audio.Sound | null;
  currentSoundPosition: number;
  currentSoundDuration: number;

  currentAudio: AudioPlayerData | null;
  currentPlaylist: PlaylistData | null;

  isPlayingCurrentAudio: boolean;

  playbackStatusInterval: NodeJS.Timeout | null;

  setCurrentSound: (sound: Audio.Sound | null) => void;
  setCurrentSoundPosition: (position: number) => void;
  setCurrentSoundDuration: (duration: number) => void;

  setCurrentAudio: (audio: AudioPlayerData) => void;
  resetCurrentAudio: () => void;

  setCurrentPlaylist: (playlist: PlaylistData) => void;
  resetCurrentPlaylist: () => void;

  setIsPlayingCurrentAudio: (value: boolean) => void;

  setPlaybackStatusInterval: (timeout: NodeJS.Timeout | null) => void;
  resetPlaybackStatusInterval: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentSound: null,
  currentSoundPosition: 0,
  currentSoundDuration: 0,

  currentAudio: null,
  currentPlaylist: null,

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

  setCurrentAudio: (audio) => {
    set((state) => ({
      ...state,
      currentAudio: audio,
    }));
  },
  resetCurrentAudio: () => {
    set((state) => ({
      ...state,
      currentAudio: null,
    }));
  },

  setCurrentPlaylist: (playlist) => {
    set((state) => ({
      ...state,
      currentPlaylist: playlist,
    }));
  },
  resetCurrentPlaylist: () => {
    set((state) => ({
      ...state,
      currentPlaylist: null,
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
}));

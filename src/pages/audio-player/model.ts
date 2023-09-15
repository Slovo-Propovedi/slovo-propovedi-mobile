import { Audio } from 'expo-av';
import { create } from 'zustand';
import { PlaylistData } from 'widgets';
import { AudioPlayerData } from './ui';

interface PlayerStore {
  currentSound: Audio.Sound | null;

  currentAudio: AudioPlayerData | null;
  currentPlaylist: PlaylistData | null;

  isPlayingCurrentAudio: boolean;

  setCurrentSound: (sound: Audio.Sound | null) => void;

  setCurrentAudio: (audio: AudioPlayerData) => void;
  resetCurrentAudio: () => void;

  setCurrentPlaylist: (playlist: PlaylistData) => void;
  resetCurrentPlaylist: () => void;

  setIsPlayingCurrentAudio: (value: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentSound: null,

  currentAudio: null,
  currentPlaylist: null,

  isPlayingCurrentAudio: false,

  setCurrentSound: (Sound) => {
    set((state) => ({
      ...state,
      currentSound: Sound,
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
}));

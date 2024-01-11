import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { AudioPlayerData } from 'entities/player';
import { CURRENT_AUDIO, CURRENT_PLAYLIST, type PlaylistData } from 'shared';

interface SermonPlayerControlsStore {
  currentAudio: AudioPlayerData | null;
  currentPlaylist: PlaylistData | null;

  resetCurrentAudio: () => void;
  resetCurrentPlaylist: () => void;

  resetStates: () => void;

  setCurrentAudio: (audio: AudioPlayerData) => Promise<void>;
  setCurrentPlaylist: (playlist: PlaylistData) => Promise<void>;
}

export const useSermonPlayerControlsStore = create<SermonPlayerControlsStore>(set => ({
  currentAudio: null,
  currentPlaylist: null,

  resetCurrentAudio: () =>
    set(state => ({
      ...state,
      currentAudio: null,
    })),
  resetCurrentPlaylist: () =>
    set(state => ({
      ...state,
      currentPlaylist: null,
    })),
  resetStates: () =>
    set(state => ({
      ...state,
      currentAudio: null,
      currentPlaylist: null,
    })),

  setCurrentAudio: async audio => {
    await AsyncStorage.setItem(CURRENT_AUDIO, JSON.stringify(audio));

    set(state => ({
      ...state,
      currentAudio: audio,
    }));
  },
  setCurrentPlaylist: async playlist => {
    await AsyncStorage.setItem(CURRENT_PLAYLIST, JSON.stringify(playlist));

    set(state => ({
      ...state,
      currentPlaylist: playlist,
    }));
  },
}));

import { create } from 'zustand';
import type { AudioPlayerData } from 'entities/player';
import type { PlaylistData } from 'shared';

interface SermonPlayerControlsStore {
  currentAudio: AudioPlayerData | null;
  currentPlaylist: PlaylistData | null;

  resetCurrentAudio: () => void;
  resetCurrentPlaylist: () => void;

  resetStates: () => void;
  setCurrentAudio: (audio: AudioPlayerData) => void;

  setCurrentPlaylist: (playlist: PlaylistData) => void;
}

export const useSermonPlayerControlsStore = create<SermonPlayerControlsStore>((set) => ({
  currentAudio: null,
  currentPlaylist: null,

  resetCurrentAudio: () => {
    set((state) => ({
      ...state,
      currentAudio: null,
    }));
  },
  resetCurrentPlaylist: () => {
    set((state) => ({
      ...state,
      currentPlaylist: null,
    }));
  },

  resetStates: () => {
    set((state) => ({
      ...state,
      currentAudio: null,
      currentPlaylist: null,
    }));
  },
  setCurrentAudio: (audio) => {
    set((state) => ({
      ...state,
      currentAudio: audio,
    }));
  },

  setCurrentPlaylist: (playlist) => {
    set((state) => ({
      ...state,
      currentPlaylist: playlist,
    }));
  },
}));

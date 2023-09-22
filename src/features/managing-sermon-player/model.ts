import { create } from 'zustand';
import { PlaylistData } from 'widgets';
import { AudioPlayerData } from 'entities/player';

interface ManagingSermonPlayerStore {
  currentAudio: AudioPlayerData | null;
  currentPlaylist: PlaylistData | null;

  setCurrentAudio: (audio: AudioPlayerData) => void;
  resetCurrentAudio: () => void;

  setCurrentPlaylist: (playlist: PlaylistData) => void;
  resetCurrentPlaylist: () => void;
}

export const useManagingSermonPlayerStore = create<ManagingSermonPlayerStore>((set) => ({
  currentAudio: null,
  currentPlaylist: null,

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
}));

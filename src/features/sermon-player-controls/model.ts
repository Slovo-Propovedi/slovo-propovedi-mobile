import { create } from 'zustand';
import { AudioPlayerData } from 'entities/player';
import { PlaylistData } from 'entities/playlist';

interface SermonPlayerControlsStore {
  currentAudio: AudioPlayerData | null;
  currentPlaylist: PlaylistData | null;

  setCurrentAudio: (audio: AudioPlayerData) => void;
  resetCurrentAudio: () => void;

  setCurrentPlaylist: (playlist: PlaylistData) => void;
  resetCurrentPlaylist: () => void;
}

export const useSermonPlayerControlsStore = create<SermonPlayerControlsStore>((set) => ({
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

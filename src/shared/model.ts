import { create } from 'zustand';

interface AppStore {
  isAudioPlayerMounted: boolean;

  setIsAudioPlayerMounted: (value: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isAudioPlayerMounted: false,

  setIsAudioPlayerMounted: (value) => {
    set((state) => ({
      ...state,
      isAudioPlayerMounted: value,
    }));
  },
}));

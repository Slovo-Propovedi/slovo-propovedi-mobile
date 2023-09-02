import { Audio } from 'expo-av';
import { create } from 'zustand';

interface SoundState {
  currentSound: Audio.Sound | null;
  currentSoundUrl: string | null;
  setCurrentSound: (params: { newSound: Audio.Sound | null; audioUrl: string }) => void;
}

export const useSoundStore = create<SoundState>((set) => ({
  currentSound: null,
  currentSoundUrl: null,
  setCurrentSound: ({ newSound, audioUrl }) => {
    set((state) => ({
      ...state,
      currentSound: newSound,
      currentSoundUrl: audioUrl,
    }));
  },
}));

import { create } from 'zustand';
import { Sermons, sermonsAPI } from 'shared';

interface SermonsState {
  sermons: Sermons | null;
  getSermons: () => Promise<Sermons>;
}

export const useSermonsStore = create<SermonsState>((set) => ({
  sermons: null,
  getSermons: async () => {
    const sermons = await sermonsAPI.getSermons();

    set((state) => ({
      ...state,
      sermons,
    }));

    return sermons;
  },
}));

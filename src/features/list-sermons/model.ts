import { create } from 'zustand';
import { Sermon, sermonsAPI } from 'shared';

interface SermonsState {
  sermons: Sermon[];
  getSermons: () => Promise<Sermon[]>;
}

export const useSermonsStore = create<SermonsState>((set) => ({
  sermons: [],

  getSermons: async () => {
    const sermons = await sermonsAPI.getSermons();

    set((state) => ({
      ...state,
      sermons,
    }));

    return sermons;
  },
}));

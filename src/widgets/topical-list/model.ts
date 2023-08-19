import { create } from 'zustand';
import { SermonsTabName, sermonsAPI } from 'shared';
import { Playlist } from 'shared';

interface TopicalListState {
  topicalList: Playlist[];
  getTopicalList: () => Promise<Playlist[]>;
}

export const useTopicalListStore = create<TopicalListState>((set) => ({
  topicalList: [],
  getTopicalList: async () => {
    const response = await sermonsAPI.getSermonsTabContent(SermonsTabName.Topical);

    const booksList = response?.playlists ?? [];

    set((state) => ({
      ...state,
      topicalList: booksList,
    }));

    return booksList;
  },
}));

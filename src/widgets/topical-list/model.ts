import { create } from 'zustand';
import { FetchedPlaylist, FetchedSermonsTabName, sermonsAPI } from 'shared';

interface TopicalListState {
  topicalList: FetchedPlaylist[];
  getTopicalList: () => Promise<FetchedPlaylist[]>;
}

export const useTopicalListStore = create<TopicalListState>((set) => ({
  topicalList: [],
  getTopicalList: async () => {
    const response = await sermonsAPI.getSermonsTabContent(FetchedSermonsTabName.Topical);

    const booksList = response?.playlists ?? [];

    set((state) => ({
      ...state,
      topicalList: booksList,
    }));

    return booksList;
  },
}));

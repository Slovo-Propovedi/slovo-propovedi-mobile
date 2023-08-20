import { create } from 'zustand';
import { FetchedPlaylist } from 'features';
import { FetchedSermonsTabName, sermonsAPI } from 'shared';

interface OnBibleBooksListState {
  onBibleBooksList: FetchedPlaylist[];
  getOnBibleBookList: () => Promise<FetchedPlaylist[]>;
}

export const useOnBibleBooksListStore = create<OnBibleBooksListState>((set) => ({
  onBibleBooksList: [],
  getOnBibleBookList: async () => {
    const response = await sermonsAPI.getSermonsTabContent(FetchedSermonsTabName.OnBible);

    const booksList = response?.playlists ?? [];

    set((state) => ({
      ...state,
      onBibleBooksList: booksList,
    }));

    return booksList;
  },
}));

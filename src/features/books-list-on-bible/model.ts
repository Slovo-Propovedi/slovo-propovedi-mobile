import { create } from 'zustand';
import { SermonsTabName, sermonsAPI } from 'shared';
import { Playlist } from 'shared';

interface OnBibleBooksListState {
  onBibleBooksList: Playlist[];
  getOnBibleBookList: () => Promise<Playlist[]>;
}

export const useOnBibleBooksListStore = create<OnBibleBooksListState>((set) => ({
  onBibleBooksList: [],
  getOnBibleBookList: async () => {
    const response = await sermonsAPI.getSermonsTabContent(SermonsTabName.OnBible);

    const booksList = response?.playlists ?? [];

    set((state) => ({
      ...state,
      onBibleBooksList: booksList,
    }));

    return booksList;
  },
}));

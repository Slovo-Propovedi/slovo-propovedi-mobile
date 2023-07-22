import { create } from 'zustand';
import { SermonsTabName, sermonsAPI } from 'shared';
import { Playlist } from 'shared';

interface OnBibleBooksListState {
  onBibleBooksList: Playlist[];
  getOnBibleBookList: () => Playlist[];
}

export const useOnBibleBooksListStore = create<OnBibleBooksListState>((set) => ({
  onBibleBooksList: [],
  getOnBibleBookList: () => {
    const booksList = sermonsAPI.getSermonsTabContent(SermonsTabName.OnBible)?.playlists ?? [];

    set((state) => ({
      ...state,
      onBibleBooksList: booksList,
    }));

    return booksList;
  },
}));

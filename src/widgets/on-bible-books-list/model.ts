import { create } from 'zustand';
import { TabContentName, sermonsAPI } from 'shared';
import { Playlist } from 'shared';

interface OnBibleBooksListState {
  onBibleBooksList: Playlist[];
  getOnBibleBookList: () => Playlist[];
}

export const useOnBibleBooksListStore = create<OnBibleBooksListState>((set) => ({
  onBibleBooksList: [],
  getOnBibleBookList: () => {
    const booksList = sermonsAPI.getSermonsTabContent(TabContentName.OnBible)?.playlists ?? [];

    set((state) => ({
      ...state,
      onBibleBooksList: booksList,
    }));

    return booksList;
  },
}));

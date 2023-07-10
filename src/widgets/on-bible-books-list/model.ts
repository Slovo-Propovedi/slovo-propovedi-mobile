import { create } from 'zustand';
import { SermonGroupName, sermonsAPI } from 'shared';
import { BookWithSermons } from 'shared';

interface OnBibleBooksListState {
  onBibleBooksList: BookWithSermons[];
  getOnBibleBookList: () => BookWithSermons[];
}

export const useOnBibleBooksListStore = create<OnBibleBooksListState>((set) => ({
  onBibleBooksList: [],
  getOnBibleBookList: () => {
    const booksList = sermonsAPI.getSermonsTabContent(SermonGroupName.OnBible)?.booksList ?? [];

    set((state) => ({
      ...state,
      onBibleBooksList: booksList,
    }));

    return booksList;
  },
}));

import { create } from 'zustand';
import { sermonsAPI } from 'shared';
import { BookWithSermons } from 'shared';

interface BookWithSermonsState {
  bookWithSermons: BookWithSermons | null;
  getBookWithSermonsByName: (book: string) => BookWithSermons | null;
}

export const useBookWithSermonsStore = create<BookWithSermonsState>((set) => ({
  bookWithSermons: null,
  getBookWithSermonsByName: (book) => {
    const bookWithSermons = sermonsAPI.getBookByName({ book }) ?? null;

    set((state) => ({
      ...state,
      bookWithSermons: bookWithSermons,
    }));

    return bookWithSermons;
  },
}));

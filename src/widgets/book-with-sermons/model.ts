import { create } from 'zustand';
import { sermonsAPI } from 'shared';
import { Playlist } from 'shared';

interface BookWithSermonsState {
  bookWithSermons: Playlist | null;
  getBookWithSermonsByName: (book: string) => Playlist | null;
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

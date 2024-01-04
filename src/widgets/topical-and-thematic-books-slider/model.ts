import { create } from 'zustand';
import type { BookData } from 'shared';
import { API, FetchedBooksGroupName, getBookLinkAsString } from 'shared';

interface TopicalAndThematicBooksState {
  getTopicalAndThematicBooks: () => Promise<BookData[]>;
  topicalAndThematicBooks: BookData[];
}

export const useTopicalAndThematicBooksStore = create<TopicalAndThematicBooksState>((set) => ({
  getTopicalAndThematicBooks: async () => {
    const books = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.TopicalAndThematic);

    const mappedList = books?.map<BookData>((book) => {
      const { description, id, previewUrl, textFileUrl } = book;

      return {
        description,
        id,
        previewUrl,
        textFileUrl,
        title: getBookLinkAsString(book),
      };
    });

    set((state) => ({
      ...state,
      topicalAndThematicBooks: mappedList || [],
    }));

    return mappedList || [];
  },
  topicalAndThematicBooks: [],
}));

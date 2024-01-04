import { create } from 'zustand';
import type { BookData } from 'shared';
import { API, FetchedBooksGroupName, getBookLinkAsString } from 'shared';

interface VerseByVerseBooksSliderState {
  getVerseByVerseBooks: () => Promise<BookData[]>;
  verseByVerseBooks: BookData[];
}

export const useVerseByVerseBooksStore = create<VerseByVerseBooksSliderState>((set) => ({
  getVerseByVerseBooks: async () => {
    const books = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.VerseByVerse);

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
      verseByVerseBooks: mappedList || [],
    }));

    return mappedList || [];
  },
  verseByVerseBooks: [],
}));

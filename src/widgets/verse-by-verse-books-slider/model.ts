import { create } from 'zustand';
import type { BookListData, SermonData } from 'shared';
import { API, FetchedBooksGroupName, getBookLinkAsString } from 'shared';

interface VerseByVerseBooksSliderState {
  getVerseByVerseBooks: () => Promise<BookListData[]>;
  verseByVerseBooks: BookListData[];
}

export const useVerseByVerseBooksStore = create<VerseByVerseBooksSliderState>((set) => ({
  getVerseByVerseBooks: async () => {
    const list = await API.books.getBookListsOnBooksGroup(FetchedBooksGroupName.VerseByVerse);

    const mappedList = list?.map<BookListData>((playlist) => ({
      ...playlist,
      list: playlist.list.map<SermonData>((el) => {
        const { description, id, textFileUrl } = el;

        return {
          description,
          id,
          textFileUrl,
          title: getBookLinkAsString(el),
        };
      }),
    }));

    set((state) => ({
      ...state,
      verseByVerseBooks: mappedList || [],
    }));

    return mappedList || [];
  },
  verseByVerseBooks: [],
}));

import { create } from 'zustand';
import type { BookData } from 'shared';
import { API, FetchedBooksGroupName, getBookLinkAsString } from 'shared';

interface NotesForPreachersBooksState {
  getNotesForPreachersBooks: () => Promise<BookData[]>;
  notesForPreachersBooks: BookData[];
}

export const useNotesForPreachersBooksStore = create<NotesForPreachersBooksState>((set) => ({
  getNotesForPreachersBooks: async () => {
    const books = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.NotesForPreachers);

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
      notesForPreachersBooks: mappedList || [],
    }));

    return mappedList || [];
  },
  notesForPreachersBooks: [],
}));

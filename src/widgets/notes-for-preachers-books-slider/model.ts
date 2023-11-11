import { create } from 'zustand';
import type { BookListData, SermonData } from 'shared';
import { API, FetchedBooksGroupName, getBookLinkAsString } from 'shared';

interface NotesForPreachersBooksState {
  getNotesForPreachersBooks: () => Promise<BookListData[]>;
  notesForPreachersBooks: BookListData[];
}

export const useNotesForPreachersBooksStore = create<NotesForPreachersBooksState>((set) => ({
  getNotesForPreachersBooks: async () => {
    const list = await API.books.getBookListsOnBooksGroup(FetchedBooksGroupName.NotesForPreachers);

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
      notesForPreachersBooks: mappedList || [],
    }));

    return mappedList || [];
  },
  notesForPreachersBooks: [],
}));

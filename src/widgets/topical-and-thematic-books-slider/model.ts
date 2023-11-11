import { create } from 'zustand';
import type { BookListData, SermonData } from 'shared';
import { API, FetchedBooksGroupName, getBookLinkAsString } from 'shared';

interface TopicalAndThematicBooksState {
  getTopicalAndThematicBooks: () => Promise<BookListData[]>;
  topicalAndThematicBooks: BookListData[];
}

export const useTopicalAndThematicBooksStore = create<TopicalAndThematicBooksState>((set) => ({
  getTopicalAndThematicBooks: async () => {
    const list = await API.books.getBookListsOnBooksGroup(FetchedBooksGroupName.TopicalAndThematic);

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
      topicalAndThematicBooks: mappedList || [],
    }));

    return mappedList || [];
  },
  topicalAndThematicBooks: [],
}));

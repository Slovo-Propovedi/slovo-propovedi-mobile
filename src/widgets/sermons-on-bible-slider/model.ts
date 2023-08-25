import { create } from 'zustand';
import { PlaylistData } from 'widgets';
import { SermonData } from 'entities';
import { FetchedSermonsTabName, getBookLinkAsString, sermonsAPI } from 'shared';

interface OnBibleBooksListState {
  onBibleBooksList: PlaylistData[];
  getOnBibleBookList: () => Promise<PlaylistData[]>;
}

export const useOnBibleBooksListStore = create<OnBibleBooksListState>((set) => ({
  onBibleBooksList: [],
  getOnBibleBookList: async () => {
    const response = await sermonsAPI.getSermonsTabContent(FetchedSermonsTabName.OnBible);

    const booksList = response?.playlists ?? [];

    const mappedBookList = booksList.map<PlaylistData>((playlist) => {
      const mappedList = playlist.list.map<SermonData>((el) => ({
        title: getBookLinkAsString({
          title: el.title,
          verse: el.verse,
          chapter: el.chapter,
        }),
        description: el.description,
        fragments: el.fragments.map((fragment) => ({
          audioUrl: fragment.audioUrl,
          description: fragment.description,
          textFileUrl: fragment.textFileUrl,
          title: fragment.title
            ? getBookLinkAsString({
                title: fragment.title,
                verse: fragment.verse,
                chapter: fragment.chapter,
              })
            : undefined,
          youtubeUrl: fragment.youtubeUrl,
        })),
      }));

      return {
        ...playlist,
        list: mappedList,
      };
    });

    set((state) => ({
      ...state,
      onBibleBooksList: mappedBookList,
    }));

    return mappedBookList;
  },
}));

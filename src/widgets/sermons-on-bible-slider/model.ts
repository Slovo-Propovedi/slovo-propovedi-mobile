import { create } from 'zustand';
import { bibleBookLib } from 'entities/bible-book';
import type { PlaylistData, SermonData } from 'shared';
import { FetchedSermonsGroupName, sermonsAPI } from 'shared';

interface OnBibleBooksListState {
  getOnBibleBookList: () => Promise<PlaylistData[]>;
  onBibleBooksList: PlaylistData[];
}

export const useOnBibleBooksListStore = create<OnBibleBooksListState>((set) => ({
  getOnBibleBookList: async () => {
    const list = await sermonsAPI.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.OnBible);

    const mappedList = list?.map<PlaylistData>((playlist) => ({
      ...playlist,
      list: playlist.list.map<SermonData>((el) => {
        const { audioUrl, description, id, textFileUrl, youtubeUrl } = el;

        return {
          audioUrl,
          description,
          id,
          textFileUrl,
          title: bibleBookLib.getBookLinkAsString(el),
          youtubeUrl,
        };
      }),
    }));

    set((state) => ({
      ...state,
      onBibleBooksList: mappedList || [],
    }));

    return mappedList || [];
  },
  onBibleBooksList: [],
}));

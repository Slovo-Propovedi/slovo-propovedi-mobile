import { create } from 'zustand';
import { bibleBookLib } from 'entities/bible-book';
import { PlaylistData } from 'entities/playlist';
import { SermonData } from 'entities/sermon';
import { FetchedSermonsGroupName, sermonsAPI } from 'shared';

interface OnBibleBooksListState {
  onBibleBooksList: PlaylistData[];
  getOnBibleBookList: () => Promise<PlaylistData[]>;
}

export const useOnBibleBooksListStore = create<OnBibleBooksListState>((set) => ({
  onBibleBooksList: [],
  getOnBibleBookList: async () => {
    const list = await sermonsAPI.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.OnBible);

    const mappedList = list?.map<PlaylistData>((playlist) => ({
      ...playlist,
      list: playlist.list.map<SermonData>((el) => {
        const { id, description, audioUrl, textFileUrl, youtubeUrl } = el;

        return {
          id,
          title: bibleBookLib.getBookLinkAsString(el),
          description,
          audioUrl,
          textFileUrl,
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
}));

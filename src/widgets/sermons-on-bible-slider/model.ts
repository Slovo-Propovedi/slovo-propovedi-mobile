import { create } from 'zustand';
import type { PlaylistData, SermonData } from 'shared';
import { API, FetchedSermonsGroupName, getBookLinkAsString } from 'shared';

interface OnBibleBooksListState {
  getOnBibleBookList: () => Promise<PlaylistData[]>;
  onBibleBooksList: PlaylistData[];
}

export const useOnBibleBooksListStore = create<OnBibleBooksListState>((set) => ({
  getOnBibleBookList: async () => {
    const list = await API.sermons.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.OnBible);

    const mappedList = list?.map<PlaylistData>((playlist) => ({
      ...playlist,
      list: playlist.list.map<SermonData>((el) => {
        const { audioUrl, description, id, textFileUrl, youtubeUrl } = el;

        return {
          audioUrl,
          description,
          id,
          textFileUrl,
          title: getBookLinkAsString(el),
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

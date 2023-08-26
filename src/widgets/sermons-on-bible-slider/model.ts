import { create } from 'zustand';
import { PlaylistData } from 'widgets';
import { SermonData } from 'entities';
import { FetchedSermonsGroupName, getBookLinkAsString, sermonsAPI } from 'shared';

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
      list: playlist.list.map<SermonData>((el) => ({
        title: getBookLinkAsString(el),
        description: el.description,
        audioUrl: el.audioUrl,
        textFileUrl: el.textFileUrl,
        youtubeUrl: el.youtubeUrl,
      })),
    }));

    set((state) => ({
      ...state,
      onBibleBooksList: mappedList || [],
    }));

    return mappedList || [];
  },
}));

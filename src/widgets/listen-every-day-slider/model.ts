import { create } from 'zustand';
import { bibleBookLib } from 'entities/bible-book';
import type { PlaylistData, SermonData } from 'shared';
import { FetchedSermonsGroupName, sermonsAPI } from 'shared';

interface TopicalListState {
  getListenEveryDay: () => Promise<PlaylistData[]>;
  listenEveryDay: PlaylistData[];
}

export const useListenEveryDayStore = create<TopicalListState>((set) => ({
  getListenEveryDay: async () => {
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
      listenEveryDay: mappedList || [],
    }));

    return mappedList || [];
  },
  listenEveryDay: [],
}));

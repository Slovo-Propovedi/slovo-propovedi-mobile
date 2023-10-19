import { create } from 'zustand';
import { bibleBookLib } from 'entities/bible-book';
import type { PlaylistData, SermonData } from 'shared';
import { FetchedSermonsGroupName, sermonsAPI } from 'shared';

interface TopicalListState {
  getTopicalList: () => Promise<PlaylistData[]>;
  topicalList: PlaylistData[];
}

export const useTopicalListStore = create<TopicalListState>((set) => ({
  getTopicalList: async () => {
    const list = await sermonsAPI.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.Topical);

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
      topicalList: mappedList || [],
    }));

    return mappedList || [];
  },
  topicalList: [],
}));

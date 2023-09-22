import { create } from 'zustand';
import { PlaylistData } from 'widgets/playlist';
import { bibleBookLib } from 'entities/bible-book';
import { SermonData } from 'entities/sermon';
import { FetchedSermonsGroupName, sermonsAPI } from 'shared';

interface TopicalListState {
  topicalList: PlaylistData[];
  getTopicalList: () => Promise<PlaylistData[]>;
}

export const useTopicalListStore = create<TopicalListState>((set) => ({
  topicalList: [],
  getTopicalList: async () => {
    const list = await sermonsAPI.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.Topical);

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
      topicalList: mappedList || [],
    }));

    return mappedList || [];
  },
}));

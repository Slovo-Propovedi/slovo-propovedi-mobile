import { create } from 'zustand';
import type { PlaylistData, SermonData } from 'shared';
import { API, FetchedSermonsGroupName, getBookLinkAsString } from 'shared';

interface TopicalListState {
  getTopicalList: () => Promise<PlaylistData[]>;
  topicalList: PlaylistData[];
}

export const useTopicalListStore = create<TopicalListState>((set) => ({
  getTopicalList: async () => {
    const list = await API.sermons.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.Topical);

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
      topicalList: mappedList || [],
    }));

    return mappedList || [];
  },
  topicalList: [],
}));

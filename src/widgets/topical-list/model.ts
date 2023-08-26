import { create } from 'zustand';
import { PlaylistData } from 'widgets/playlist';
import { SermonData } from 'entities';
import { FetchedSermonsGroupName, getBookLinkAsString, sermonsAPI } from 'shared';

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
      topicalList: mappedList || [],
    }));

    return mappedList || [];
  },
}));

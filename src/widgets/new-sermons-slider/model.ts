import { create } from 'zustand';
import type { PlaylistData, SermonData } from 'shared';
import { API, FetchedSermonsGroupName, getBookLinkAsString } from 'shared';

interface NewSermonsState {
  getNewSermons: () => Promise<PlaylistData[]>;
  newSermons: PlaylistData[];
}

export const useNewSermonsStore = create<NewSermonsState>((set) => ({
  getNewSermons: async () => {
    const list = await API.sermons.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.New);

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
      newSermons: mappedList || [],
    }));

    return mappedList || [];
  },
  newSermons: [],
}));

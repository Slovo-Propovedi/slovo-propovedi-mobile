import { create } from 'zustand';
import { bibleBookLib } from 'entities/bible-book';
import type { PlaylistData, SermonData } from 'shared';
import { FetchedSermonsGroupName, sermonsAPI } from 'shared';

interface NewSermonsState {
  getNewSermons: () => Promise<PlaylistData[]>;
  newSermons: PlaylistData[];
}

export const useNewSermonsStore = create<NewSermonsState>((set) => ({
  getNewSermons: async () => {
    const list = await sermonsAPI.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.New);

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
      newSermons: mappedList || [],
    }));

    return mappedList || [];
  },
  newSermons: [],
}));

import { create } from 'zustand';
import { bibleBookLib } from 'entities/bible-book';
import { PlaylistData } from 'entities/playlist';
import { SermonData } from 'entities/sermon';
import { FetchedSermonsGroupName, sermonsAPI } from 'shared';

interface NewSermonsState {
  newSermons: PlaylistData[];
  getNewSermons: () => Promise<PlaylistData[]>;
}

export const useNewSermonsStore = create<NewSermonsState>((set) => ({
  newSermons: [],
  getNewSermons: async () => {
    const list = await sermonsAPI.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.New);

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
      newSermons: mappedList || [],
    }));

    return mappedList || [];
  },
}));

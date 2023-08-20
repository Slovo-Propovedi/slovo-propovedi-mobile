import {
  markPlaylist,
  lukePlaylist,
  johnPlaylist,
  actsPlaylist,
  jacobPlaylist,
  firstPetePlaylist,
  secondPetePlaylist,
  firstCorinthiansPlaylist,
  secondCorinthiansPlaylist,
  ephesiansPlaylist,
  philippiansPlaylist,
  firstAndSecondThessaloniansPlaylist,
  titusPlaylist,
  philemonPlaylist,
  revelationPlaylist,
  unionWithChristPlaylist,
  isThereAnUnforgivableSinPlaylist,
} from './playlists';
import { DB, FetchedSermonsTabName } from './types';

export const db: DB = {
  sermons: [
    {
      tabName: FetchedSermonsTabName.OnBible,
      playlists: [
        markPlaylist,
        lukePlaylist,
        johnPlaylist,
        actsPlaylist,
        jacobPlaylist,
        firstPetePlaylist,
        secondPetePlaylist,
        firstCorinthiansPlaylist,
        secondCorinthiansPlaylist,
        ephesiansPlaylist,
        philippiansPlaylist,
        firstAndSecondThessaloniansPlaylist,
        titusPlaylist,
        philemonPlaylist,
        revelationPlaylist,
      ],
    },
    {
      tabName: FetchedSermonsTabName.Topical,
      playlists: [unionWithChristPlaylist, isThereAnUnforgivableSinPlaylist],
    },
  ],
};

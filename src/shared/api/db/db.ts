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
} from './playlists';
import { DB, SermonsTabName } from './types';

export const db: DB = {
  sermons: [
    {
      tabName: SermonsTabName.OnBible,
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
      tabName: SermonsTabName.Topical,
      playlists: [],
    },
  ],
};

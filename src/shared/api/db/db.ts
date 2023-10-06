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
import { DB, FetchedSermonsGroupName } from './types';

export const db: DB = {
  sermons: [
    {
      groupName: FetchedSermonsGroupName.New,
      playlists: [
        unionWithChristPlaylist,
        isThereAnUnforgivableSinPlaylist,
        firstAndSecondThessaloniansPlaylist,
        titusPlaylist,
        philemonPlaylist,
        revelationPlaylist,
      ],
    },
    {
      groupName: FetchedSermonsGroupName.OnBible,
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
      groupName: FetchedSermonsGroupName.Topical,
      playlists: [unionWithChristPlaylist, isThereAnUnforgivableSinPlaylist],
    },
  ],
};

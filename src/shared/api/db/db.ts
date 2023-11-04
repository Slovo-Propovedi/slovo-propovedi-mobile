import type { DB } from 'shared/types';
import { FetchedSermonsGroupName } from 'shared/types';
import {
  actsPlaylist,
  ephesiansPlaylist,
  firstAndSecondThessaloniansPlaylist,
  firstCorinthiansPlaylist,
  firstPetePlaylist,
  isThereAnUnforgivableSinPlaylist,
  jacobPlaylist,
  johnPlaylist,
  lukePlaylist,
  markPlaylist,
  philemonPlaylist,
  philippiansPlaylist,
  revelationPlaylist,
  secondCorinthiansPlaylist,
  secondPetePlaylist,
  stephensSpeechBeforeSanhedrin,
  titusPlaylist,
  unionWithChristPlaylist,
} from './playlists';

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
      playlists: [
        unionWithChristPlaylist,
        isThereAnUnforgivableSinPlaylist,
        stephensSpeechBeforeSanhedrin,
      ],
    },
  ],
};

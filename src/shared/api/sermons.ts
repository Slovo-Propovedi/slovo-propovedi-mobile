import type { FetchedSermonsGroupName } from 'shared/types';
import { localDB } from './localBD';

const getPlaylistsOnSermonsGroup = async (tabName: FetchedSermonsGroupName) => {
  const sermons = localDB.getSermons();
  const content = sermons.find((el) => el.groupName === tabName);

  return content?.playlists ?? null;
};

export const sermonsAPI = {
  getPlaylistsOnSermonsGroup,
};

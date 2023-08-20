import { FetchedSermonsTabName } from './db';
import { localDB } from './localBD';

const getSermonsTabContent = async (tabName: FetchedSermonsTabName) => {
  const sermons = localDB.getSermons();
  const content = sermons.find((el) => el.tabName === tabName);

  return content ?? null;
};

export const sermonsAPI = {
  getSermonsTabContent,
};

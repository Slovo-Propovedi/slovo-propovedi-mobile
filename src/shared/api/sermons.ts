import { Playlist, TabContentName } from './db';
import { localDB } from './localBD';

const getSermonsTabContent = (tabName: TabContentName) => {
  const sermons = localDB.getSermons();
  const content = sermons.find((el) => el.tabName === tabName);

  return content ?? null;
};

const getBookByName = ({ book }: { book: string }): Playlist | null => {
  const sermonsList = getSermonsTabContent(TabContentName.OnBible)?.playlists?.find(
    (el) => el.title === book,
  );

  return sermonsList ?? null;
};

export const sermonsAPI = {
  getSermonsTabContent,
  getBookByName,
};

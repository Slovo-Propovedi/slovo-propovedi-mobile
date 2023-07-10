import { BookWithSermons, SermonGroupName } from './db';
import { localDB } from './localBD';

const getSermons = () => {
  const db = localDB.getDB();

  return db.sermons;
};

const getSermonsTabContent = (tabName: SermonGroupName) => {
  const sermons = getSermons();
  const content = sermons.find((el) => el.groupName === tabName);

  return content ?? null;
};

const getBookByName = ({ book }: { book: string }): BookWithSermons | null => {
  const sermonsList = getSermonsTabContent(SermonGroupName.OnBible)?.booksList?.find(
    (el) => el.title === book,
  );

  return sermonsList ?? null;
};

export const sermonsAPI = {
  getSermons,
  getSermonsTabContent,
  getBookByName,
};

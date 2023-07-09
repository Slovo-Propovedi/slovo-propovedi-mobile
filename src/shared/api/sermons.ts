import { BookWithSermons } from './db';
import { localDB } from './localBD';

const getSermons = () => {
  const db = localDB.getDB();

  return db.sermons;
};

const getBookByName = ({ book }: { book: string }): BookWithSermons | null => {
  const sermons = getSermons();
  const sermonsList = sermons.onBible.find((el) => el.title === book);

  return sermonsList ?? null;
};

export const sermonsAPI = {
  getSermons,
  getBookByName,
};

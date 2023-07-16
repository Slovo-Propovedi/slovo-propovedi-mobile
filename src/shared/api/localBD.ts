import { DB, db } from './db';

const getDB = () => db as DB;

const getSermons = () => {
  const db = getDB();

  return db.sermons;
};

export const localDB = {
  getSermons,
};

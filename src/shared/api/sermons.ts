import { Sermon } from './db';
import { localDB } from './localBD';

const getSermons = async (): Promise<Sermon[]> => {
  const db = localDB.getDB();

  return db.sermons;
};

export const sermonsAPI = {
  getSermons,
};

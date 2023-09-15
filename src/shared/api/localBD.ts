import { db } from './db';

const getSermons = () => db.sermons;

export const localDB = {
  getSermons,
};

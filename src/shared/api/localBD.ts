import { db } from './db';

const getDB = () => db;

export const localDB = {
  getDB,
};

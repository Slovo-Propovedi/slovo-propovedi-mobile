import { db } from './db';

const getSermons = () => db.sermons;
const getBooks = () => db.books;

export const localDB = {
  getBooks,
  getSermons,
};

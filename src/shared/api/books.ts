import type { FetchedBooksGroupName } from 'shared/types';
import { localDB } from './localBD';

const getBookListsOnBooksGroup = async (tabName: FetchedBooksGroupName) => {
  const sermons = localDB.getBooks();
  const content = sermons.find((el) => el.groupName === tabName);

  return content?.bookList ?? null;
};

export const booksAPI = {
  getBookListsOnBooksGroup,
};

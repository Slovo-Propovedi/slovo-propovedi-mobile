import type { FetchedBooksGroupName } from 'shared/types';
import { localDB } from './localBD';

const getBooksOnBooksGroup = async (tabName: FetchedBooksGroupName) => {
  const sermons = localDB.getBooks();
  const content = sermons.find((el) => el.groupName === tabName);

  return content?.books ?? null;
};

export const booksAPI = {
  getBooksOnBooksGroup,
};

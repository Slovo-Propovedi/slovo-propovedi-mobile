// eslint-disable-next-line import/no-internal-modules
import { booksDB } from 'shared/api/db/books';
import { BibleBookName, type FetchedBookList } from 'shared/types';

export const markBookList: FetchedBookList = {
  description: 'Эта книга - Евангелие от Марка',
  list: booksDB[BibleBookName.Mark],
  previewUrl: 'https://slovo-istini.com/image/categories/22/marka_(1).jpg',
  title: 'Евангелие от Марка',
};

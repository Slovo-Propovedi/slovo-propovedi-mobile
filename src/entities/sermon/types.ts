import { BibleBookName } from 'entities/bible-book';

export interface SermonDataLink {
  bookName?: BibleBookName;

  chapter?: number;

  verse?: number | [from: number, to: number];
}

export interface SermonDataFragment extends SermonDataLink {
  title?: string;

  description?: string;

  youtubeUrl?: string;

  audioUrl?: string;

  textFileUrl?: string;
}

export interface SermonData extends SermonDataLink {
  title: string;

  description?: string;

  fragments: SermonDataFragment[];
}

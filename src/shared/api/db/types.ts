export interface DB {
  sermons: Sermons;
}

export interface Sermons {
  onBible: BookWithSermons[];
  topical: unknown[];
}

export interface BookWithSermons {
  title: string;
  description: string;
  list: GroupListItem[];
}

export interface GroupListItem {
  title: string;
  list: Sermon[];
}

export type Sermon = { id: number; title: string; youtube: string };

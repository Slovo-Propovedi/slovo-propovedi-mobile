export type SermonData = { id: number; title: string; youtube: string };

export interface GroupListItem {
  title: string;
  list: SermonData[];
}

export interface BookWithSermons {
  title: string;
  description: string;
  list: GroupListItem[];
}

export enum SermonGroupName {
  OnBible = 'onBible',
  Topical = 'topical',
}

export type SermonItem =
  | {
      groupName: SermonGroupName.OnBible;
      topicalList: unknown[];
    }
  | {
      groupName: SermonGroupName.Topical;
      booksList: BookWithSermons[];
    };

export interface DB {
  sermons: SermonItem[];
}

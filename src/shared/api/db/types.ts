export type SermonData = { id: number; title: string; youtube: string };

export interface GroupListItem {
  title: string;
  list: SermonData[];
}

export interface Playlist {
  title: string;
  description?: string;
  list: GroupListItem[];
}

export enum TabContentName {
  OnBible = 'onBible',
  Topical = 'topical',
}

export type TabContent = {
  tabName: TabContentName;
  playlists: Playlist[];
};

export interface DB {
  sermons: TabContent[];
}

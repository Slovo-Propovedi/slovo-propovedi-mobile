export type SermonData = {
  title: string;
  description?: string;
  youtubeUrl?: string;
  audioUrl?: string;
  textFileUrl?: string;
};

export interface GroupListItem {
  title: string;
  list: SermonData[];
}

export interface Playlist {
  title: string;
  list: GroupListItem[];
  description?: string;
  previewUrl?: string;
}

export enum SermonsTabName {
  OnBible = 'onBible',
  Topical = 'topical',
}

export type SermonsTab = {
  tabName: SermonsTabName;
  playlists: Playlist[];
};

export interface DB {
  sermons: SermonsTab[];
}

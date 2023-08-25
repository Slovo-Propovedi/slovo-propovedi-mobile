export interface SermonDataFragment {
  title?: string;

  description?: string;

  youtubeUrl?: string;

  audioUrl?: string;

  textFileUrl?: string;
}

export interface SermonData {
  title: string;

  description?: string;

  fragments: SermonDataFragment[];
}

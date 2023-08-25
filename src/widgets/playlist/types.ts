import { SermonData } from 'entities';

export interface PlaylistData {
  title: string;
  list: SermonData[];
  description?: string;
  previewUrl?: string;
}

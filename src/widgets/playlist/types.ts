import { SermonData } from 'entities/sermon';

export interface PlaylistData {
  title: string;
  list: SermonData[];
  description?: string;
  previewUrl?: string;
}

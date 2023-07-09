export type Sermon = { id: number; title: string; url: string };

export interface DB {
  sermons: Sermon[];
}

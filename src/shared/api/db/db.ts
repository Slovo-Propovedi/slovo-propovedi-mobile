export type SermonData = { id: number; title: string; youtube: string };

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

export const db: DB = {
  sermons: [
    {
      tabName: SermonsTabName.OnBible,
      playlists: [
        {
          title: 'Матфея',
          description: 'sfdfsddf',
          list: [
            {
              title: 'Глава 1',
              list: [
                {
                  id: 1,
                  title: 'Проповедь 1',
                  youtube: 'http: //placeholder.com',
                },
                {
                  id: 2,
                  title: 'Проповедь 2',
                  youtube: 'http: //placeholder.com',
                },
              ],
            },
            {
              title: 'Глава 2',
              list: [
                {
                  id: 1,
                  title: 'Проповедь 1',
                  youtube: 'http: //placeholder.com',
                },
                {
                  id: 2,
                  title: 'Проповедь 2',
                  youtube: 'http: //placeholder.com',
                },
              ],
            },
            {
              title: 'Глава 3',
              list: [
                {
                  id: 1,
                  title: 'Проповедь 1',
                  youtube: 'http: //placeholder.com',
                },
                {
                  id: 2,
                  title: 'Проповедь 2',
                  youtube: 'http: //placeholder.com',
                },
              ],
            },
          ],
        },
        {
          title: 'Луки',
          description: '',
          list: [
            {
              title: 'Глава 1',
              list: [
                {
                  id: 1,
                  title: 'Проповедь 1',
                  youtube: 'http: //placeholder.com',
                },
                {
                  id: 2,
                  title: 'Проповедь 2',
                  youtube: 'http: //placeholder.com',
                },
              ],
            },
            {
              title: 'Глава 2',
              list: [
                {
                  id: 1,
                  title: 'Проповедь 1',
                  youtube: 'http: //placeholder.com',
                },
                {
                  id: 2,
                  title: 'Проповедь 2',
                  youtube: 'http: //placeholder.com',
                },
              ],
            },
            {
              title: 'Глава 3',
              list: [
                {
                  id: 1,
                  title: 'Проповедь 1',
                  youtube: 'http: //placeholder.com',
                },
                {
                  id: 2,
                  title: 'Проповедь 2',
                  youtube: 'http: //placeholder.com',
                },
              ],
            },
          ],
        },
        {
          title: 'Иоанна',
          description: '',
          list: [
            {
              title: 'Глава 1',
              list: [
                {
                  id: 1,
                  title: 'Проповедь 1',
                  youtube: 'http: //placeholder.com',
                },
                {
                  id: 2,
                  title: 'Проповедь 2',
                  youtube: 'http: //placeholder.com',
                },
              ],
            },
            {
              title: 'Глава 2',
              list: [
                {
                  id: 1,
                  title: 'Проповедь 1',
                  youtube: 'http: //placeholder.com',
                },
                {
                  id: 2,
                  title: 'Проповедь 2',
                  youtube: 'http: //placeholder.com',
                },
              ],
            },
            {
              title: 'Глава 3',
              list: [
                {
                  id: 1,
                  title: 'Проповедь 1',
                  youtube: 'http: //placeholder.com',
                },
                {
                  id: 2,
                  title: 'Проповедь 2',
                  youtube: 'http: //placeholder.com',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      tabName: SermonsTabName.Topical,
      playlists: [],
    },
  ],
};

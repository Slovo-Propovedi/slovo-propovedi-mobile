import { Playlist, DB, SermonsTabName } from './types';

const markPlaylist: Playlist = {
  title: 'Евангелие от Марка',
  description: 'Эта книга - Евангелие от Марка',
  previewUrl: 'https://slovo-istini.com/image/categories/22/marka_(1).jpg',
  list: [
    {
      title: 'Глава 1',
      list: [
        {
          title: '1. Свидетельства о пришествии Мессии (Часть 1). Марка 1:1-3',
        },
        {
          title: '2. Свидетельства о пришествии Мессии (Часть 2). Марка 1:4-8',
        },
        {
          title: '3. Подготовка к великому служению. Марка 1:9-15',
        },
        {
          title: '4. Призыв к благовестию. Марка 1:16-20',
        },
        {
          title: '5. Противостояние темным силам. Марка 1:21-28',
        },
        {
          title: '6. Власть над болезнями. Марка 1:29-31',
        },
        {
          title: '7. Как поступать при возрастающей популярности служения. Марка 1:32-39',
        },
        {
          title: '8. Особое милосердие Господа. Марка 1:40-45',
        },
      ],
    },
    {
      title: 'Глава 2',
      list: [
        {
          title: '9. Власть прощать грехи. Марка 2:1-12',
        },
        {
          title: '10. Отношение к грешникам. Марка 2:13-17',
        },
        {
          title: '11. Евангелие благодати и законнические традиции. Марка 2:18-22',
        },
        {
          title: '12. Законничество и Писание. Марка 2:23-28',
        },
      ],
    },
    {
      title: 'Глава 3',
      list: [
        {
          title: '13. Греховность законнической религии. Марка 3:1-6',
        },
        {
          title: '14. Важные принципы служения. Марка 3:7-12',
        },
        {
          title: '15. Условия формирования христианского лидера (Часть 1). Марка 3:13-16',
        },
        {
          title: '16. Условия формирования христианского лидера (Часть 2). Марка 3:17-19',
        },
        {
          title: '17. Дискредитирующие обвинения (Часть 1). Марка 3:20-21',
        },
        {
          title: '18. Дискредитирующие обвинения (Часть 2). Марка 3:22-30',
        },
        {
          title: '19. Дискредитирующие обвинения (Часть 3). Марка 3:31-35',
        },
      ],
    },
    {
      title: 'Глава 4',
      list: [
        {
          title: '13. Основания перспективности проповеди Слова. Марка 4:1-8',
        },
        {
          title: '14. Условия ясного понимания Слова Божьего. Марка 4:9-13',
        },
        {
          title: '15. Четыре вида реакции на проповедь Слова. Марка 4:14-20',
        },
        {
          title: '16. Ответственность обладающего Словом. Марка 4:21-25',
        },
        {
          title: '17. Усилия и плоды проповедника Слова. Марка 4:26-29',
        },
        {
          title: '18. Масштабы влияния Слова. Марка 4:30-32',
        },
        {
          title: '19. Мудрый подход к провозглашению Слова. Марка 4:33-34',
        },
        {
          title: '20. В испытаниях со Христом. Марка 4:35-41',
        },
      ],
    },
  ],
};

const lukePlaylist: Playlist = {
  title: 'Евангелие от Луки',
  previewUrl:
    'https://slovo-istini.com/image/categories/78/whatsapp_image_2022-02-15_at_11.20.06.jpeg',
  list: [],
};

const johnPlaylist: Playlist = {
  title: 'Евангелие от Иоанна',
  previewUrl: 'https://slovo-istini.com/image/categories/21/ioanna_(1).jpg',
  list: [],
};
const actsPlaylist: Playlist = {
  title: 'Деяния Апостолов',
  previewUrl:
    'https://slovo-istini.com/image/categories/19/whatsapp_image_2022-11-11_at_17.09.37_(2).jpeg',
  list: [],
};
const jacobPlaylist: Playlist = {
  title: 'Послание Иакова',
  previewUrl:
    'https://slovo-istini.com/image/categories/23/whatsapp_image_2022-11-11_at_17.11.51.jpeg',
  list: [],
};
const firstPetePlaylist: Playlist = {
  title: 'Первое послание Петра',
  previewUrl:
    'https://slovo-istini.com/image/categories/13/whatsapp_image_2022-11-11_at_17.11.51_(2).jpeg',
  list: [],
};
const secondPetePlaylist: Playlist = {
  title: 'Второе послание Петра',
  previewUrl:
    'https://slovo-istini.com/image/categories/12/whatsapp_image_2022-11-11_at_17.11.51_(1).jpeg',
  list: [],
};
const firstCorinthiansPlaylist: Playlist = {
  title: 'Первое послание к коринфянам',
  previewUrl: 'https://slovo-istini.com/image/categories/65/1_korin_(1).jpg',
  list: [],
};
const secondCorinthiansPlaylist: Playlist = {
  title: 'Второе послание к коринфянам',
  previewUrl: 'https://slovo-istini.com/image/categories/67/2_korinfyanam.jpg',
  list: [],
};
const ephesiansPlaylist: Playlist = {
  title: 'Послание к ефесянам',
  previewUrl:
    'https://slovo-istini.com/image/categories/20/whatsapp_image_2022-11-11_at_17.09.38.jpeg',
  list: [],
};
const philippiansPlaylist: Playlist = {
  title: 'Послание к филиппийцам',
  previewUrl:
    'https://slovo-istini.com/image/categories/14/whatsapp_image_2022-11-11_at_17.09.37.jpeg',
  list: [],
};
const firstAndSecondThessaloniansPlaylist: Playlist = {
  title: 'Первое и второе послание к фессалоникийцам',
  previewUrl:
    'https://slovo-istini.com/image/categories/17/whatsapp_image_2022-11-11_at_17.11.52.jpeg',
  list: [],
};
const titusPlaylist: Playlist = {
  title: 'Послание к Титу',
  previewUrl:
    'https://slovo-istini.com/image/categories/15/whatsapp_image_2022-11-02_at_21.01.38.jpeg',
  list: [],
};
const philemonPlaylist: Playlist = {
  title: 'Послание к Филимону',
  previewUrl: 'https://slovo-istini.com/image/categories/68/filimonu.png',
  list: [],
};
const revelationPlaylist: Playlist = {
  title: 'Откровение',
  previewUrl: 'https://slovo-istini.com/image/categories/66/otkrovenie_.jpg',
  list: [],
};

export const db: DB = {
  sermons: [
    {
      tabName: SermonsTabName.OnBible,
      playlists: [
        markPlaylist,
        lukePlaylist,
        johnPlaylist,
        actsPlaylist,
        jacobPlaylist,
        firstPetePlaylist,
        secondPetePlaylist,
        firstCorinthiansPlaylist,
        secondCorinthiansPlaylist,
        ephesiansPlaylist,
        philippiansPlaylist,
        firstAndSecondThessaloniansPlaylist,
        titusPlaylist,
        philemonPlaylist,
        revelationPlaylist,
      ],
    },
    {
      tabName: SermonsTabName.Topical,
      playlists: [],
    },
  ],
};

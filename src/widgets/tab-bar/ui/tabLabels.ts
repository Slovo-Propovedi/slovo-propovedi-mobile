// Route name → подпись таба. Покрывает и основные табы (listen/read/study/more),
// и админские (index/sections/playlists/sermons/upload/media/users), поэтому
// CustomTabBar остаётся общим для обоих наборов маршрутов.
const TAB_LABELS: Record<string, string> = {
  index: 'Главная',
  listen: 'Слушать',
  media: 'Медиа',
  more: 'Ещё',
  playlists: 'Плейлисты',
  read: 'Читать',
  sections: 'Разделы',
  sermons: 'Проповеди',
  study: 'Учиться',
  upload: 'Загрузить',
  users: 'Пользователи',
}

export const getTabLabel = (routeName: string) => TAB_LABELS[routeName] ?? routeName

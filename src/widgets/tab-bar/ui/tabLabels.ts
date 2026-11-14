// Route name → подпись таба. Покрывает и основные табы (listen/read/more),
// и админские (index/sections/playlists/sermons), поэтому CustomTabBar остаётся
// общим для обоих наборов маршрутов.
const TAB_LABELS: Record<string, string> = {
  index: 'Главная',
  listen: 'Слушать',
  more: 'Ещё',
  playlists: 'Плейлисты',
  read: 'Читать',
  sections: 'Разделы',
  sermons: 'Проповеди',
}

export const getTabLabel = (routeName: string) => TAB_LABELS[routeName] ?? routeName

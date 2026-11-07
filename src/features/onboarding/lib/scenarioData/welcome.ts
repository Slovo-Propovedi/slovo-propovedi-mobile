import { type OnboardingScenario } from '../scenarios'
import { SECTION_TITLES_TOKEN } from '../sectionTitlesPhrase'

export const welcomeScenario: OnboardingScenario = {
  description: 'Короткая экскурсия по приложению',
  icon: 'sparkles-outline',
  id: 'welcome',
  sinceVersion: '0.27.0',
  steps: [
    {
      route: '/listen',
      text: 'Проведём короткую экскурсию по приложению — это займёт минуту.',
      title: 'Добро пожаловать!',
    },
    {
      targetId: 'app.help-button',
      text: 'Кнопка «?» на любом экране открывает такие обзоры — выбирайте сценарий и смотрите подсказки.',
      title: 'Обзоры в приложении',
    },
    {
      targetId: 'listen.sections',
      text: `Горизонтальные подборки: ${SECTION_TITLES_TOKEN}. Листайте вбок.`,
      title: 'Разделы проповедей',
    },
    {
      targetId: 'listen.search-toggle',
      text: 'Нажмите на кружок с лупой в нижней панели, чтобы найти проповедь по названию, проповеднику или разделу.',
      title: 'Поиск',
    },
    {
      targetId: 'listen.my-playlists',
      text: 'Ваши подборки проповедей. Добавляйте новые через меню любой проповеди.',
      title: 'Мои плейлисты',
    },
    {
      route: '/more',
      tapTargetId: 'tab.more',
      targetId: 'more.menu',
      text: 'Здесь история прослушивания, офлайн-режим и настройки.',
      title: 'Вкладка «Ещё»',
    },
    {
      route: '/settings',
      tapTargetId: 'more.settings-item',
      targetId: 'settings.theme',
      text: 'Светлая и тёмная темы, а на Android 12+ — динамические цвета Material You.',
      title: 'Оформление',
    },
    {
      route: '/settings',
      targetId: 'settings.tours',
      text: 'Подсказки и автопоказ обзоров можно полностью отключить в настройках.',
      title: 'Всё под контролем',
    },
  ],
  title: 'Добро пожаловать',
}

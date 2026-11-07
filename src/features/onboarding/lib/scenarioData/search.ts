import { type OnboardingScenario } from '../scenarios'

export const searchScenario: OnboardingScenario = {
  description: 'Группы и плейлисты',
  globalFallback: true,
  icon: 'search-outline',
  id: 'search',
  screens: ['/listen'],
  steps: [
    {
      text: 'Сейчас перейдём на экран «Слушать» — тапнем по нему — и откроем поиск. Нажмите «Далее».',
      title: 'Результаты поиска',
    },
    {
      // The «Слушать» tab is an entry transition (blink + navigation), not a card.
      // It navigates itself (auto-skipped when already on «Слушать»), so no separate
      // pure-navigation return is needed: a return entry would reach the route first
      // and the tab entry would then be skipped without ever blinking.
      route: '/listen',
      tapTargetId: 'tab.listen',
      text: 'Переходим на экран «Слушать»…',
      title: 'Экран «Слушать»',
    },
    {
      text: 'Чтобы открыть поиск, тапните по кружку с лупой справа от панели вкладок.',
      title: 'Кнопка поиска',
    },
    {
      // Opens the search overlay, so the query step below can type into it.
      tapActionId: 'open-listen-search',
      tapTargetId: 'listen.search-toggle',
      text: 'Открываем поиск…',
      title: 'Открываем поиск',
    },
    {
      // A pass-through card floating over the live search UI while the demo query types
      // into the visible field: the typing runs on enter, in parallel with the card, and
      // the user presses «Далее» to reach the grouped-results card (no auto-advance).
      actionOnEnterId: 'type-search-query',
      interactive: true,
      text: 'Вводим запрос, например «лицемерие»…',
      title: 'Вводим запрос',
    },
    {
      targetId: 'search-results.group-sermons',
      text: 'Найденное сгруппировано: проповеди, плейлисты и проповедники. Нажмите на заголовок группы с количеством — откроется полный список по ней.',
      title: 'Группы результатов',
    },
    {
      text: 'Чтобы включить проповедь — тапните по ней.',
      title: 'Включить проповедь',
    },
    {
      tapActionId: 'press-first-sermon',
      tapTargetId: 'search-results.first-sermon',
      text: 'Выбираем проповедь, которая входит в несколько плейлистов…',
      title: 'Выбираем проповедь',
    },
    {
      // The picker window is the highlighted zone: the spotlight dims everything
      // except it, the fill marks it, and the card stays at the bottom.
      areaTargetIds: ['search.picker-modal'],
      cardPosition: 'bottom',
      presentOnTop: true,
      text: 'Если проповедь находится сразу в нескольких плейлистах — можно выбрать плейлист, в котором открыть.',
      title: 'Выберите плейлист',
    },
    {
      // Closes the picker on enter (the live UI is prepared), then spotlights the
      // sermon row's ⋯ menu button.
      actionOnEnterId: 'close-sermon-playlist-picker',
      targetId: 'search-results.first-sermon-menu',
      text: 'Через меню строки (⋯ или долгое нажатие) добавьте проповедь в плейлист или управляйте историей.',
      title: 'Меню проповеди',
    },
  ],
  title: 'Результаты поиска',
}

import { type OnboardingScenario } from '../scenarios'

export const searchScenario: OnboardingScenario = {
  description: 'Поиск, недавние запросы и группы результатов',
  globalFallback: true,
  icon: 'search-outline',
  id: 'search',
  screens: ['/search'],
  steps: [
    {
      text: 'Поиск открывается отдельной страницей: недавние запросы хранятся на устройстве, а результаты разложены по вкладкам. Сейчас откроем поиск пилюлей с лупой в нижней панели. Нажмите «Далее».',
      title: 'Новый поиск',
    },
    {
      // The search pill is an entry transition (blink + navigation), not a card.
      // It navigates itself (auto-skipped when already on «Поиск»), so no separate
      // pure-navigation return is needed: a return entry would reach the route first
      // and the pill entry would then be skipped without ever blinking.
      route: '/search',
      tapTargetId: 'listen.search-toggle',
      text: 'Открываем страницу «Поиск»…',
      title: 'Страница «Поиск»',
    },
    {
      // A pass-through card floating over the live search UI while the demo query types
      // into the visible field: the typing runs on enter, in parallel with the card, and
      // the user presses «Далее» to reach the results card (no auto-advance).
      actionOnEnterId: 'type-search-query',
      interactive: true,
      text: 'Вводим запрос, например «лицемерие»…',
      title: 'Вводим запрос',
    },
    {
      // Same target id as the old compact results: it wraps the «Проповеди» group
      // pill, which switches the full paginated list below.
      targetId: 'search-results.group-sermons',
      text: 'Результаты разложены по вкладкам «Проповеди», «Плейлисты» и «Проповедники»: переключите вкладку — под ней полный список с бесконечной прокруткой.',
      title: 'Вкладки результатов',
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
    {
      // No target: the recents section has no onboarding target, so the closing card
      // is a centred text card over the search page.
      text: 'Проповедь, которую вы включили, теперь в «Недавних поисках» на странице поиска: тап — включить снова, «⋯» — убрать из истории, «Очистить» — очистить всё. При уходе со страницы поиска запрос сбрасывается.',
      title: 'Недавние поиски',
    },
  ],
  title: 'Результаты поиска',
}

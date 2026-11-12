import { type OnboardingScenario } from '../scenarios'

const LISTEN_ROUTE = '/listen'
const LISTEN_TAB_TARGET_ID = 'tab.listen'
const MINI_PLAYER_TARGET_ID = 'player.mini'
const SEARCH_TOGGLE_TARGET_ID = 'listen.search-toggle'

// The steps themselves are the content version of «Что нового»: the auto-show gate
// compares their fingerprint, and a release without user-visible novelties ships none.
// Every routed card lives on the listen screen (the floating bar is visible there),
// so a start from another screen simply navigates into the first routed card.
export const whatsNewScenario: OnboardingScenario = {
  description: 'Новинки этого релиза',
  icon: 'gift-outline',
  id: 'whatsNew',
  steps: [
    {
      text: 'Нижняя панель стала плавающей: вкладки, мини-плеер и поиск живут отдельными островками и больше не занимают место в макете экрана.',
      title: 'Плавающая нижняя панель',
    },
    {
      // The pill registers its target only while a track is loaded; without one the
      // card degrades to a centred text card instead of being dropped.
      route: LISTEN_ROUTE,
      targetId: MINI_PLAYER_TARGET_ID,
      text: 'Когда проповедь включена, мини-плеер висит над панелью вкладок отдельным островком и остаётся на любом экране. Тап по нему открывает полный плеер.',
      title: 'Островки плеера и вкладок',
    },
    {
      // Collapsing is a scroll behaviour with no element to spotlight. No own route:
      // a route without a target would turn the step into an entry transition, so the
      // card inherits «/listen» from the previous step instead.
      text: 'Прокрутите любой список вниз — панель свернётся в одну строку: кружок активного раздела, мини-плеер и поиск.',
      title: 'Сворачивается при прокрутке',
    },
    {
      route: LISTEN_ROUTE,
      targetId: LISTEN_TAB_TARGET_ID,
      text: 'Коснитесь кружка активного раздела — панель развернётся снова. Текущий экран при этом не меняется.',
      title: 'Развернуть обратно',
    },
    {
      route: LISTEN_ROUTE,
      targetId: SEARCH_TOGGLE_TARGET_ID,
      text: 'Поиск теперь открывается кружком с лупой справа от панели — поле ввода выезжает снизу. Прежняя лупа в шапке больше не нужна.',
      title: 'Поиск в нижней панели',
    },
  ],
  title: 'Что нового',
}

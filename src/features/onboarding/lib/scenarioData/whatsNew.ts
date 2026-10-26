import { type OnboardingScenario } from '../scenarios'

// Content version of «Что нового»: the app release that ships the current steps.
// Bump it (to the upcoming release version) every time the steps are replaced with
// new features — the tour then auto-plays once more for everyone who saw an older one.
export const WHATS_NEW_VERSION = '0.27.0'

export const whatsNewScenario: OnboardingScenario = {
  description: 'Новинки этого релиза',
  icon: 'gift-outline',
  id: 'whatsNew',
  sinceVersion: WHATS_NEW_VERSION,
  steps: [
    {
      targetId: 'app.help-button',
      text: 'Кнопка «?» в шапке каждого экрана открывает сценарии обзора — подсказки появляются прямо на интерфейсе.',
      title: 'Обзоры в приложении',
    },
    {
      // The «Ещё» tab is an entry transition (blink + navigation), same as in the
      // «Поделиться» tour: it blinks on the current screen and lands on «Ещё».
      route: '/more',
      tapTargetId: 'tab.more',
    },
    {
      // Second hop: blink the «Настройки» row on «Ещё» and open settings. The next
      // card renders only after the route is reached.
      route: '/settings',
      tapTargetId: 'more.settings-item',
    },
    {
      route: '/settings',
      targetId: 'settings.tours',
      text: 'Обзоры можно полностью отключить одним переключателем.',
      title: 'Управление в настройках',
    },
  ],
  title: 'Что нового',
}

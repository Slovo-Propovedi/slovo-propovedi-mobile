import { type OnboardingScenario } from '../scenarios'

// Content version of «Что нового»: the app release that ships the current steps.
// Bump it (to the upcoming release version) every time the steps are replaced with
// new features — the tour then auto-plays once more for everyone who saw an older one.
export const WHATS_NEW_VERSION = '0.32.0'

export const whatsNewScenario: OnboardingScenario = {
  description: 'Новинки этого релиза',
  icon: 'gift-outline',
  id: 'whatsNew',
  sinceVersion: WHATS_NEW_VERSION,
  steps: [
    {
      text: 'Плеер стал компактнее: ряд навигации (назад/плей/вперёд) и второй ряд — повтор трека, плейлист и меню.',
      title: 'Новые ряды плеера',
    },
    {
      targetId: 'app.help-button',
      text: 'Подробный обзор возможностей плеера — в сценарии «Экран плеера».',
      title: 'Сценарии плеера',
    },
  ],
  title: 'Что нового',
}

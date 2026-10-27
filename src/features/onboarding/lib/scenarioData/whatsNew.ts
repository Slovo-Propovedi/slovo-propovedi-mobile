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
      text: 'Главная сразу после открытия подтягивает свежие проповеди с сервера, а пока их нет — показывает сохранённые.',
      title: 'Всегда свежие данные',
    },
    {
      // Desktop web only: on touch devices the button (and its target) is not
      // rendered, so the step is skipped.
      route: '/listen',
      skipIfMissing: true,
      targetId: 'listen.refresh-button',
      text: 'На компьютере обновить страницу можно этой кнопкой — так же, как свайпом вниз на телефоне.',
      title: 'Кнопка «Обновить»',
    },
  ],
  title: 'Что нового',
}

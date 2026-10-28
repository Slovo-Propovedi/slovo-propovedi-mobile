import { type OnboardingScenario } from '../scenarios'

// Content version of «Что нового»: the app release that ships the current steps.
// Bump it (to the upcoming release version) every time the steps are replaced with
// new features — the tour then auto-plays once more for everyone who saw an older one.
export const WHATS_NEW_VERSION = '0.32.1'

export const whatsNewScenario: OnboardingScenario = {
  description: 'Новинки этого релиза',
  icon: 'gift-outline',
  id: 'whatsNew',
  sinceVersion: WHATS_NEW_VERSION,
  steps: [
    {
      text: 'Тап по офлайн-проповеди или записи истории теперь спрашивает, где её слушать: включить весь список подряд или плейлист, в котором она есть; если вариантов нет, воспроизведение продолжается сразу. А в меню экрана офлайна появилась команда «Воспроизвести все».',
      title: 'Где включить офлайн-проповедь',
    },
    {
      route: '/offline',
      targetId: 'offline.rows',
      text: 'Нажмите на любую загруженную проповедь — откроется выбор «Все офлайн-проповеди» или её плейлист, и очередь воспроизведения не собьётся.',
      title: 'Выбор перед воспроизведением',
    },
  ],
  title: 'Что нового',
}

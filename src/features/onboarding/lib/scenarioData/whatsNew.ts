import { APP_VERSION } from 'shared/config'
import { type OnboardingScenario } from '../scenarios'

// The running bundle's version is the content version of «Что нового»: every release
// replaces these steps, and a release without user-visible novelties ships none.
export const whatsNewScenario: OnboardingScenario = {
  description: 'Новинки этого релиза',
  icon: 'gift-outline',
  id: 'whatsNew',
  sinceVersion: APP_VERSION,
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

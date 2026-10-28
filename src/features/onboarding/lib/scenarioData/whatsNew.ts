import { type OnboardingScenario } from '../scenarios'

// The steps themselves are the content version of «Что нового»: the auto-show gate
// compares their fingerprint, and a release without user-visible novelties ships none.
export const whatsNewScenario: OnboardingScenario = {
  description: 'Новинки этого релиза',
  icon: 'gift-outline',
  id: 'whatsNew',
  steps: [
    {
      text: 'Тап по проповеди теперь спрашивает, где её слушать, офлайн-коллекцию можно включить одной командой, а прогресс прослушивания сохраняется, даже если проповедь закончилась в фоне.',
      title: 'Что нового',
    },
    {
      route: '/offline',
      targetId: 'offline.rows',
      text: 'Нажмите на загруженную проповедь — приложение предложит включить все офлайн-проповеди подряд или плейлист, в котором она есть. Без плейлистов включится всё офлайн сразу. Команда «Воспроизвести все» — в меню экрана.',
      title: 'Выбор в офлайне',
    },
    {
      route: '/history',
      targetId: 'history.rows',
      text: 'Нажмите на запись — приложение предложит плейлисты, в которых есть эта проповедь. Плейлист, в котором она прослушивалась, отмечен подписью «Плейлист, в котором было прослушано».',
      title: 'Продолжить из истории',
    },
  ],
  title: 'Что нового',
}

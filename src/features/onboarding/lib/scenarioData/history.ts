import { type OnboardingScenario } from '../scenarios'

export const historyScenario: OnboardingScenario = {
  description: 'Что вы слушали и когда',
  icon: 'time-outline',
  id: 'history',
  screens: ['/more', '/history'],
  steps: [
    {
      text: 'Сейчас перейдём на экран «Ещё» — тапнем по нему — и откроем историю прослушивания. Нажмите «Далее».',
      title: 'История прослушивания',
    },
    {
      route: '/more',
      tapTargetId: 'tab.more',
      targetId: 'more.history-item',
      text: 'Открываем историю прослушивания.',
      title: 'История прослушивания',
    },
    {
      route: '/history',
      tapTargetId: 'more.history-item',
      targetId: 'history.rows',
      text: 'Нажмите на запись: если плейлистов с этой проповедью несколько, приложение предложит выбор, а если плейлист один — сразу начнёт воспроизведение. Если подходящих нет, воспроизведение продолжится из плейлиста записи. Через меню записи проповедь можно добавить в плейлист.',
      title: 'Записи',
    },
    {
      targetId: 'history.header-menu',
      text: 'Очистка истории — в меню шапки экрана.',
      title: 'Меню экрана',
    },
  ],
  title: 'История прослушивания',
}

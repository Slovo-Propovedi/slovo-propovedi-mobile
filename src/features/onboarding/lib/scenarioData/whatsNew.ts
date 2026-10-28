import { type OnboardingScenario } from '../scenarios'

const MORE_TAB_TARGET_ID = 'tab.more'
const OFFLINE_ITEM_TARGET_ID = 'more.offline-item'
const HISTORY_ITEM_TARGET_ID = 'more.history-item'

// The steps themselves are the content version of «Что нового»: the auto-show gate
// compares their fingerprint, and a release without user-visible novelties ships none.
// Screen changes are entry transitions (blink + navigation) attached to the next card,
// so they never count as steps — the deck stays three cards.
export const whatsNewScenario: OnboardingScenario = {
  description: 'Новинки этого релиза',
  icon: 'gift-outline',
  id: 'whatsNew',
  steps: [
    {
      text: 'Тап по проповеди теперь спрашивает, где её слушать, офлайн-коллекцию можно включить одной командой, а прогресс прослушивания сохраняется, даже если проповедь закончилась в фоне.',
      title: 'Что нового',
    },
    // Lead-up into the offline screen: the «Ещё» tab, then the «Офлайн» item.
    { route: '/more', tapTargetId: MORE_TAB_TARGET_ID },
    { route: '/offline', tapTargetId: OFFLINE_ITEM_TARGET_ID },
    {
      route: '/offline',
      targetId: 'offline.rows',
      text: 'Нажмите на загруженную проповедь — приложение предложит включить все офлайн-проповеди подряд или плейлист, в котором она есть. Без плейлистов включится всё офлайн сразу. Команда «Воспроизвести все» — в меню экрана.',
      title: 'Выбор в офлайне',
    },
    // Leaving the nested offline screen: back to the «Ещё» tab, then the history item.
    { route: '/more', tapTargetId: MORE_TAB_TARGET_ID },
    { route: '/history', tapTargetId: HISTORY_ITEM_TARGET_ID },
    {
      route: '/history',
      targetId: 'history.rows',
      text: 'Нажмите на запись — приложение предложит плейлисты, в которых есть эта проповедь. Плейлист, в котором она прослушивалась, отмечен подписью «Плейлист, в котором было прослушано».',
      title: 'Продолжить из истории',
    },
  ],
  title: 'Что нового',
}

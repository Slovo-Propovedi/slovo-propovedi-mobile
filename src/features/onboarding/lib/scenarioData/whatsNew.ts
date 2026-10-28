import { type OnboardingScenario } from '../scenarios'

const LISTEN_TAB_TARGET_ID = 'tab.listen'
const MORE_TAB_TARGET_ID = 'tab.more'
const OFFLINE_ITEM_TARGET_ID = 'more.offline-item'
const HISTORY_ITEM_TARGET_ID = 'more.history-item'
// The offline screen lives outside the tab group, so its header has no tab bar to
// blink: the back arrow is what actually returns to the «Ещё» tab.
const HEADER_BACK_TARGET_ID = 'header.back'

// The steps themselves are the content version of «Что нового»: the auto-show gate
// compares their fingerprint, and a release without user-visible novelties ships none.
// Screen changes are entry transitions (blink + navigation) attached to the next card,
// so they never count as steps — the deck stays five cards.
export const whatsNewScenario: OnboardingScenario = {
  description: 'Новинки этого релиза',
  icon: 'gift-outline',
  id: 'whatsNew',
  steps: [
    {
      text: 'Тап по проповеди теперь спрашивает, где её слушать, офлайн-коллекцию можно включить одной командой, а прогресс прослушивания сохраняется, даже если проповедь закончилась в фоне.',
      title: 'Что нового',
    },
    // Lead-up into the listen screen: when the tour starts elsewhere, the «Слушать»
    // tab blinks and navigates there before the data-refresh cards.
    { route: '/listen', tapTargetId: LISTEN_TAB_TARGET_ID },
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
    // Lead-up into the offline screen: the «Ещё» tab, then the «Офлайн» item.
    { route: '/more', tapTargetId: MORE_TAB_TARGET_ID },
    { route: '/offline', tapTargetId: OFFLINE_ITEM_TARGET_ID },
    {
      route: '/offline',
      targetId: 'offline.rows',
      text: 'Нажмите на загруженную проповедь — приложение предложит включить все офлайн-проповеди подряд или плейлист, в котором она есть. Без плейлистов включится всё офлайн сразу. Команда «Воспроизвести все» — в меню экрана.',
      title: 'Выбор в офлайне',
    },
    // Leaving the nested offline screen: blink its header back arrow (there is no
    // tab bar there), then the history item on the «Ещё» screen.
    { route: '/more', tapTargetId: HEADER_BACK_TARGET_ID },
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

import { type OnboardingScenario } from '../scenarios'

// The steps themselves are the content version of «Что нового»: the auto-show gate
// compares their fingerprint, and a release without user-visible novelties ships none.
// A notable release swaps these cards for its own novelties — old steps are dropped,
// not accumulated; several features of one release simply add another card.
// Pure announcement cards, so they carry no route or target and start on any screen.
export const whatsNewScenario: OnboardingScenario = {
  description: 'Новинки этого релиза',
  icon: 'gift-outline',
  id: 'whatsNew',
  steps: [
    {
      text: 'Только на планшетах и десктопе интерфейс перестраивается: текстовые вкладки и поиск-иконка собраны одним тонким островом сверху, а мини-плеер закреплён снизу. Подсветка активной вкладки — одна капсула, которая плавно переезжает между вкладками и подкрашивает подписи. Заголовки страниц, дублирующие названия вкладок, убраны, а кнопки действий плавают справа вверху. У плеера всегда полный набор кнопок — повтор, избранное, меню и очередь.',
      title: 'Планшетный вид',
    },
    {
      text: 'Поле поиска теперь в верхней части страницы: под переключателем «Слушать/Читать» на главной и над результатами в выдаче. Подсказки открываются под полем, а при входе на страницу поле сразу получает фокус.',
      title: 'Поле поиска наверху',
    },
  ],
  title: 'Что нового',
}

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
      text: 'На экранах от 768 точек интерфейс перестраивается: вкладки и поиск собраны одним островом сверху, а мини-плеер закреплён снизу. У плеера появляются повтор, избранное, меню и очередь; при сужении окна кнопки убираются по одной — остаются обложка, название и воспроизведение.',
      title: 'Планшетный вид',
    },
    {
      text: 'Поле поиска теперь в верхней части страницы: под переключателем «Слушать/Читать» на главной и над результатами в выдаче. Подсказки открываются под полем, а при входе на страницу поле сразу получает фокус.',
      title: 'Поле поиска наверху',
    },
  ],
  title: 'Что нового',
}

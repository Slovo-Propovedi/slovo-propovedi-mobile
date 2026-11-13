import { type OnboardingScenario } from '../scenarios'

// The steps themselves are the content version of «Что нового»: the auto-show gate
// compares their fingerprint, and a release without user-visible novelties ships none.
// This release is the preacher drill-down: a pure announcement card, so it carries no
// route or target and starts on any screen.
export const whatsNewScenario: OnboardingScenario = {
  description: 'Новинки этого релиза',
  icon: 'gift-outline',
  id: 'whatsNew',
  steps: [
    {
      text: 'Тап по проповеднику в результатах поиска открывает отдельную страницу со всеми его проповедями: постраничная загрузка, заголовок с именем проповедника и воспроизведение прямо из списка.',
      title: 'Проповеди проповедника',
    },
  ],
  title: 'Что нового',
}

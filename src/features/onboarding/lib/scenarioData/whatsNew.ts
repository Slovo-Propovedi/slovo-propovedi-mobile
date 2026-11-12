import { type OnboardingScenario } from '../scenarios'

// The steps themselves are the content version of «Что нового»: the auto-show gate
// compares their fingerprint, and a release without user-visible novelties ships none.
// This release is the redesigned search: pure announcement cards, so they carry no
// route or target and start on any screen.
export const whatsNewScenario: OnboardingScenario = {
  description: 'Новинки этого релиза',
  icon: 'gift-outline',
  id: 'whatsNew',
  steps: [
    {
      text: 'Поиск теперь открывается отдельной страницей — экран «Слушать» уступает её место. Недавние запросы хранятся на устройстве и управляются прямо на странице: «⋯» убирает запрос из истории, «Очистить» очищает всё.',
      title: 'Новый поиск',
    },
    {
      text: 'Результаты разложены по вкладкам «Проповеди», «Плейлисты» и «Проповедники»: полный список с бесконечной прокруткой, а иконки лупы, микрофона и крестиков стали крупнее.',
      title: 'Результаты по вкладкам',
    },
  ],
  title: 'Что нового',
}

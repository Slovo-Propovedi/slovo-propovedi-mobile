import { type OnboardingScenario } from '../scenarios'

// The steps themselves are the content version of «Что нового»: the auto-show gate
// compares their fingerprint, and a release without user-visible novelties ships none.
// This release is the redesigned search plus the fullscreen player refresh: the cards
// carry no route or transition, so the deck starts on any screen and never navigates.
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
    // Player novelties: the split control rows, the square artwork with the
    // artwork-derived background and the help scenario covering the player.
    {
      text: 'Плеер стал компактнее: ряд навигации (назад/плей/вперёд) и второй ряд — повтор трека, плейлист и меню.',
      title: 'Новые ряды плеера',
    },
    {
      text: 'Обложка проповеди в развёрнутом плеере — квадрат со скруглёнными углами, а фон страницы — BlurHash обложки: размытая заглушка появляется до загрузки картинки.',
      title: 'Квадратная обложка и blurhash-фон',
    },
    {
      targetId: 'app.help-button',
      text: 'Подробный обзор возможностей плеера — в сценарии «Экран плеера».',
      title: 'Сценарии плеера',
    },
  ],
  title: 'Что нового',
}

import { type OnboardingScenario } from '../scenarios'

// The steps themselves are the content version of «Что нового»: the auto-show gate
// compares their fingerprint, and a release without user-visible novelties ships none.
// Features of the same release accumulate here: append a card instead of replacing
// the previous ones — old steps are dropped only when the release is cut.
// Pure announcement cards, so they carry no route or target and start on any screen.
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
    {
      text: 'Поиск открывается пилюлей с лупой справа от панели вкладок — это отдельная страница, а не вкладка, поэтому в нижней панели остаются три таба. Когда вы уходите со страницы поиска, запрос очищается.',
      title: 'Поиск в нижней панели',
    },
    {
      text: 'Прогресс и отметки «прослушано» теперь хранятся по каждой проповеди: они не пропадают, когда запись вытесняется из истории прослушивания (лимит 100), и восстанавливаются из резервной копии.',
      title: 'Отметки прослушивания',
    },
  ],
  title: 'Что нового',
}

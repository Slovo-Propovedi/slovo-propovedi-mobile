# Таб «Читать»

**Маршрут:** `/read` (таб)
**Файлы:** `app/(tabs)/read.tsx` → `export { ReadScreen as default }` из `pages/read`
**Статус:** **гейтится фича-флагом `read`** — кнопка в `CustomTabBar` (`src/widgets/tab-bar/ui/CustomTabBar.tsx`, `isDisabled={!isTabAvailable(route.name)}`) при выключенном флаге показывает глобальный информационный диалог «Скоро будет доступно» (`showInfo`) и не навигирует; `ReadScreen` дополнительно не рендерит контент при `useFeatureFlag('read') === false` (см. [features/feature-flags.md](../features/feature-flags.md)). UI частично готов.

## Что делает (планируемое)

Таб чтения книг. Планируется показывать три горизонтальных слайдера книг по категориям. Маршруты вложенных экранов чтения пока не зарегистрированы в роутере.

## Что показывается

`ReadScreen` (`src/pages/read/ui/ReadScreen.tsx`) — вертикальный `ScrollView` с тремя слайдерами (все три — общий `Slider` из `shared/ui` с `itemsSize={SliderItemSize.Large}`; геометрия и снап — как на «Слушать», см. [screens/listen.md](./listen.md) → «Что показывается»). Экран не добавляет собственных боковых отступов — все инсеты слайдера живут внутри `Slider`: база — полная ширина экрана с cap `430`, карточка размера Large — 50% базы (≈195 на 390-телефоне, ≈215 на cap `430`); карточки и заголовки стоят на общей линии 24 от края, а на левой кромке всегда подрезана соседняя карточка (выступ `SLIDER_PEEK = 12`). Вертикальный зазор между слайдерами — единый `SLIDER_STACK_GAP` (одна строка заголовка), не зависит от размера карточек (см. [screens/listen.md](./listen.md) → «Что показывается»):

- «Конспекты для проповедников» — `NotesForPreachersBooksSlider` (`src/pages/read/ui/NotesForPreachersBooksSlider.tsx`);
- «По библии. Стих за стихом» — `VerseByVerseBooksSlider` (`src/pages/read/ui/VerseByVerseBooksSlider.tsx`);
- «Тематические и доктринальные» — `TopicalAndThematicBooksSlider` (`src/pages/read/ui/TopicalAndThematicBooksSlider.tsx`);
- Кнопка «?» в верхнем ряду экрана (не в нативной шапке) — онбординг/обзор возможностей (см. [../features/onboarding.md](../features/onboarding.md)).

Планируемые переходы: тап на книгу → `/read/book-reader`; тап на заголовок → `/read/books-list`.

## Откуда данные

- Локальная БД (`src/shared/api/db/`) и `booksAPI.getBooksOnBooksGroup`.
- Модели категорий в `src/pages/read/` (`model-notesForPreachers.ts`, `model-verseByVerse.ts`, `model-topicalAndThematic.ts`).

## Куда можно перейти

- `/read/book-reader` — **не зарегистрирован** в роутере.
- `/read/books-list` — **не зарегистрирован** в роутере.

## Состояния

- Таб доступен только при включённом фича-флаге `read`; при выключенном/незагруженном флаге нажатие показывает глобальный информационный диалог «Скоро будет доступно» (`showInfo`, текст «Этот раздел будет реализован в будущих обновлениях»), а `ReadScreen` рендерит `null`.

## Связанные документы

- [features/book-reader.md](../features/book-reader.md)
- [screens/book-reader.md](./book-reader.md) — будет создан вместе с экраном чтения книги
- [debt.md](../debt.md)

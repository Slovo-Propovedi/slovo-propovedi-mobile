# Таб «Читать»

**Маршрут:** `/read` (таб)
**Файлы:** `app/(tabs)/read.tsx` → `export { ReadScreen as default }` из `pages/read`
**Статус:** **заблокирован** — кнопка в `CustomTabBar` (`src/widgets/tab-bar/ui/CustomTabBar.tsx`, `isDisabled={route.name === 'read'}`) показывает диалог «Скоро будет доступно». UI частично готов.

## Что делает (планируемое)

Таб чтения книг. Планируется показывать три горизонтальных слайдера книг по категориям. Маршруты вложенных экранов чтения пока не зарегистрированы в роутере.

## Что показывается

`ReadScreen` (`src/pages/read/ui/ReadScreen.tsx`) — вертикальный `ScrollView` с тремя слайдерами:

- «Конспекты для проповедников» — `NotesForPreachersBooksSlider` (`src/pages/read/ui/NotesForPreachersBooksSlider.tsx`);
- «По библии. Стих за стихом» — `VerseByVerseBooksSlider` (`src/pages/read/ui/VerseByVerseBooksSlider.tsx`);
- «Тематические и доктринальные» — `TopicalAndThematicBooksSlider` (`src/pages/read/ui/TopicalAndThematicBooksSlider.tsx`).

Планируемые переходы: тап на книгу → `/read/book-reader`; тап на заголовок → `/read/books-list`.

## Откуда данные

- Локальная БД (`src/shared/api/db/`) и `booksAPI.getBooksOnBooksGroup`.
- Модели категорий в `src/pages/read/` (`model-notesForPreachers.ts`, `model-verseByVerse.ts`, `model-topicalAndThematic.ts`).

## Куда можно перейти

- `/read/book-reader` — **не зарегистрирован** в роутере.
- `/read/books-list` — **не зарегистрирован** в роутере.

## Состояния

- Таб доступен только через блокировку в `CustomTabBar`; нажатие показывает диалог «Скоро будет доступно» (этот раздел будет реализован в будущих обновлениях).

## Связанные документы

- [features/book-reader.md](../features/book-reader.md)
- [screens/book-reader.md](./book-reader.md) — будет создан вместе с экраном чтения книги
- [debt.md](../debt.md)

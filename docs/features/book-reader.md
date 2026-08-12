# Чтение книг (FB2)

**Слой:** `pages/book-reader`, `pages/books-list`, `pages/read`
**Статус:** **В РАЗРАБОТКЕ**

## Статус

> **В РАЗРАБОТКЕ.** Маршруты `/read/book-reader` и `/read/books-list` **НЕ зарегистрированы** в роутере (`app/`), хотя `useReadNavigation` (`src/shared/routing/useReadNavigation.ts`) на них навигирует. Таб «Читать» заблокирован диалогом «Скоро будет доступно» (`CustomTabBar` — `src/widgets/tab-bar/ui/CustomTabBar.tsx`). Код парсинга FB2 написан и покрыт типами, но экраны не смонтированы.

## Группы книг

Перечисление `FetchedBooksGroupName` — `src/shared/model/domain/bible.ts`:

- `NotesForPreachers` — «Конспекты для проповедников»;
- `VerseByVerse` — «По библии. Стих за стихом»;
- `TopicalAndThematic` — «Тематические и доктринальные».

Слайдеры категорий — `src/pages/read/ui/`: `NotesForPreachersBooksSlider.tsx`, `VerseByVerseBooksSlider.tsx`, `TopicalAndThematicBooksSlider.tsx`; собираются в `ReadScreen.tsx` (вертикальный `ScrollView`). Каждый слайдер тянет книги через свой action (`src/pages/read/model-notesForPreachers.ts`, `model-verseByVerse.ts`, `model-topicalAndThematic.ts`), используя `API.books.getBooksOnBooksGroup(FetchedBooksGroupName.X)`.

## Тип данных

`BookData = SermonData` — **книга = проповедь** (поля `id, title, artist, artwork, chapter, verse, description, textFileUrl, audioUrl, youtubeUrl`). Определено в `src/shared/model/domain/common.ts` (`bookSchema = sermonSchema`, `BookData = SermonData`, `booksArraySchema`).

## Локальная БД книг

- `src/shared/api/db/books/booksDB.ts` — `booksDB` (пример: `booksAPI.getBooksOnBooksGroup`).
- Корневой `db` (`src/shared/api/db/db.ts`) — `db.books` (массив групп книг по `FetchedBooksGroupName`) и `db.sermons`.
- `booksAPI.getBooksOnBooksGroup(tabName)` читает книги через `localDB.getBooks()` и фильтрует по группе.
- **TODO:** заменить на `getAllSermons` (Orval) + маппинг, когда бэкенд будет готов — см. [../debt.md](../debt.md) и [local-db.md](../contracts/local-db.md).

## Чтение FB2

Парсинг — `xml-js` (`xml2js`). Библиотека утилит — `src/pages/book-reader/lib/`:

- `parseFb2BookToObject.ts` — `parseFb2BookToObject(xml)` → `xml2js(...)` с `nativeType`, `ignoreAttributes` и пр.; возвращает корневой `XMLElementElement`;
- `parseObjectToStylizedElements.ts` — рекурсивное преобразование XML-дерева в RN-элементы (учитывает `title`, `section`, `subtitle`, `p`, `emphasis`, `strong`);
- `getTextElementStyles.ts` — `getTextElementStyles(name, theme)` — стили для имени тега;
- `getTextElement.tsx`, `getParagraphElement.tsx`, `getBlockElement.tsx` — фабрики RN-элементов;
- `getElementsInBlockElement.ts` — разбор дочерних элементов блока;
- `getElementKey.ts` — генерация ключей списков.

Типы XML-элементов (enum `BodyXMLElementName`, `DescriptionXMLElementName`, `XMLElementType`) — `src/pages/book-reader/model.ts`. Экраны: `src/pages/book-reader/ui.tsx` (`BookReaderScreen`) и `src/pages/books-list/ui.tsx` (`BooksListScreen`, список книг из JSON-параметра).

### Модель XML-элементов

`src/pages/book-reader/model.ts` описывает дерево через дискриминированный union `XMLElement`:

- `XMLElementElement` — узел с `name` (тег FB2: `body`, `section`, `title`, `subtitle`, `p`, `emphasis`, `strong`, а также элементы описания `author`, `book-title`, `genre`, ...) и массивом `elements`;
- `XMLElementText` — текстовая нода (`{ text, type: 'text' }`);
- `XMLElementType` — `'element' | 'text'`.

### Конвейер рендеринга

`BookReaderScreen` (`src/pages/book-reader/ui.tsx`):

1. `parseFb2BookToObject(testFb2String)` → корневой `XMLElementElement`;
2. поиск `body` (по `BodyXMLElementName.Body`);
3. `parseObjectToStylizedElements({ element, theme })` — рекурсивный рендер в RN-элементы:
   - `emphasis`/`strong` → текст-ноды со стилем (курсив/жирный);
   - `p` → абзац (`getParagraphElement`);
   - остальные блочные (`title`, `section`, `subtitle`) → блоки (`getBlockElement`);
   - стили из `getTextElementStyles(name, theme)`, ключи из `getElementKey`.

Сетевые мапперы и `mapWhereIsTitleLocated` (в `src/pages/listen/lib/`) к книгам не относятся — они для плейлистов главного экрана.

## Текущее ограничение

`BookReaderScreen` рендерит **тестовую FB2-строку** из `src/pages/book-reader/testFiles/testFb2.ts` (`testFb2String`), а не реальную книгу. Получение реальной FB2 по `textFileUrl` и передача книги через параметры маршрута ещё не реализованы.

## Путь пользователя (планируемый)

Когда фича будет подключена:

1. таб «Читать» → `ReadScreen` с тремя слайдерами категорий;
2. тап на заголовок категории → `navigateToBooksList(books, title)` → `/read/books-list` (список `BookData[]` из JSON-параметра);
3. тап на книгу → `navigateToBookReader(book)` → `/read/book-reader?book=<JSON BookData>`;
4. `BookReaderScreen` получает `textFileUrl` из книги, загружает FB2 и рендерит через конвейер выше.

Сейчас шаги 2–3 упираются в отсутствие регистрации маршрутов `/read/*` в роутере (`app/`).

## Связанные документы

- [../debt.md](../debt.md) — технический долг (замена локальной БД, подключение экранов)
- [../screens/read.md](../screens/read.md) — таб «Читать» (заблокирован)
- [navigation.md](./navigation.md) — незарегистрированные маршруты `/read/*`
- [../contracts/local-db.md](../contracts/local-db.md) — встроенная БД книг

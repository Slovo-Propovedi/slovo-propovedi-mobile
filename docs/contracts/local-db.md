# Встроенная локальная БД (временная — только для раздела книг)

> **Временный контракт.** Это захардкоженная в TS-файлах локальная «база» проповедей, плейлистов и книг, которая используется, пока бэкенд не готов. **TODO: заменить на реальные API-вызовы** (см. [../debt.md](../debt.md)). Реальные контракты API — в [rest-api.md](./rest-api.md).

## Назначение

Локальная БД — это статичные TS-массивы проповедей/плейлистов/книг, вшитые в код. Основной сценарий приложения (слушать проповеди) берёт данные с сервера через REST API (`sectionsApi.getSections()` в `src/pages/listen/model.ts`), а локальная БД используется **только в разделе книг** `/read` (таб заблокирован) через цепочку `getBooksOnBooksGroup` → `localDB.getBooks()` → `db.books` (`src/shared/api/books.ts`, `src/shared/api/localBD.ts`).

## Расположение

- Директория: `src/shared/api/db/`.
- Реэкспорт наружу через `src/shared/api/index.ts`:
  - `export * from './db/constants'`
  - `export * from './db/db'` (экспортирует `db`)
  - `API = { books: booksAPI }` — точка доступа к книгам.
- `localDB` — в `src/shared/api/localBD.ts` (обёртка над `db`).

## Структура `src/shared/api/db/`

```
db/
├── db.ts                    # Корневой объект `db`: { books: [...группы], sermons: [...группы] }
├── constants.ts             # DEFAULT_ARTIST = 'А. А. Вовк'
├── bibleBookNames.ts        # enum BibleBookName (названия книг Библии на русском)
├── books/
│   └── markBook.ts          # массив книг (по книгам Библии) — данные конкретной книги
├── sermons/
│   └── markBook.ts          # массив проповедей — данные конкретной книги (по главам)
├── bookLists/
│   ├── verseByVerse/        # списки книг по группам «стих за стихом»
│   ├── topicalAndThematic/  # списки книг по «тематическим» проповедям
│   └── ...                  # маркируются в db.ts
└── playlists/
    ├── onBibleBook/         # плейлисты проповедей по книгам Библии
    ├── topical/             # тематические плейлисты
    └── ...
```

Данные-элементы — объекты типа `SermonData`/`FetchedBookData` (структурно совпадают с доменным `SermonData` из `src/shared/model/domain/common.ts`): поля `id, title, artist, artwork, chapter, verse (number | number[]), description, textFileUrl`, иногда `audioUrl`, `youtubeUrl`. Пример записей — `src/shared/api/db/books/markBook.ts`.

## API

- **`localDB`** (`src/shared/api/localBD.ts`):
  - `getBooks()` → `Array<{ books: SermonData[]; groupName: FetchedBooksGroupName }>` (из `db.books`);
  - `getSermons()` → `Array<{ groupName: FetchedSermonsGroupName; playlists: PlaylistData[] }>` (из `db.sermons`).
- **`booksAPI`** (`src/shared/api/books.ts`): `getBooksOnBooksGroup(tabName)` → `SermonData[] | null`. Читает книги через `localDB.getBooks()` и фильтрует по `groupName`. Содержит TODO-комментарий о замене на `getAllSermons` + `mapAllSermonsResponse`, когда бэкенд будет готов.

## Группы

Перечисления — `src/shared/model/domain/bible.ts`:

- **`FetchedBooksGroupName`**: `notesForPreachers`, `topicalAndThematic`, `verseByVerse`.
- **`FetchedSermonsGroupName`**: `new`, `onBible`, `topical`.

Группы сопоставляются с массивами в `src/shared/api/db/db.ts`:

- `db.books`: `notesForPreachers` (Деяния, Марк, Иоанн, Лука), `verseByVerse` (9 книг), `topicalAndThematic` (3 списка).
- `db.sermons`: `new`, `onBible`, `topical` — сгруппированы наборы плейлистов.

## TODO

- Заменить `booksAPI.getBooksOnBooksGroup` на `getAllSermons` (Orval-клиент) + `mapAllSermonsResponse`, когда бэкенд будет готов — см. комментарий в `src/shared/api/books.ts`.
- Удалить/заархивировать `src/shared/api/db/` после перехода на реальный API.
- Связанные долги — в [../debt.md](../debt.md).

## Связанные документы

- [rest-api.md](./rest-api.md) — целевой REST API и мапперы
- [../features/book-reader.md](../features/book-reader.md) — чтение книг (FB2)
- [../screens/read.md](../screens/read.md) — таб «Читать» (заблокирован)
- [../debt.md](../debt.md) — технический долг по замене локальной БД

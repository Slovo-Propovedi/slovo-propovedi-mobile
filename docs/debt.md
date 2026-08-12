# Технический долг (debt)

Принцип: **каждый срезанный угол записывается в тот же PR**, жёстким форматом. Не «потом вспомним», а «записали сейчас». Перед завершением PR открой этот файл и добавь всё, что не доделал.

Формат записи: `- [ ] <что не доделано> — <где (пути файлов)> — <когда вернуться/контекст>`.
Закрытая запись: `- [x] ...`.

## Foundation

- [x] **Противоречие в структуре маршрутов между `AGENTS.md` и фактическим кодом.** В [`AGENTS.md`](../AGENTS.md) показана вложенная папка `app/read/` с `book-reader.tsx`/`books-list.tsx`, фактически маршрутов нет. Обновить `AGENTS.md` до фактического состояния — `app/` — когда затронется навигация. — **Закрыто 2026-08-12**: AGENTS.md обновлён, секция «Expo Router Structure» приведена к фактической структуре `app/` (добавлены `_RootLayout.tsx`, `settings.tsx`, `about.tsx`, listen оформлен как вложенная папка).
- [x] **Описание структуры `app/` в `AGENTS.md` устарело** (нет `settings.tsx`/`about.tsx` в схеме, есть `read.tsx`/`study.tsx`/`more.tsx` как одиночные табы) — обновить при работе с навигацией. — **Закрыто 2026-08-12**: AGENTS.md обновлён, секция «Expo Router Structure» приведена к фактической структуре `app/` (добавлены `_RootLayout.tsx`, `settings.tsx`, `about.tsx`, listen оформлен как вложенная папка).

## Auth flow

- [ ] **Отсутствует экран логина.** Токены работают только на уровне axios-интерцептора; при неудачном refresh токены очищаются, но переход на экран логина не выполнен — `src/shared/api/axiosInstance.ts` — TODO прямо в коде (строка «перейти на экран логина»). Вернуться при внедрении авторизации.
- [ ] **Экран логина/регистрации не спроектирован** — нет маршрута в `app/` и страницы в `src/pages/`. Связано с пунктом выше.

## Audio player

- [ ] **`TrackAutoAdvanceService.ts` и `TracksListItem.tsx` отключены от лимита строк через `eslint-disable max-lines`** — `src/entities/player/lib/PlayerService/TrackAutoAdvanceService.ts`, `src/shared/ui/track-list/TracksListItem.tsx` — FIXME: refactor. Разбить на подмодули и убрать `eslint-disable`.

## Read tab / FB2 reader

- [ ] **Функционал чтения книг частично готов, но не подключён.** `src/pages/book-reader/` (парсинг FB2, стилизация элементов) и `src/pages/books-list/` существуют, но маршруты не зарегистрированы — рендерится тестовая FB2 (`src/pages/book-reader/testFiles/`). Вернуться при подключении таба «Читать».
- [ ] **Таб «Читать» заблокирован** — `src/widgets/tab-bar/ui/CustomTabBar.tsx` — открывается диалог «Скоро будет доступно». Разблокировать при готовности FB2-ридера.

## Study tab

- [ ] **Таб «Учиться» — заглушка.** `src/pages/study/` — два пустых маршрута-сцены (Богословие, Душепопечение) через `react-native-tab-view`. Таб заблокирован в `src/widgets/tab-bar/ui/CustomTabBar.tsx`. Заполнить контентом при разработке раздела.
- [ ] **Опечатка названия таба:** в `src/pages/study/ui.tsx` подписи «Богословие»/«Душепопечение», в `app/(tabs)/_layout.tsx` заголовок таба — «Учаться» (опечатка), в `CustomTabBar.tsx` ROUTES — «Учиться». Унифицировать написание.

## Tab bar

- [ ] **Табы «Читать» и «Учиться» заблокированы диалогом «Скоро будет доступно»** — `src/widgets/tab-bar/ui/CustomTabBar.tsx` — разблокировать по мере готовности разделов (см. Read tab / Study tab).

## Local DB → API migration

- [ ] **Локальная БД в разделе книг должна быть заменена на реальные API-вызовы.** Основной сценарий (секции/плейлисты/проповеди) уже берёт данные с сервера (`sectionsApi.getSections()` в `src/pages/listen/model.ts:22`). Локальная БД (`src/shared/api/db/`, `src/shared/api/localBD.ts`) остаётся источником **только для раздела книг** `/read` (`getBooksOnBooksGroup` в `src/shared/api/books.ts:12`, TODO в `books.ts:10`). Заменить на `getAllSermons`/реальный вызов Orval, когда бэкенд для книг будет готов.
- [ ] **API книг — заглушка.** `src/shared/api/books.ts` — TODO: заменить на `getAllSermons`/реальный вызов Orval, когда бэкенд готов.
- [ ] **Мёртвый код локальной БД и неиспользуемые мапперы.** `db.getSermons`/`getSermons` (`src/shared/api/localBD.ts:10`), `src/shared/api/db/sermons/sermonsDB.ts`, а также мапперы `mapAllSermonsResponse`, `mapAllPlaylistsResponse`, `mapPlaylistEntities`, `mapPlaylistEntityToPlaylistData` существуют, но не вызываются в рантайме основного сценария (он использует цепочку `mapAllSectionsResponse` → `mapSectionEntityToSectionData` → `mapSectionPlaylistToPlaylistData` → `mapPlaylistSermonToSermonData`). Удалить после подтверждения, что они не нужны.
- [ ] **В `src/shared/api/generated/index.ts` закомментированы MSW-моки** (`authMocks`, `sermonsMocks`, `playlistsMocks`, `sectionsMocks`, `filesMocks`, `usersMocks`) — включить/документировать при внедрении моков.

## Book routes not registered

- [ ] **Маршруты чтения книг не созданы.** `src/pages/book-reader` и `src/pages/books-list` существуют, но в `app/` нет ни вложенной папки `read/` с этими экранами, ни ссылок в `shared/routing/useReadNavigation.ts` (хук готов, роуты `/read/book-reader`, `/read/books-list` объявлены). Создать маршруты при подключении таба «Читать».

## Tests

- [ ] **`playerSheet` (`src/entities/player/playerSheet.ts`) без тестов** — покрыть.
- [ ] **`pages/` (listen, playlist, playlist-list, more, read, study, settings, about) без тестов экранов** — покрыть ключевые сценарии (переходы, состояния).
- [ ] **`shared/ui/theme/` частично покрыт** (`colors`, `constants`, `model` — есть тесты), но `helpers/` и `ThemeContext/` без тестов — покрыть.
- [ ] **Widgets (`expandable-player`, `network-status`, `update-status`, `tab-bar`) без тестов** — покрыть.

## Прочее (найдено через grep TODO/FIXME/HACK/XXX в src/ и app/)

- [ ] `src/shared/api/axiosInstance.ts` — TODO перехода на экран логина (см. Auth flow).
- [ ] `src/shared/api/books.ts` — TODO заменить на реальный вызов (см. Local DB → API migration).
- [ ] `src/entities/player/lib/PlayerService/TrackAutoAdvanceService.ts` — FIXME refactor (см. Audio player).
- [ ] `src/shared/ui/track-list/TracksListItem.tsx` — FIXME refactor (см. Audio player).

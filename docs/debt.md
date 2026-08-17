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
- [ ] **Мёртвый код локальной БД и неиспользуемые мапперы.** `db.getSermons`/`getSermons` (`src/shared/api/localBD.ts:10`), `src/shared/api/db/sermons/sermonsDB.ts`, а также мапперы `mapAllPlaylistsResponse`, `mapPlaylistEntities` существуют, но не вызываются в рантайме основного сценария. Удалить после подтверждения, что они не нужны. (Примечание: `mapAllSermonsResponse` и цепочка `mapPlaylistEntityToPlaylistData` с 2026-08-14 используются поиском в `src/features/sermon-search/` и из списка мёртвого кода исключены.)
- [x] **Поиск проповедей не работает офлайн.** `src/features/sermon-search/` — результаты не кэшировались (в отличие от секций): при отсутствии сети пользователь видел «Ничего не найдено». — **Закрыто 2026-08-14**: per-query кэш результатов (`cachedSermonSearch:<query>` + индекс `cachedSermonSearch:index`, cap 30) с online-first записью и фолбэком при сетевой ошибке в `fetchSearchResults` — `src/features/sermon-search/model.ts` + `src/features/sermon-search/lib/searchCache.ts`; универсальные обёртки `getCachedJson`/`setCachedJson` — `src/shared/lib/cache/`.
- [ ] **Нет UI-индикатора источника данных поиска.** `src/features/sermon-search/` — результаты, показанные из кэша при сетевой ошибке, визуально не отличаются от свежих (в отличие от секций с `sectionDataSourceAtom`). Вернуться при развитии offline-сценария.
- [x] **SearchBar перемонтировался при переходе между режимами секций и результатов.** `src/pages/listen/ui/ListenScreen.tsx`, `src/features/sermon-search/ui/SearchBar.tsx` — раньше слот поиска жил в общем скролле (в режиме секций — первый ребёнок `ScrollView`, в режиме результатов — `ListHeaderComponent` `FlatList`), родители разные, поэтому при пересечении `MIN_QUERY_LENGTH` `SearchBar` перемонтировался и авто-фокус (rAF, `hasFocusedOnMount` per-instance) срабатывал повторно. — **Закрыто 2026-08-14**: UX-изменение «закрепить панель поиска» — `SearchBar` рендерится в закреплённой строке шапки (первый ребёнок `SafeAreaView`, над скролл-областью) и монтируется один раз при открытии поиска; при переходе секции ↔ результаты меняется только скролл-контейнер ниже, строка поиска остаётся смонтированной (подтверждено тестом: авто-фокус rAF срабатывает один раз за всю сессию поиска).
- [ ] **Пустые результаты поиска не кэшируются.** `src/features/sermon-search/lib/searchCache.ts` — `setCachedSearchResults` не пишет пустой массив (намеренно: кэш-хит означает «результаты есть», поведение при офлайне не меняется — всё равно «Ничего не найдено»). Пересмотреть, если понадобится отличать «запросили и пусто» от «не кэшировали».
- [ ] **Повреждённый индекс кэша поиска орфанит ключи данных.** `src/features/sermon-search/lib/searchCache.ts` — если `cachedSermonSearch:index` не парсится (`getCachedJson` → `undefined`), индекс пересоздаётся как `[latestKey]`, а до `MAX_CACHED_SEARCH_QUERIES` ключей `cachedSermonSearch:<query>` остаются висеть без ротации. При желании — чистка через `AsyncStorage.getAllKeys()` при сбросе индекса.
- [ ] **Моки API-клиента сгенерированы и экспортируются, но не используются.** `src/shared/api/generated/index.ts` экспортирует `authMocks`, `filesMocks`, `playlistsMocks`, `sectionsMocks`, `sermonsMocks`, `usersMocks` — фабрики мок-данных из `*.faker.ts` (Orval, `mock.generators` → `FAKER`). MSW-обработчики не настроены, в рантайме и в тестах моки не используются — документировать/подключить при внедрении моков (см. `docs/contracts/rest-api.md` → «MSW-моки»).
- [ ] **Подключить неиспользуемый эндпоинт `sermonControllerGetDistinctValues` для автодополнения в поиске проповедей.** `GET /sermons/distinct-values` (тип `SermonDistinctValuesResponse` = `{artists, books}` — ранее использованные проповедники и книги) сгенерирован в `src/shared/api/generated/sermons/sermons.ts`, но не используется. Значения `artists`/`books` подходят как suggest-подсказки при вводе запроса в поиске (`src/features/sermon-search/`), чтобы не вводить имена целиком и снизить количество пустых результатов. — вернуться при развитии поиска проповедей.

## Backend

- [ ] **Presigned URL из `GET /sermons/{id}/stream-url` отклоняет HEAD-запросы с `403 SignatureDoesNotMatch`.** Причина: HTTP-метод входит в AWS Sig V4 canonical request, поэтому URL, подписанный для GET, нельзя переиспользовать для HEAD. GET с `Range` работает корректно (`206`, подтверждено эмпирически). Важно: `Range` **намеренно не включён** в подпись — это правильно и позволяет стримингу/перемотке работать; НЕ следует добавлять `Range` в `SignedHeaders` (это сломает стриминг). Несущественно для плеера (HEAD не используется, стриминг идёт через прямой `audioUrl`), но мешает использовать `getStreamUrl` для probe/метаданных в будущем. Обёртка `sermonControllerGetStreamUrl` — `src/shared/api/generated/sermons/sermons.ts:59`. — сообщить бэкенд-команде для проверки; корректирующее действие — поддержка HEAD или отдельный presigned URL для HEAD, а не подпись `Range`.

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

## Build flavors

- [ ] **`expo prebuild --clean` сбрасывает flavors.** Если пересоздать нативную папку `android/` через `expo prebuild --clean` (или удалить `android/`), `build.gradle` и `strings.xml` перегенерируются из `app.json` — flavors, `applicationIdSuffix`, `debuggableVariants` и source-set имена будут потеряны, потребуется повторно применить изменения. `app.json` не содержит flavor-конфигурации. — `android/app/build.gradle`, `android/app/src/{dev,prod}/res/values/strings.xml` — вернуться, если переход на prebuild-per-build или добавление config-plugin для flavors понадобится. Сейчас bare workflow с отслеживаемой `android/` — flavours переживают обычную разработку.
- [ ] **Отдельные dev-иконки не созданы.** Оба flavor используют общие `mipmap-*` из `src/main/res`; различаются только именем приложения. При желании добавить dev-иконку с бейджем — положить `src/dev/res/mipmap-*/ic_launcher.png` (и `ic_launcher_round`). — `android/app/src/dev/res/` — когда потребуется визуальное различие иконок на рабочем столе.
- [ ] **iOS не затронут flavours.** `app.json` → `ios.bundleIdentifier = ru.slovopropovedi` един для всех сборок; отдельного dev target/scheme для iOS нет. При необходимости — завести `.xcconfig` per scheme + `app.config.js` с variant-логикой. — `app.json`, `ios/` — если понадобится раздельный dev для iOS.
- [ ] **Flavors не применяются в Forgejo CI.** `.forgejo/workflows/release.yml:146` запускает `npx expo prebuild --platform android --clean` перед сборкой — это стирает закоммичённую `android/` и регенерирует её из `app.json` (где flavors не описаны). Поэтому CI собирает «ванильный» prod release (без flavor-обёртки), а `assembleRelease`/`apk/release/` в `release.yml` остаются валидными. Намеренно оставлено пользователем — flavors нужны только для локальной разработки. Унификация (убрать `prebuild --clean` + `assembleRelease` → `assembleProdRelease` + путь `apk/prod/release/`) — отдельной задачей, если понадобится единообразие локальной и CI сборок. — `.forgejo/workflows/release.yml` — вернуться, если flavors-специфичная логика (resValue, BuildConfig per flavor) должна попадать в релизный APK.
- [ ] **Deep link scheme конфликтует при параллельной установке dev+prod.** `AndroidManifest.xml` регистрирует `<data android:scheme="slovo-propovedi"/>` без `host`. Оба flavor (dev `ru.slovopropovedi.dev` и prod `ru.slovopropovedi`) регистрируют одну схему — при установленном обоих вариантах Android не сможет однозначно маршрутизировать `slovo-propovedi://` ссылки (покажет chooser или выберет последнее). Приемлемо для разработки. Для решения — разные scheme per flavor (напр. `slovo-propovedi-dev` через source-set `AndroidManifest.xml` в `src/dev/`). — `android/app/src/main/AndroidManifest.xml:34` — вернуться, если deep links начнут использоваться внешними триггерами и понадобится детерминированный роутинг.
- [ ] **`autoIncrement` + кастомный `gradleCommand` в eas.json — проверить.** Профили `preview` и `production` сохраняют `autoIncrement: true` с явным `gradleCommand` (`:app:assembleProdRelease`/`:app:bundleProdRelease`). autoIncrement патчит `versionCode` в `build.gradle` до запуска задачи — в целом совместимо, но после первого EAS-билда проверить, что инкремент `versionCode` действительно срабатывает, а не «молча» перестал. — `eas.json` — проверить после первого EAS-билда после мерджа flavors.

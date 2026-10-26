# REST API — «Слово.Проповеди»

Внешний контракт REST API приложения. **Подробный список эндпоинтов, типов и Zod-схем — в сгенерированном клиенте** `src/shared/api/generated/` (Orval из удалённой OpenAPI-спецификации, заголовок «API — Слово.Проповеди»); этот документ не дублирует его, а фиксирует **настройку фронта** и **карту реального использования** эндпоинтов. См. также [storage.md](./storage.md) (токены) и [local-db.md](./local-db.md) (временный источник данных для раздела книг).

## Base URL

- По умолчанию: `https://api.slovo-propovedi.ru` — константа `DEFAULT_API_URL` в `src/shared/config/api-url.ts`.
- `axiosInstance` создаётся с этим base URL в `src/shared/api/axiosInstance.ts` (`axios.create({ baseURL: DEFAULT_API_URL })`).
- **Можно менять в Настройках**: атом `serverUrlAtom` (`src/shared/model/settings.ts`). Экшены `setServerUrlAction` / `initServerUrlAction` синхронизируют `axiosInstance.defaults.baseURL` с выбранным URL и персистят его в AsyncStorage (ключ `SERVER_URL`, см. [storage.md](./storage.md)). Допустим только `https://`: на этот адрес уходят токены администратора; при старте сохранённое значение без `https://` игнорируется (остаётся `DEFAULT_API_URL`). Токены привязаны к серверу, который их выдал: `setServerUrlAction` при смене адреса (значение отличается от `serverUrlAtom`) сначала вызывает `resetSessionForServerChange` (`src/shared/model/serverUrlSession.ts`) — чистит access/refresh-токены и кешированный профиль, а если сессия была, поднимает `markSessionExpired` (entities/auth сбрасывает состояние, админка уводит на `/admin/login`). Иначе интерцептор отправил бы `Authorization: Bearer …` и refresh-токен на новый хост.

## Аутентификация — Bearer JWT

Реализация — `src/shared/api/axiosInstance.ts`:

- **Request-interceptor** читает access-токен через `secureTokenStorage.getAccessToken()` (на native — `expo-secure-store`, на web — шифрованное IndexedDB-хранилище) и добавляет заголовок `Authorization: Bearer <accessToken>`; для запросов `POST /auth/refresh` заголовок не добавляется (refresh аутентифицируется токеном из тела).
- **Response-interceptor**:
  - при успешном ответе отмечает сервер доступным (`reportServerReachable(ctx)`, см. `src/shared/model/network`);
  - при сетевой ошибке (сервер не ответил) отмечает недоступным (`reportServerUnreachable(ctx)`);
  - при `401` (кроме самого запроса refresh — guard `isRefreshRequest`, чтобы refresh-запрос не запускал повторный refresh) помечает запрос `_retry` и вызывает `performTokenRefresh()`: отправляет `POST /auth/refresh` **напрямую** через тот же `axiosInstance` (`axiosInstance.post(REFRESH_ENDPOINT, { refreshToken })`) — запрос проходит через оба интерцептора, guard `isRefreshRequest` пропускает его без `Authorization` и без повторного refresh при 401; сохраняет новую пару токенов через `tokenStorage.setTokens`, повторяет оригинальный запрос с новым access-токеном;
  - при неудачном refresh очищает токены и кэш профиля (`secureTokenStorage.clearTokens()` + `clearCachedUser()`) **только** когда сам `POST /auth/refresh` отвергнут сервером (`401/403`, helper `isAuthRejection`) — в этом случае refresh-токен мёртв (например, пароль сменили и бэкенд повысил `tokenVersion`), — вызывает `markSessionExpired` (сигнал `sessionExpiredAtom` в `src/shared/model/sessionExpiry.ts`; `entities/auth` сбрасывает состояние и админка уходит на `/admin/login`, см. [features/admin.md](../features/admin.md) → «Сессия администратора и отзыв токенов») и отклоняет запрос; сетевой сбой во время refresh (или не-axios-ошибка, например отсутствующий refresh-токен), а также `429` токены **не** трогает, чтобы следующая попытка повторила refresh и восстановила сессию (иначе один нестабильный refresh молча вылогинивал администратора).
- **Rate limiting (0.22.2):** сервер ограничивает `POST /auth/login` — **10 запросов/мин** с IP, `POST /auth/refresh` — **30 запросов/мин**; превышение возвращает `429 Too Many Requests`. Ограничения серверные (`ThrottlerGuard`), в спецификации не описаны. Клиент трактует `429` как временный отказ: `getErrorMessage` (`src/shared/lib/error-utils.ts`) отдаёт «Слишком много попыток. Попробуйте через минуту» (серверное английское сообщение не показывается), форма входа выводит его в error-баннере. Для `refresh` `429` — транзиентный сбой: интерцептор сохраняет токены и не завершает сессию.

> ✅ **Инвариант:** `axiosInstance.ts` не имеет runtime-импортов из `./generated/**` — только type-only (стираются при сборке). Раньше файл импортировал `getAuth` из `generated/auth/auth` ради `authControllerRefresh`, что создавало require cycle (`axiosInstance ⇄ generated/auth/auth`: generated импортирует `customInstance` отсюда через mutator Orval). Теперь refresh вызывается напрямую: константа `REFRESH_ENDPOINT = '/auth/refresh'` в `axiosInstance.ts` — единственный источник правды об эндпоинте и используется и в guard'ах интерцепторов, и в самом запросе. Обратное ребро (`generated/*` → `customInstance` → `axiosInstance`) сохраняется — это гарантирует, что первый импорт любого generated-модуля регистрирует интерцепторы.

## Хранилище токенов — `secureTokenStorage` / `tokenStorage`

На native токены хранятся в `expo-secure-store` (шифрованный Keychain/Keystore), на web — в шифрованном IndexedDB-хранилище (AES-GCM/WebCrypto, `secureTokenStorage.web.ts`). Реализация — `src/shared/api/secureTokenStorage.native.ts` / `secureTokenStorage.web.ts` (generic-фолбэк — `secureTokenStorage.ts`), общий API — `secureTokenStorage` (`src/shared/api/secureTokenStorageShared.ts` для ключей и валидации), наружу — через `shared/api`:

- `setTokens(accessToken, refreshToken)` — сохраняет пару токенов.
- `getAccessToken()` / `getRefreshToken()` — возвращают токены (с валидацией и одноразовой миграцией legacy-ключей `@access_token`/`@refresh_token`).
- `setCachedUser(user)` / `getCachedUser()` / `clearCachedUser()` — кэш профиля (`UserResponse`).
- `clearTokens()` — удаляет обе пары.

`src/shared/api/axiosInstance.ts` держит объект `tokenStorage` (`setTokens`/`getAccessToken`/`clearTokens`) — стабильный API поверх `secureTokenStorage`, чтобы существующие потребители не менялись. Подробно — [storage.md](./storage.md).

### Выход — `POST /auth/logout`

`POST /auth/logout` (bearer, body `{ refreshToken }`, `204`) добавляет refresh-токен в **denylist на сервере** (портировано из `slovo-propovedi-admin` → `docs/features/auth.md`):

- вызов **best-effort** с таймаутом **~3 c**: сетевая ошибка или уже недействительный токен не блокируют локальный выход — `signOut` (`src/entities/auth/lib/signOut.ts`) сначала отзывает refresh-токен, затем очищает локальные токены;
- **access-токен остаётся технически валидным до истечения срока** (~30 мин) — denylist покрывает только refresh-токен, немедленного инвалидирования access-токена нет.

## Генерация клиента (Orval)

- **Команда:** `yarn api:generate`.
- **Источник:** OpenAPI-спецификация — **удалённый URL** `https://docs.slovo-propovedi.ru/openAPI.yaml`. Хост задаётся переменной окружения `DOCS_HOSTNAME` (значение — в `.env`, см. `.env.example`; можно экспортировать в окружение перед запуском). Фолбэка нет: без `DOCS_HOSTNAME` `orval.config.ts` падает с ошибкой. Спецификация ведётся вне этого репозитория; в проекте лежит только результат генерации.
- **Сгенерировано:** `src/shared/api/generated/` — **не редактировать вручную** (все файлы помечены «Generated by orval, Do not edit manually»). **Исключение — `generated/index.ts`:** ведётся вручную, Orval его не генерирует — для основного вывода (`main`) в `orval.config.ts` задан `indexFiles: false`; остальные файлы по-прежнему генерируются.
- **Сгенерированный код — контракт.** После каждого `yarn api:generate` сверять диф генерированных файлов с ожиданиями: **схема важнее прозы** — если текст этого документа расходится со сгенерированной схемой, правда на стороне схемы (правило адаптировано из OpenAPI-first-договорённости admin-репозитория; генератор — Orval вместо `@hey-api`).
- **Реэкспорт наружу:** `src/shared/api/index.ts` — `export * from './generated'`, то есть наружу доступны все namespace-модули (`authApi`, `featureFlagsApi`, `filesApi`, `invidiousApi`, `playlistsApi`, `sectionsApi`, `sermonsApi`, `usersApi`) и моки (`*Mocks`), а также `APITypes`. Это документированное исключение из правила «именованных реэкспортов»: поверхность сгенерирована Orval и принадлежит генератору, поэтому звезда сохраняется сознательно (см. [conventions.md](../conventions.md) → «Barrel-файлы»). Локальная ветка `./db/*` наружу **не** реэкспортируется: потребители (`src/shared/api/localBD.ts`) импортируют `./db/db` напрямую.
- **Типы:** все TS-интерфейсы — в `src/shared/api/generated/api.schemas.ts`, реэкспортированы как `APITypes`. Основные: `SermonEntity`, `PlaylistEntity`, `SectionEntity`, `UserResponse`, `AllUsersResponse`, `SermonDistinctValuesResponse`, `AllSectionsResponse`, `AllSermonsResponse`, `AllPlaylistsResponse`, `AllFilesResponse`, `InvidiousInstance`, `ReplaceInvidiousInstancesRequest` и DTO (`Create*Dto`, `Update*Dto`, `Reorder*Dto`). За актуальными полями обращайся к файлу напрямую.
- **Zod-схемы (runtime-валидация):** в `src/shared/api/generated/model/` (по модулям). Доменные Zod-схемы приложения — в сущностях: `sermonSchema`/`booksArraySchema` (`entities/sermon/model/sermon.ts`), `audioPlayerDataSchema` (`entities/sermon/model/audioPlayerData.ts`), `playlistDataSchema` (`entities/playlist/model.ts`), `sectionSchema` (`entities/section/model.ts`), см. [storage.md](./storage.md).

### Структура `src/shared/api/generated/`

```
generated/
├── index.ts                 # Агрегатор: authApi, featureFlagsApi, filesApi, invidiousApi, playlistsApi, sectionsApi, sermonsApi, usersApi, *Mocks, APITypes (ведётся вручную, не генерируется Orval)
├── api.schemas.ts           # Все TS-интерфейсы (APITypes)
├── auth/auth.ts             # getAuth() → signIn/refresh/logout/getProfile
├── basic/basic.ts           # getBasic() → healthControllerCheck
├── feature-flags/feature-flags.ts # getFeatureFlags() → effective-for-me, CRUD флагов, overrides
├── files/files.ts           # getFiles() → upload, list, orphans, file url
├── invidious/invidious.ts   # getInvidious() → список и полная замена Invidious-инстансов
├── playlists/playlists.ts   # getPlaylists() → CRUD + reorder sermons
├── sections/sections.ts     # getSections() → CRUD раздела + reorder разделов и плейлистов
├── sermons/sermons.ts       # getSermons() → CRUD + distinct-values
├── users/users.ts           # getUsers() → CRUD пользователей + change-password
└── model/                   # Zod-схемы для runtime-валидации (по модулям)
```

Каждый модуль экспортирует фабрику (`getAuth()`, `getSermons()` и т.д.), возвращающую функции-обёртки над `customInstance` из `src/shared/api/axiosInstance.ts`. `customInstance` пробрасывает конфиг в `axiosInstance` и возвращает `response.data`. Для каждого модуля также генерируется `*.faker.ts` — фабрики мок-данных (см. «Фабрики мок-данных (FAKER)»).

> ⚠️ Фабрика `getBasic` (health) **не реэкспортируется** из `generated/index.ts` — недостижима из `shared/api`. Reorder-функции (`reorderSections`, `reorderPlaylistsInSection`) в отличие от прежней версии клиента живут **внутри модуля sections** (`getSections`) и через `sectionsApi` достижимы, но в рантайме не вызываются.

## Карта использования эндпоинтов

Из сгенерированных функций-обёрток клиента в рантайме **реально вызываются** section-CRUD (`sectionControllerFindAll/Create/FindOne/Update/Remove`, `reorderSections`, `reorderPlaylistsInSection`), playlist-функции (`playlistControllerFindAll/Create/FindOne/Update/Remove`, `reorderSermonsInPlaylist`), `sermonControllerFindAll`, `sermonControllerGetDistinctValues`, `getFiles`, `invidiousInstancesControllerFindAll`, `invidiousInstancesControllerReplace`, `authControllerSignIn`, `authControllerLogout`, `authControllerGetProfile` и `featureFlagsControllerGetEffectiveForMe`. `POST /auth/refresh` ходит напрямую через `axiosInstance` (см. «Аутентификация»), минуя generated-обёртку. Остальные определены «на вырост» (админ-UI разделов и плейлистов использует полный CRUD и reorder).

| Модуль    | Функция                                                                                    | Эндпоинт                                          | Статус          | Где используется                                                                                                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| sections  | `sectionControllerFindAll`                                                                 | `GET /section`                                    | ✅ используется | `src/entities/section/lib/fetchAllSections.ts:24` (главный экран, `fetchAllSections`, online-first с фолбэком на кэш `entities/section/lib/sections-cache`); также список админ-разделов (`src/pages/admin-sections/lib/useAdminSections.ts`)            |
| sermons   | `sermonControllerFindAll`                                                                  | `GET /sermons` (`{search, take}`)                 | ✅ используется | `src/features/sermon-search/lib/searchSources.ts` — `fetchSermonResults` (online-first + per-query кэш, см. [offline-and-network.md](../features/offline-and-network.md)); также поиск проповедей в форме плейлиста (`src/pages/admin-playlist-form/lib/useSermonSearch.ts`)          |
| auth      | `authControllerRefresh`                                                                    | `POST /auth/refresh`                              | ❌ мёртвый      | refresh вызывается напрямую из `src/shared/api/axiosInstance.ts` (`performTokenRefresh` + `REFRESH_ENDPOINT`, guard `isRefreshRequest`) — чтобы не создавать require cycle `axiosInstance ⇄ generated/auth/auth`                                       |
| sermons   | `sermonControllerGetDistinctValues`                                                        | `GET /sermons/distinct-values`                    | ✅ используется | возвращает `SermonDistinctValuesResponse` (`{artists, books}`); автодополнение в поиске проповедей — `src/features/sermon-search/model-distinctValues.ts`: однократная загрузка при открытии поиска, клиентская фильтрация, кэш `cachedDistinctValues`; также подсказки формы проповеди — `src/pages/admin-sermon-form/lib/useSermonSuggestions.ts` |
| auth      | `authControllerSignIn`                                                                     | `POST /auth/login`                                | ✅ используется | `signIn` — `src/entities/auth/lib/signIn.ts`: вход в интерфейс администратора (`pages/admin-login`); сохраняет токены через `secureTokenStorage`, отвергает роль `user`                                                                                |
| auth      | `authControllerLogout`                                                                     | `POST /auth/logout`                               | ✅ используется | `signOut` — `src/entities/auth/lib/signOut.ts`: отзыв refresh-токена (best-effort, таймаут 3с) с главной админки                                                                                                                                       |
| auth      | `authControllerGetProfile`                                                                 | `GET /auth/profile`                               | ✅ используется | `restoreSession` — `src/entities/auth/lib/restoreSession.ts`: проверка сессии и роли при входе в `/admin`                                                                                                                                              |
| sermons   | `sermonControllerCreate/FindOne/Update/Remove`                                             | `POST/GET/PATCH/DELETE /sermons*` (кроме FindAll) | ✅ используется | admin-UI проповедей: создание/редактирование (`src/pages/admin-sermon-form/lib/useSermonFormController.ts`), деталь + удаление (`src/pages/admin-sermon-detail/lib/useAdminSermonDetail.ts`), загрузка формы (`src/pages/admin-sermon-form/lib/useAdminSermonEntity.ts`) |
| playlists | `playlistControllerFindAll`                                                               | `GET /playlists` (`{search, page, limit, sort, order}`) | ✅ используется | список админ-плейлистов — `src/pages/admin-playlists/lib/useAdminPlaylists.ts` (поиск с дебаунсом, пагинация по 20, сортировка); поиск плейлистов по названию/описанию в группе «Плейлисты» — `fetchPlaylistTitleMatches` (`src/features/sermon-search/lib/searchSources.ts`, `{search, limit: 50}`, per-query кэш)                       |
| playlists | `playlistControllerCreate/FindOne/Update/Remove`                                           | `POST/GET/PATCH/DELETE /playlists*`                | ✅ используются | админ-UI плейлистов: деталь и удаление (`src/pages/admin-playlist-detail`), создание/редактирование (`src/pages/admin-playlist-form`); `playlistControllerFindOne` также резолвит deep-link (см. [../features/deep-links.md](../features/deep-links.md))      |
| playlists | `reorderSermonsInPlaylist`                                                                 | `PATCH /playlists/{id}/sermons/reorder`            | ✅ используется | drag-переупорядочивание проповедей в плейлисте (`src/pages/admin-playlist-detail/lib/useAdminPlaylistDetail.ts`); тело `{ sermonIds }` — полный массив                                                                                                 |
| sections  | `sectionControllerCreate/FindOne/Update/Remove`                                            | `POST/GET/PATCH/DELETE /section*` (кроме FindAll) | ✅ используются | админ-UI разделов: создание/редактирование (`src/pages/admin-section-form`), деталь и удаление (`src/pages/admin-section-detail`), загрузка сущности перед формой (`src/pages/admin-section-form/lib/useAdminSectionEntity.ts`)                        |
| sections  | `reorderSections`, `reorderPlaylistsInSection`                                             | `PATCH /section/reorder*`                         | ✅ используются | drag-переупорядочивание в админке: разделы (`src/pages/admin-sections/lib/useAdminSections.ts`) и плейлисты раздела (`src/pages/admin-section-detail/lib/useAdminSectionDetail.ts`); оптимистично, с откатом при ошибке                                |
| users     | `usersControllerFindAll/Create/FindOne/Update/Remove/ChangePassword`                       | CRUD `/users*`                                    | ✅ используются | админ-UI пользователей (только роль admin): список (`src/pages/admin-users/lib/useAdminUsers.ts`), деталь + удаление + смена пароля (`src/pages/admin-user-detail/lib/useAdminUserDetail.ts`), форма (`src/pages/admin-user-form/lib/useUserFormController.ts`); `usersControllerFindAll` принимает `params` (`{page?, limit?}`) и возвращает `AllUsersResponse` (`{count, users}`) |
| files     | `getFiles`                                                                                 | `GET /files`                                      | ✅ используется | каталог медиа-библиотеки (`src/pages/admin-media/lib/useAdminMedia.ts`) и галереи обложек в формах (`widgets/admin-form-pickers/lib/useAdminFiles.ts`)                                                                                                  |
| files     | `appControllerUploadFile`                                                                  | `POST /files`                                     | ✅ используется | multipart-загрузка с прогрессом — `shared/api/uploadFile.ts` (обложка медиатеки, аудио/текст проповеди, изображение в `CoverPicker`)                                                                                                                   |
| files     | `appControllerRemoveFile`                                                                  | `DELETE /files/{fileName}`                        | ✅ используется | удаление файла: изображения из каталога медиа (`src/pages/admin-media/lib/useAdminMedia.ts`) и осиротевшие аудио/тексты поштучно (`src/pages/admin-media/lib/useOrphanedFiles.ts`); **409** — файл ещё используется (обложка либо ссылка проповеди)                                                                     |
| files     | `appControllerGetOrphanedFiles`, `appControllerCleanupOrphanedFiles`                       | `GET /files/orphans`, `POST /files/orphans/cleanup` | ✅ используются | скан и best-effort очистка осиротевших аудио/текстов (`src/pages/admin-media/lib/useOrphanedFiles.ts`)                                                                                                                                                  |
| files     | `appControllerGetFile`                                                                     | `GET /files/{fileName}`                           | ❌ мёртвый      | отдельного получения файла по имени нет: медиа отдаётся по статическому `audioUrl`/`fileUrl` (bucket public-read)                                                                                                                                      |
| invidious | `invidiousInstancesControllerFindAll`                                                      | `GET /invidious-instances`                        | ✅ используется | пресеты формы импорта — `src/features/sermon-audio-import/lib/useInvidiousInstances.ts` (fallback на встроенный дефолт); список админ-экрана — `src/pages/admin-invidious/lib/useInvidiousInstancesAdmin.ts`                                             |
| invidious | `invidiousInstancesControllerReplace`                                                      | `PUT /invidious-instances`                        | ✅ используется | сохранение админ-списка полной заменой — `src/pages/admin-invidious/lib/useInvidiousInstancesAdmin.ts` (тело `{ urls }`, порядок = порядок UI)                                                                                                          |
| basic     | `healthControllerCheck`                                                                    | `GET /health`                                     | ❌ мёртвый      | фабрика `getBasic` не реэкспортирована                                                                                                                                                                                                                 |
| feature-flags | `featureFlagsControllerGetEffectiveForMe`                                              | `GET /feature-flags/me`                           | ✅ используется | `src/entities/feature-flags/model.ts` — загрузка фича-флагов на старте (глобальных для анонима, эффективных для аутентифицированного пользователя; auth опционален) — гейтинг табов «Читать»/«Учиться», см. [features/feature-flags.md](../features/feature-flags.md)                                                                                              |
| feature-flags | `featureFlagsControllerFindAll`, `Create`, `Update`, `Remove`                          | `GET`/`POST /feature-flags`, `PATCH`/`DELETE /feature-flags/{id}` | ✅ используются | админ-UI управления флагами — `src/pages/admin-flags/lib/useAdminFlags.ts`, `src/pages/admin-flag-form/lib/{useAdminFlagEntity,useFlagFormController}.ts`, `src/pages/admin-flag-detail/lib/useAdminFlagDetail.ts` (только admin, см. [screens/admin-flags.md](../screens/admin-flags.md)) |
| feature-flags | `featureFlagsControllerSetOverride`, `DeleteOverride`                                  | `PUT`/`DELETE /feature-flags/{id}/overrides/{userId}` | ✅ используются | grant/deny/clear пер-пользовательских исключений с детали флага — `src/pages/admin-flag-detail/lib/useAdminFlagDetail.ts`                                                                                                                          |
| feature-flags | `featureFlagsControllerFindOverrides`                                                  | `GET /feature-flags/{id}/overrides`               | ✅ используется | чтение списка существующих исключений (пустой список — валидный 200) на детали флага — `src/pages/admin-flag-detail/lib/useFlagOverrides.ts` (только admin, см. [screens/admin-flags.md](../screens/admin-flags.md))                          |

> **Итог:** приложение работает на **сетевых эндпоинтах** `GET /section`, `GET /sermons` для поиска, `GET /sermons/distinct-values` для подсказок поиска, `GET /playlists/{id}` для deep-link резолва плейлиста, `POST /auth/refresh` (последний напрямую через `axiosInstance`, минуя generated-клиент) + локальной БД для раздела книг (см. [local-db.md](./local-db.md)); админка добавляет полный section-CRUD и оба reorder-эндпоинта разделов, полный playlist-CRUD + reorder проповедей, sermon-CRUD с загрузкой файлов, медиа-библиотеку (`GET/POST/DELETE /files`, orphans-скан и очистка), полный users-CRUD, управление фича-флагами (`GET`/`POST /feature-flags`, `PATCH`/`DELETE /feature-flags/{id}`, `GET /feature-flags/{id}/overrides`, `PUT`/`DELETE /feature-flags/{id}/overrides/{userId}`, см. [`screens/admin-flags.md`](../screens/admin-flags.md)) и управление Invidious-инстансами (`GET`/`PUT /invidious-instances`, см. [`features/admin.md`](../features/admin.md)). Весь остальной CRUD-клиент заведён «на вырост».

## Доступ к медиа (0.22.2)

В спецификации **0.22.2** удалены `GET /sermons/{id}/stream-url` и `GET /files/{fileName}/stream-url`, вместе с ними из сгенерированного клиента ушли обёртки (`sermonControllerGetStreamUrl`, `appControllerGetStreamUrl`), их faker-моки и тип `StreamUrlResponse`.

Причина: bucket MinIO — **public-read**. `SermonEntity.audioUrl`/`textFileUrl`, `SermonEntity.artwork`/`PlaylistEntity.artwork` и `IFileResponseDto.fileUrl` — статические публичные URL, по которым медиа отдаётся без авторизации. Плеер и офлайн-кэш используют `audioUrl` напрямую (без `Authorization`-заголовка), поэтому удаление эндпоинтов не меняет воспроизведение и скачивание. Новый код не должен ждать presigned-URL: единственный механизм доступа к медиа — статический URL из сущности.

## Границы ввода (0.22.2)

Спецификация 0.22.2 добавила серверные ограничения на входные поля. **Источник истины — zod-схемы** `src/shared/api/generated/model/` (константы вида `*Max`/`*Min` рядом со схемами); TS-типы в `api.schemas.ts` дублируют их в JSDoc (`@maxLength`, `@maxItems`, `@minimum`, `@maximum`, `@pattern`). Клиентская валидация должна зеркалить эти границы, чтобы не получать `400` на валидной по форме отправке.

| Поле                                                                     | Ограничение                |
| ------------------------------------------------------------------------ | -------------------------- |
| `password` (`POST /users`, `PATCH /users/{id}/password`)                  | 8–200 символов             |
| `password` при входе (`POST /auth/login`)                                 | только `maxLength: 200`    |
| `username` (создание пользователя, вход)                                  | `maxLength: 50` / вход 100 |
| `email`                                                                   | `maxLength: 254`           |
| `name` (пользователя)                                                     | `maxLength: 100`           |
| `title` (проповедь, плейлист, раздел)                                     | `maxLength: 300`           |
| `description` (проповедь, плейлист, раздел)                               | `maxLength: 10000`         |
| `artist`                                                                  | `maxLength: 200`           |
| `book`                                                                    | `maxLength: 100`           |
| `artwork`, `audioUrl`, `textFileUrl`, `youtubeUrl`, URL Invidious-инстанса | `maxLength: 2048`          |
| `audioUrl`, `textFileUrl`                                                 | `pattern: ^https?://[^/]+/files/.+$` (URL обязан указывать на `/files/`) |
| `youtubeUrl`                                                              | `pattern: ^https?://.+$` — только http(s), `javascript:`/`data:` отклоняются |
| `artwork` проповеди/плейлиста                                             | `pattern: ^(https?://.*)?$` — пустая строка или http(s)-ссылка |
| Массивы связей и reorder (`playlistsIds`, `sermonsIds`, `sectionsIds`, `ids`, `playlistIds`, `sermonIds`) | `maxItems: 1000` |
| `page` (пагинация)                                                        | `max: 100000`; `limit` — `max: 100` |
| `search` (`GET /sermons`, `GET /playlists`)                               | `maxLength: 200`           |
| `itemsRows` (раздел)                                                      | целое `0..100` (было просто `number`) |
| Фича-флаг: `key` / `title`                                                | `maxLength: 100` / 200     |

Паттерны `youtubeUrl`/`artwork` закрывают stored XSS через ссылки: клиент зеркалит их в `urlError`/`artworkUrlError` (`src/shared/lib/validation/formValidation.ts`, паттерны — `YOUTUBE_URL_PATTERN`/`ARTWORK_URL_PATTERN` из `inputLimits.ts`, взяты из сгенерированных констант).

Rate limiting аутентификации — в разделе «Аутентификация» выше (`login` 10/мин, `refresh` 30/мин, `429` при превышении). На клиенте `429` показывается как «Слишком много попыток. Попробуйте через минуту» (`getErrorMessage`), а `429` от `refresh` не завершает сессию (токены сохраняются).

## Курсорная пагинация `GET /sermons`

`AllSermonsResponse` (`{ count, nextCursor, sermons }`, см. `api.schemas.ts`) задаёт контракт последней страницы: `nextCursor` — `string | null`, и `null` означает **конец данных** (следующей страницы нет); клиент обязан трактовать `null` как остановку дозагрузки, а не как «попробовать снова с тем же курсором» (так делает `useSermonSearch`: `hasMore = nextCursor !== null`). Запрос пагинации ведётся либо курсором (`take` + `cursor`), либо офсетом (`page` + `limit`) — это **взаимоисключающие** режимы, смешивать их в одном запросе нельзя. В форме плейлиста используется курсорный режим (`take=20` + `cursor`); списки проповедей админки (`useAdminSermons`) — офсетный (`page`/`limit=20`).

**Курсор — непрозрачная строка.** Со спецификации 0.23.0 `cursor` в `SermonControllerFindAllParams` типизирован как `string` (было `format: uuid`) и представляет собой **составной base64-курсор**: сервер кодирует в нём дату добавления и `id` последней записи (keyset-пагинация по `(created_at, id)`). Клиент **не разбирает и не конструирует** курсор — только возвращает `nextCursor` предыдущей страницы в `cursor` (так делает `useSermonSearch`: `setCursor(response.nextCursor)` → `sermonControllerFindAll({ cursor, … })`). В режиме поиска (`search` непустой) сервер использует другой формат (`{rank, id}` в base64) — для клиента он так же непрозрачен.

**Устаревший курсор → `400`.** Курсоры старого (uuid) формата после релиза 0.23.0 недействительны: сервер отвечает `400` (`invalid or stale cursor`). Курсор живёт только в состоянии экрана и не персистится, поэтому «протухнуть» он может лишь на живом экране (перезапуск/переиндексация бэкенда). Лечение — перезагрузка списка с первой страницы; «Повторить загрузку» в футере повторяет `loadMore` с тем же мёртвым курсором и будет падать до перезагрузки списка или смены поиска (см. [admin-playlists.md](../screens/admin-playlists.md) → «Пикер проповедей»).

**Сортировка `sort=date`** у `GET /sermons` и `GET /playlists` теперь идёт по реальной дате добавления — `(created_at, id)` (при равенстве дат — по `id`), а не по `id` как раньше. Подпись «По дате» в админ-списках соответствует фактической дате добавления; для офсетной пагинации (`page`/`limit`) это ничего не меняет, но порядок записей может отличаться от прежнего.

## Дата добавления: `createdAt` (0.23.0)

`SermonEntity` и `PlaylistEntity` (верхнеуровневые) получили **обязательное** поле `createdAt` (`string`, `format: date-time`; в zod-схемах — `zod.iso.datetime({ offset: true })`). Вложенные проекции **намеренно без** `createdAt`: `PlaylistSermon` (проповедь внутри плейлиста и в ответе `GET /sermons`) и `SectionPlaylist` (плейлист внутри раздела). При этом `SermonEntity.playlists` содержит полноценные `PlaylistEntity` — у них `createdAt` есть.

Влияние на клиент:

- фабрики `<area>Mocks` генерируют `createdAt` автоматически, поэтому тестовые серверные ответы обязаны приходить из них: ручные литералы DTO без поля больше не проходят `check:types` (правило — [AGENTS.md](../../AGENTS.md) → «Testing Guidelines»);
- доменные мапперы (`mapSermonEntityToSermonData`, `mapPlaylistEntityToPlaylistData`, `mapPlaylistSermonToSermonShape`, `mapSectionPlaylistToPlaylistData`) поле пока **не пробрасывают** — доменные `SermonData`/`PlaylistData` не менялись, «дата добавления» в UI не показывается (см. [../debt.md](../debt.md)).

## Мёртвый код

Помимо неиспользуемых обёрток (см. таблицу выше), в `src/shared/api/` есть мёртвый код, не задействованный в рантайме:

- **`db.sermons` / `localDB.getSermons`** (`src/shared/api/db/db.ts`, `src/shared/api/localBD.ts`) — локальные плейлисты проповедей, 0 ссылок. Используется только ветка `db.books` через `localDB.getBooks()`. — **удалено 2026-09-10**: `localDB.getSermons` удалён; массив `db.sermons` остаётся как мёртвые данные (см. [../debt.md](../debt.md)).
- **`src/shared/api/db/sermons/sermonsDB.ts`** — НЕ мёртв: держится ребром `db.sermons` → `markPlaylist.ts` → `sermonsDB.ts` (см. [../debt.md](../debt.md)).
- **Мапперы** `mapAllPlaylistsResponse`, `mapPlaylistEntities` — не дёргаются из живых цепочек (`mapAllSectionsResponse` и `mapAllSermonsResponse`). — **удалено 2026-09-10**.
- **Zod-схемы в `generated/model/`** — не экспортируются из `generated/index.ts`, 0 ссылок вне `generated/`.

Удаление мёртвого кода — в [../debt.md](../debt.md).

## Мапперы — `entities/{sermon,playlist,section}/lib/mappers/`

Преобразуют API-ответы в доменные типы приложения. После FSD-рефактора мапперы живут внутри сущностей (сегмент `lib/mappers/`), а канонические доменные типы — в самих сущностях; `src/shared/model/domain/common.ts` держит только структурные формы (`SermonShape`/`PlaylistShape`/`SectionShape`) для границы `shared`. Живых цепочек две: от `mapAllSectionsResponse` (главный экран, внутри `entities/section`) и от `mapAllSermonsResponse` (поиск проповедей, `src/features/sermon-search/lib/searchSources.ts`).

| Маппер                                              | Вход → Выход                                   | Статус                                                                             |
| --------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `mapAllSectionsResponse`                            | `AllSectionsResponse` → `SectionData[]`        | ✅ живой (`src/entities/section/lib/fetchAllSections.ts:25`)                       |
| `mapSectionEntityToSectionData`                     | `SectionEntity` → `SectionData`                | ✅ живой (через `mapAllSectionsResponse`; `entities/section`)                      |
| `mapSectionPlaylistToPlaylistData`                  | `SectionPlaylist` → `PlaylistData`             | ✅ живой (транзитивно; `entities/section`)                                         |
| `mapPlaylistSermonToSermonShape`                    | `PlaylistSermon` → `SermonShape`               | ✅ живой (транзитивно; `entities/playlist`)                                        |
| `mapSectionRefToSectionData`                        | `SectionRef` → `SectionData`                   | ✅ живой (транзитивно; `entities/section`)                                         |
| `mapAllSermonsResponse`                             | `AllSermonsResponse` → `SermonData[]`          | ✅ живой (`src/features/sermon-search/lib/searchSources.ts`; `entities/sermon`)    |
| `mapSermonEntities` / `mapSermonEntityToSermonData` | массивы/сущности                               | ✅ живые (через `mapAllSermonsResponse`; `entities/sermon`)                        |
| `mapPlaylistEntityToPlaylistData`                   | `PlaylistEntity` → `PlaylistData`              | ✅ живой (`src/pages/playlist/lib/resolvePlaylistFromApi.ts`, `src/features/sermon-search/lib/searchSources.ts`; `entities/playlist`) |
| `mapPlaylistSermonPlaylistsItemToPlaylistData`      | `PlaylistSermonPlaylistsItem` → `PlaylistData` | ✅ живой (через `mapPlaylistSermonToSermonShape`; `entities/playlist`)             |
| `mapAllPlaylistsResponse`                           | `AllPlaylistsResponse` → `PlaylistData[]`      | ❌ удалено 2026-09-10                                                              |
| `mapPlaylistEntities`                               | массивы                                        | ❌ удалено 2026-09-10                                                              |

> Мапперы — внутренние детали сущностей. Наружу через barrel'ы экспортируются только нужные потребителям: `entities/sermon` → `mapAllSermonsResponse`, `entities/playlist` → `mapPlaylistEntityToPlaylistData`, `entities/section` → `mapSectionEntityToSectionData`; остальные (`mapAllSectionsResponse`, `mapSectionPlaylistToPlaylistData`, `mapPlaylistSermonToSermonShape` и т.д.) — внутренние, доступны другим сущностям только через `@x`-точки. `src/shared/api/index.ts` их больше не реэкспортирует.

> **Артворк: API может вернуть `''`.** `SermonEntity.artwork`/`PlaylistEntity.artwork` в OpenAPI типизированы как `string` (не nullable), но бэкенд отдаёт **пустую строку** для «нет артворка». Мапперы нормализуют её в `null` через `nullIfEmpty` (`src/shared/lib/utils/nullIfEmpty.ts`): `mapSermonEntityToSermonData`, `mapPlaylistEntityToPlaylistData`, `mapPlaylistSermonToSermonShape`, `mapSectionPlaylistToPlaylistData`. Без этого `sermon.artwork ?? playlist.artwork` не сработал бы (`'' ?? x` = `''`) — плеер показывал бы плейсхолдер вместо обложки плейлиста. `mapPlaylistSermonPlaylistsItemToPlaylistData` (лёгкие ссылки) и так кладёт `artwork: null`.

## Главы и стихи: диапазоны и списки

С версии спецификации 0.15.1 поля `chapter` и `verse` в `SermonEntity` и `PlaylistSermon` расширены с одиночного числа до «диапазонов» (примеры — в `src/shared/api/generated/api.schemas.ts`):

- `chapter: number | number[] | null` — массив из двух чисел трактуется как **диапазон глав** (например `[3, 4]` = главы 3–4).
- `verse: number | number[] | (number | number[])[] | null` — по комментарию в спецификации: массив из двух целых чисел — **диапазон от–до** (`[9, 18]`); массив, содержащий кортежи или смесь целых и кортежей, — **список разрозненных отрезков** (`[[9, 18], 20]` = отрезок 9–18 и стих 20; `[16, [18, 20], 22]` = стихи 16, 18–20, 22).

**Влияние на фронт (в ходе этой же миграции обновляется):**

- **Доменная модель** `src/entities/sermon/model/sermon.ts` — `sermonSchema` расширяется под новые union-формы `chapter`/`verse`, чтобы валидировать данные и с сервера, и из кэша (структурная форма `SermonShape` — `src/shared/model/domain/common.ts`). Старые значения (одиночное число / `null`) остаются валидными подмножеством новых форм.
- **Форматтеры ссылок на Писание** — `formatSermonReference` (`src/entities/sermon/lib/formatSermonReference.ts`) и `formatScripture` (`src/features/sermon-search/lib/formatScripture.ts`) расширяются: диапазон `[a, b]` выводится как «a-b», список отрезков — через запятую. Используются в подписях плейлиста, мини/полноэкранного плеера и в строках результатов поиска.
- **Кэши** (per-query кэш поиска `cachedSermonSearch:q:<query>`, кэш секций `CACHED_SECTIONS`, плейлисты в параметрах маршрута) хранят `SermonData` с этими полями — расширенная схема валидации принимает и старые, и новые формы.
- **DTO на запись** (`CreateSermonDto`/`UpdateSermonDto`) — `chapter`/`verse` стали опциональными.

## Фабрики мок-данных (FAKER)

В `src/shared/api/generated/index.ts` экспортируются `authMocks`, `featureFlagsMocks`, `filesMocks`, `invidiousMocks`, `playlistsMocks`, `sectionsMocks`, `sermonsMocks`, `usersMocks` — фабрики мок-данных из модулей `*.faker.ts` (по одному на каждый API-модуль), сгенерированные Orval (конфиг `mock.generators` → `FAKER` в `orval.config.ts`). Это единственный источник серверных ответов в тестах: данные берут через `<area>Mocks` (`get*ResponseMock`). MSW в проекте **не используется** — пакет не установлен, рантайм-мока нет; в рантайме приложения фабрики не применяются.

## Текущий статус (TODO)

- Главный экран («Слушать») берёт данные секций с сервера через `sectionControllerFindAll` (`src/entities/section/lib/fetchAllSections.ts`) + кэш как офлайн-фолбэк (`setCachedSections`/`getCachedSections` в `src/entities/section/lib/sections-cache/`).
- **Поиск проповедей** ходит на `GET /sermons` через `sermonControllerFindAll` (`src/features/sermon-search/lib/searchSources.ts`) с `{search, take: 20}`; успешный ответ пишется в per-query кэш (`cachedSermonSearch:q:<query>`), при сетевой ошибке — фолбэк на кэш. Параллельно поиск ходит на `GET /playlists` за плейлистами по названию/описанию (`{search, limit: 50}`, per-query кэш `cachedPlaylistSearch:q:<query>`).
- **Плеер** получает `audioUrl`/`textFileUrl` из `SermonEntity` (пришедшей через `GET /section` или поиск) и играет напрямую по статическому публичному URL; эндпоинтов `stream-url` в спецификации 0.22.2 больше нет (bucket public-read), авторизационный заголовок для медиа не нужен.
- **Раздел книг `/read`** (таб заблокирован) использует локальную БД через `API.books.getBooksOnBooksGroup` → `localDB.getBooks()` → `db.books` (`src/shared/api/books.ts:15`). TODO в `books.ts:10`: заменить на реальный API-вызов, когда бэкенд для книг будет готов — см. [../debt.md](../debt.md).
- **Аутентификация** реализована для интерфейса администратора: `entities/auth` (`signIn`/`restoreSession`/`signOut`) использует `authControllerSignIn`/`authControllerGetProfile`/`authControllerLogout`; токены — в `secureTokenStorage`. Публичного пользовательского логина по-прежнему нет (таб-бар остаётся публичным), вход в `/admin` защищён.
- **Админка проповедей** использует полный sermon-CRUD: список (`sermonControllerFindAll` с `page`/`limit`/`sort`/`order`), деталь/удаление (`sermonControllerFindOne`/`Remove`), форма (`sermonControllerCreate`/`Update`), подсказки (`sermonControllerGetDistinctValues`), загрузка файлов (`POST /files` через `shared/api/uploadFile.ts`) — см. [`features/admin.md`](../features/admin.md), [`screens/admin-sermons.md`](../screens/admin-sermons.md).
- **Источники импорта (Invidious)** — `GET`/`PUT /invidious-instances` (только роль admin): список админ-управляемых пресетов формы импорта и его полная замена. Форма импорта запрашивает список и при любой ошибке/пустом ответе показывает встроенный дефолт `https://inv.phobos.observer` — фича работает до деплоя бэкенда. См. [`features/admin.md`](../features/admin.md) → «Источники импорта», [`screens/admin-invidious.md`](../screens/admin-invidious.md).

## Связанные документы

- [storage.md](./storage.md) — ключи AsyncStorage для токенов и кэша
- [local-db.md](./local-db.md) — временная встроенная БД (только для раздела книг)
- [../features/offline-and-network.md](../features/offline-and-network.md) — сеть, офлайн, авто-refresh токенов, кэш поиска
- [../debt.md](../debt.md) — мёртвый код и TODO по замене локальной БД

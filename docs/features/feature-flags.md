# Фича-флаги (Feature flags)

**Слой:** `entities/feature-flags` (клиентский гейтинг) + `pages/admin-flags` / `pages/admin-flag-detail` / `pages/admin-flag-form` (админ-UI)
**Статус:** готов

## Что делает

Клиентская проверка фича-флагов. Табы «Читать» и «Учиться» открываются только если соответствующий флаг (`read` / `study`) включён. Для аутентифицированного пользователя сервер отдаёт его эффективные флаги (глобальное состояние + пер-пользовательские исключения), для анонима — глобальное состояние (аутентификация опциональна, `GET /feature-flags/me` никогда не возвращает 401).

## Срез `entities/feature-flags`

| Файл                                        | Экспорт                                                                       | Назначение                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `model.ts`                                  | `featureFlagsAtom`, `fetchMyFeatureFlags`                                     | состояние и загрузка флагов                                  |
| `lib/useFeatureFlag.ts`                     | `useFeatureFlag(key)`                                                         | доступ к значению флага                                      |
| `lib/useFeatureFlagsRefetchOnForeground.ts` | `useFeatureFlagsRefetchOnForeground()`                                        | рефетч флагов при возврате в foreground                      |
| `@x/auth.ts`                                | `fetchMyFeatureFlags`                                                         | кросс-импорт для `entities/auth` (рефетч после входа/выхода) |
| `index.ts`                                  | `fetchMyFeatureFlags`, `useFeatureFlag`, `useFeatureFlagsRefetchOnForeground` | публичный API среза                                          |

### `featureFlagsAtom`

`atom<null | Record<string, boolean>>(null, 'featureFlagsAtom')` — карта «ключ флага → включён».

- `null` — флаги **не загружены** (запрос в полёте, ошибка).
- Загруженное значение — `Record<string, boolean>` (глобальные флаги для анонима или эффективные для аутентифицированного пользователя).

### `fetchMyFeatureFlags`

Экшен (`action`) вызывает `GET /feature-flags/me` через `featureFlagsApi.getFeatureFlags().featureFlagsControllerGetEffectiveForMe()`.

1. Запрос выполняется **всегда**: аутентификация эндпоинта опциональна. При наличии access-токена `Authorization`-заголовок подставляет axios-интерцептор (`shared/api/axiosInstance.ts`), и сервер возвращает эффективные флаги пользователя; без токена (или с невалидным/просроченным) — глобальное состояние флагов. Отдельной проверки токена в экшене нет.
2. Преобразует список `[{ key, enabled }]` в `Record<string, boolean>` (`Object.fromEntries`).
3. Записывает карту в `featureFlagsAtom` через `ctx.schedule`.
4. При ошибке — `console.error` + короткий тост (`showToast`), атом остаётся `null` (доступ не открывается). Глобальная модалка ошибки не показывается: это фоновый, некритичный запрос, который к тому же повторяется при каждом возврате в foreground.

**Дедупликация тоста (только на смене исхода).** Тост показывается при переходе `success → failure`: приватный атом `flagsFetchFailedAtom` помечает, что предыдущая загрузка уже упала, и повторные падения (в том числе на каждый `AppState → 'active'`) молчат. Успешная загрузка сбрасывает флаг, поэтому после восстановления новая ошибка снова покажет тост один раз. Это та же схема, что в `shared/model/network` (`serverErrorShownAtom`), — она защищает от «нагнетания» тостов при постоянном сбое бэкенда. Первая загрузка при недоступном бэкенде тост покажет: пользователь должен понимать, почему гейтед-табы закрыты.

### `useFeatureFlagsRefetchOnForeground()`

Хук без параметров, вызывается один раз на всё время жизни приложения (в `app/_RootLayout.tsx` рядом с прочими lifecycle-хуками). Подписывается на `AppState` и при переходе в `'active'` вызывает `fetchMyFeatureFlags` через `useAction`. Проверки токена нет — анонимный возврат в foreground тоже рефетчит и подтягивает глобальное состояние флагов. Никакого polling'а и интервалов нет.

Это закрывает случаи, которые не покрывает стартовая загрузка:

1. **Транзиентная ошибка сети на старте** — атом остаётся `null`; следующий возврат в foreground повторяет запрос.
2. **Токен изменился после старта** (вход/выход) — это уже закрывает рефетч внутри `signIn`/`signOut` (см. «Триггеры загрузки»); foreground остаётся страховкой, если смена токена произошла вне этих экшенов.
3. **Глобальное состояние флага изменилось** (в т.ч. для анонима) — возврат в foreground подтягивает актуальные значения.

### `useFeatureFlag(key)`

```ts
const [flags] = useAtom(featureFlagsAtom)
return flags?.[key] ?? false
```

**Семантика (безопасный дефолт):** пока `featureFlagsAtom === null` (флаги ещё не загружены / ошибка) и для отсутствующего ключа — `false`. То есть гейтед-табы по умолчанию закрыты и открываются только по явному `true` с сервера.

## Триггеры загрузки

Флаги загружаются в четырёх точках:

1. **Старт приложения** — `void fetchMyFeatureFlags(ctx)` модульно в `app/_layout.tsx` рядом с прочими стартовыми экшенами (`initServerUrlAction`, `loadHistoryAction`, …). Публичного пользовательского логина в приложении пока нет, поэтому флаг грузится на старте всегда: аноним получает глобальное состояние, а если access-токен уже есть — персональные флаги (заголовок подставляет axios-интерцептор).
2. **Возврат в foreground** — хук `useFeatureFlagsRefetchOnForeground` (`entities/feature-flags/lib`), смонтированный в `app/_RootLayout.tsx`. Повторяет запрос при `AppState → 'active'`, закрывая транзиентные сетевые сбои, изменения глобального состояния и появление токена после старта.
3. **Успешный вход** — `signIn` (`entities/auth/lib/signIn.ts`) после сохранения токенов вызывает `void fetchMyFeatureFlags(ctx)` (через `@x/auth`-точку среза). Axios-интерцептор тут же подставляет свежий access-токен, поэтому атом сразу получает **персональный** срез — без ожидания foreground.
4. **Выход** — `signOut` (`entities/auth/lib/signOut.ts`) после очистки токенов так же рефетчит флаги: запрос уходит анонимно, и атом возвращается к **глобальному** срезу, а не сохраняет персональные флаги вышедшего пользователя.

Вход/выход и рефетч флагов связаны в одном экшене намеренно: `signIn`/`signOut` — единственная точка смены токена, поэтому все call-sites (`AdminLoginScreen`, `SettingsHeaderMenu`, `AdminQuickActions`) получают актуальные флаги автоматически. Связь оформлена кросс-импортом `entities/feature-flags/@x/auth` (FSD `@x` для связей одного слоя, см. [architecture.md](../architecture.md) → «@x cross-import»), а не через публичный barrel `feature-flags`.

## Гейтинг табов

Гейтинг реализован в двух местах:

1. **`src/widgets/tab-bar/ui/useTabPress.ts`** — видимая блокировка таба:
   - `useTabPress` вызывает `useFeatureFlag('read')` и `useFeatureFlag('study')` и строит `isTabAvailable(routeName)`.
   - `handleTabPress` для недоступного таба показывает прежний диалог «Скоро будет доступно» (`showInfo`) и **не** навигирует; для доступного — обычная навигация.
   - `CustomTabBar` использует `isTabAvailable` для `isDisabled` кнопки таба.
2. **Экраны** — защитный guard на случай прямого перехода:
   - `ReadScreen` (`src/pages/read/ui/ReadScreen.tsx`) — `useFeatureFlag('read')`, при `false` рендерит `null`.
   - `StudyScreen` (`src/pages/study/ui.tsx`) — `useFeatureFlag('study')`, при `false` рендерит `null`.

Пока флаги не загружены, поведение табов идентично прежнему (оба заблокированы). Когда `read`/`study` включён — таб открывается и рендерит существующий экран (`ReadScreen`/`StudyScreen`), который пока остаётся заглушкой/каркасом (см. [screens/read.md](../screens/read.md), [screens/study.md](../screens/study.md)).

## Админ-UI управления флагами

Таб «Флаги» в `/admin` (только роль admin — эндпоинты `/feature-flags` под админ-токеном; таб скрыт для не-admin, экраны под `useRequireAdminRole`). Экраны: [screens/admin-flags.md](../screens/admin-flags.md). Срезы `pages/admin-flags` (список), `pages/admin-flag-detail` (деталь + исключения), `pages/admin-flag-form` (create/edit).

- **Список** (`GET /feature-flags`): простой `FlatList` без пагинации/поиска (флагов мало); название, ключ, бейдж глобального состояния; тихое обновление при возврате на экран; скелетон-строки `AdminFlagRow.Skeleton`.
- **Форма** (`POST /feature-flags`, `PATCH /feature-flags/{id}`): ключ (только create; паттерн `^[a-z][a-z0-9-]*$`), название, тумблер «Включён». Ключ неизменяем в edit (read-only, в тело не шлётся). Сервер создаёт флаг **выключенным** (`CreateFeatureFlagRequest` без `enabled`) — если тумблер включён, после создания форма досылает `PATCH { enabled: true }`. Кнопка «Сохранить» в шапке (`useAdminFormHeader`), disabled пока форма не изменена (`omitEqualFields`).
- **Удаление** (`DELETE /feature-flags/{id}`): подтверждение `ConfirmDialog` в шапке детали (`useAdminDetailHeader`).
- **Исключения** (`GET`/`PUT`/`DELETE /feature-flags/{id}/overrides...`): на детали флага — блок существующих исключений (пользователь, значение «Включён»/«Исключён», дата создания) + поиск пользователей и **один тумблер эффективного состояния** в каждой строке. Тумблер показывает эффективное состояние: `grant` → ON, `deny` → OFF, без исключения → глобальное `enabled`. По флипу вычисляется минимальное действие (`resolveOverrideAction`): желаемое совпало с глобальным → `DELETE` (наследуем глобальное), иначе `PUT` с `grant`/`deny`. Подпись рядом с тумблером показывает «Включено»/«Выключено», а при наличии явного исключения добавляет пометку «исключение» — так админ отличает «включён глобально» от «включён grant-исключением». Список читается `featureFlagsControllerFindOverrides` (`GET /feature-flags/{id}/overrides`; пустой список — валидный ответ) и перезагружается после каждой успешной мутации, поэтому тумблер и блок существующих исключений остаются в синке. `useFlagOverrides` секвенирует запросы: новый запрос (фокус или мутация) отменяет предыдущий через `AbortController`, поэтому устаревший ответ не перезатирает свежие данные (last-started-wins). При ошибке рефетча предыдущий список сохраняется, а над ним показывается инлайн-строка ошибки; полноэкранный текст ошибки — только когда данных нет.
- **Отдельного `GET /feature-flags/{id}` нет** — деталь и форма edit выбирают флаг из общего списка `GET /feature-flags`.

## API

`GET /feature-flags/me` → `EffectiveFeatureFlagListResponse` `{ flags: [{ key, enabled }] }`. Аутентификация опциональна: без токена (или с невалидным/просроченным) — глобальное состояние флагов; с валидным токеном — эффективные флаги по единому правилу `(глобально включён И нет deny-исключения) ИЛИ grant-исключение`. Правило одинаково для всех ролей, включая admin и moderator (админ-байпаса нет). Админ-управление (только admin): `GET /feature-flags`, `POST /feature-flags`, `PATCH /feature-flags/{id}`, `DELETE /feature-flags/{id}`, `GET /feature-flags/{id}/overrides`, `PUT`/`DELETE /feature-flags/{id}/overrides/{userId}`. Подробнее — [contracts/rest-api.md](../contracts/rest-api.md).

## Тесты

- `src/entities/feature-flags/lib/useFeatureFlag.test.tsx` — null → false, загруженные `true`/`false`, отсутствующий ключ.
- `src/entities/feature-flags/lib/useFeatureFlagsRefetchOnForeground.test.tsx` — рефетч на `AppState → 'active'` (в том числе без токена) и отсутствие запроса на неактивных состояниях.
- `src/entities/feature-flags/model.test.ts` — запрос без токена (глобальные флаги), преобразование списка, обработка ошибки (тост вместо глобальной модалки, без `reportError`), дедупликация тоста при повторных падениях и повторный тост после восстановления.
- `src/entities/auth/lib/signIn.test.ts` — рефетч флагов после успешного входа и его отсутствие при отказе в доступе/ошибке запроса.
- `src/entities/auth/lib/signOut.test.ts` — рефетч флагов после выхода, в том числе когда серверная ревокация падает.
- `src/widgets/tab-bar/ui/useTabPress.test.ts` — таб открывается по флагу, заблокирован без флага.
- `src/pages/read/ui/ReadScreen.test.tsx`, `src/pages/study/ui.test.tsx` — экран рендерит контент при включённом флаге и ничего при выключенном.
- `src/pages/admin-flags/lib/useAdminFlags.test.tsx`, `ui/AdminFlagsScreen.test.tsx` — список: загрузка, фокус-обновление, навигация, пустое состояние.
- `src/pages/admin-flag-form/lib/useFlagFormController.test.tsx`, `ui/AdminFlagCreateScreen.test.tsx` — create/update, двухшаговое включение, валидация ключа.
- `src/pages/admin-flag-detail/lib/overrideAction.test.ts` — эффективное состояние (grant/deny/без исключения) и минимальное действие для всех четырёх комбинаций «желаемое × глобальное» (grant/deny/clear).
- `src/pages/admin-flag-detail/lib/useAdminFlagDetail.test.tsx`, `ui/AdminFlagDetailScreen.test.tsx` — выбор флага из списка, тумблер эффективного состояния (grant/deny/clear по глобальному значению), удаление; чтение и показ существующих исключений (имя пользователя, значение, дата), пометка «исключение» в подписи тумблера, пустой список и ошибка загрузки; сохранение устаревшего списка с инлайн-ошибкой при провале рефетча.
- `src/pages/admin-flag-detail/lib/useFlagOverrides.test.tsx` — загрузка списка исключений, повторное чтение после мутации, пустой список, ошибка; отмена устаревшего запроса (last-started-wins), чтобы медленный ответ не перезатёр свежие данные.

## Связанные документы

- [screens/admin-flags.md](../screens/admin-flags.md) — экраны админ-управления флагами
- [state.md](./state.md) — Reatom-паттерны
- [navigation.md](./navigation.md) — табы и блокировка
- [contracts/rest-api.md](../contracts/rest-api.md) — эндпоинты

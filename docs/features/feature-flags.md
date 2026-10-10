# Фича-флаги (Feature flags)

**Слой:** `entities/feature-flags` (клиентский гейтинг) + `pages/admin-flags` / `pages/admin-flag-detail` / `pages/admin-flag-form` (админ-UI)
**Статус:** готов

## Что делает

Клиентская проверка эффективных фича-флагов пользователя. Табы «Читать» и «Учиться» открываются только если соответствующий флаг (`read` / `study`) включён для текущего пользователя.

## Срез `entities/feature-flags`

| Файл                    | Экспорт                                | Назначение                 |
| ----------------------- | -------------------------------------- | -------------------------- |
| `model.ts`              | `featureFlagsAtom`, `fetchMyFeatureFlags` | состояние и загрузка флагов |
| `lib/useFeatureFlag.ts` | `useFeatureFlag(key)`                  | доступ к значению флага    |
| `lib/useFeatureFlagsRefetchOnForeground.ts` | `useFeatureFlagsRefetchOnForeground()` | рефетч флагов при возврате в foreground |
| `index.ts`              | `fetchMyFeatureFlags`, `useFeatureFlag`, `useFeatureFlagsRefetchOnForeground` | публичный API среза        |

### `featureFlagsAtom`

`atom<null | Record<string, boolean>>(null, 'featureFlagsAtom')` — карта «ключ флага → включён».

- `null` — флаги **не загружены** (нет токена, запрос в полёте, ошибка).
- Загруженное значение — `Record<string, boolean>`.

### `fetchMyFeatureFlags`

Экшен (`action`) вызывает `GET /feature-flags/me` через `featureFlagsApi.getFeatureFlags().featureFlagsControllerGetEffectiveForMe()`.

1. **Guard:** читает access-токен (`secureTokenStorage.getAccessToken()`); без токена — выходит, атом остаётся `null` (анонимному пользователю флаги не нужны).
2. Преобразует список `[{ key, enabled }]` в `Record<string, boolean>` (`Object.fromEntries`).
3. Записывает карту в `featureFlagsAtom` через `ctx.schedule`.
4. При ошибке — `console.error` + `reportError`, атом остаётся `null` (доступ не открывается).

### `useFeatureFlagsRefetchOnForeground()`

Хук без параметров, вызывается один раз на всё время жизни приложения (в `app/_RootLayout.tsx` рядом с прочими lifecycle-хуками). Подписывается на `AppState` и при переходе в `'active'` вызывает `fetchMyFeatureFlags` через `useAction`. Токен-guard остаётся внутри экшена, поэтому для анонима возврат в foreground — тихий no-op (без запроса и без ошибки). Никакого polling'а и интервалов нет.

Это закрывает два случая, которые не покрывает стартовая загрузка:

1. **Транзиентная ошибка сети на старте** — атом остаётся `null`; следующий возврат в foreground повторяет запрос.
2. **Токен появился после старта** (вход пользователя, включая admin/moderator) — флаги подтягиваются при следующем возврате в foreground, без перезапуска приложения.

### `useFeatureFlag(key)`

```ts
const [flags] = useAtom(featureFlagsAtom)
return flags?.[key] ?? false
```

**Семантика (безопасный дефолт):** пока `featureFlagsAtom === null` (флаги не загружены / аноним / ошибка) и для отсутствующего ключа — `false`. То есть гейтед-табы по умолчанию закрыты и открываются только по явному `true` с сервера.

## Триггер загрузки

`void fetchMyFeatureFlags(ctx)` — модульно в `app/_layout.tsx` рядом с прочими стартовыми экшенами (`initServerUrlAction`, `loadHistoryAction`, …). Публичного пользовательского логина в приложении пока нет, поэтому флаг грузится на старте приложения и только при наличии access-токена (guard внутри экшена).

Стартовая загрузка дополняется рефетчем при возврате в foreground — хук `useFeatureFlagsRefetchOnForeground` (`entities/feature-flags/lib`), смонтированный в `app/_RootLayout.tsx`. Он повторяет запрос при `AppState → 'active'`, закрывая транзиентные сетевые сбои и случай появления токена после старта.

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
- **Исключения** (`PUT`/`DELETE /feature-flags/{id}/overrides/{userId}`): на детали флага — поиск пользователей и действия grant/deny/clear по каждому. **Сервер не отдаёт список существующих исключений и эффективное состояние для пользователя**, поэтому показать их нельзя — доступна только запись, результат подтверждается тостом (ограничение в [debt.md](../debt.md)).
- **Отдельного `GET /feature-flags/{id}` нет** — деталь и форма edit выбирают флаг из общего списка `GET /feature-flags`.

## API

`GET /feature-flags/me` → `EffectiveFeatureFlagListResponse` `{ flags: [{ key, enabled }] }` (bearer). admin/moderator всегда видят все флаги включёнными. Админ-управление (только admin): `GET /feature-flags`, `POST /feature-flags`, `PATCH /feature-flags/{id}`, `DELETE /feature-flags/{id}`, `PUT`/`DELETE /feature-flags/{id}/overrides/{userId}`. Подробнее — [contracts/rest-api.md](../contracts/rest-api.md).

## Тесты

- `src/entities/feature-flags/lib/useFeatureFlag.test.tsx` — null → false, загруженные `true`/`false`, отсутствующий ключ.
- `src/entities/feature-flags/lib/useFeatureFlagsRefetchOnForeground.test.tsx` — рефетч на `AppState → 'active'`, отсутствие запроса без токена и на неактивных состояниях.
- `src/entities/feature-flags/model.test.ts` — guard без токена, преобразование списка, обработка ошибки.
- `src/widgets/tab-bar/ui/useTabPress.test.ts` — таб открывается по флагу, заблокирован без флага.
- `src/pages/read/ui/ReadScreen.test.tsx`, `src/pages/study/ui.test.tsx` — экран рендерит контент при включённом флаге и ничего при выключенном.
- `src/pages/admin-flags/lib/useAdminFlags.test.tsx`, `ui/AdminFlagsScreen.test.tsx` — список: загрузка, фокус-обновление, навигация, пустое состояние.
- `src/pages/admin-flag-form/lib/useFlagFormController.test.tsx`, `ui/AdminFlagCreateScreen.test.tsx` — create/update, двухшаговое включение, валидация ключа.
- `src/pages/admin-flag-detail/lib/useAdminFlagDetail.test.tsx`, `ui/AdminFlagDetailScreen.test.tsx` — выбор флага из списка, grant/deny/clear, удаление.

## Связанные документы

- [screens/admin-flags.md](../screens/admin-flags.md) — экраны админ-управления флагами
- [state.md](./state.md) — Reatom-паттерны
- [navigation.md](./navigation.md) — табы и блокировка
- [contracts/rest-api.md](../contracts/rest-api.md) — эндпоинты
- [debt.md](../debt.md) — отсутствие чтения исключений

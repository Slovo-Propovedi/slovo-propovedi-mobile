# Фича-флаги (Feature flags)

**Слой:** `entities/feature-flags`
**Статус:** готов (клиентская часть; админ-UI управления флагами — отдельная фаза)

## Что делает

Клиентская проверка эффективных фича-флагов пользователя. Табы «Читать» и «Учиться» открываются только если соответствующий флаг (`read` / `study`) включён для текущего пользователя.

## Срез `entities/feature-flags`

| Файл                    | Экспорт                                | Назначение                 |
| ----------------------- | -------------------------------------- | -------------------------- |
| `model.ts`              | `featureFlagsAtom`, `fetchMyFeatureFlags` | состояние и загрузка флагов |
| `lib/useFeatureFlag.ts` | `useFeatureFlag(key)`                  | доступ к значению флага    |
| `index.ts`              | `fetchMyFeatureFlags`, `useFeatureFlag` | публичный API среза        |

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

### `useFeatureFlag(key)`

```ts
const [flags] = useAtom(featureFlagsAtom)
return flags?.[key] ?? false
```

**Семантика (безопасный дефолт):** пока `featureFlagsAtom === null` (флаги не загружены / аноним / ошибка) и для отсутствующего ключа — `false`. То есть гейтед-табы по умолчанию закрыты и открываются только по явному `true` с сервера.

## Триггер загрузки

`void fetchMyFeatureFlags(ctx)` — модульно в `app/_layout.tsx` рядом с прочими стартовыми экшенами (`initServerUrlAction`, `loadHistoryAction`, …). Публичного пользовательского логина в приложении пока нет, поэтому флаг грузится на старте приложения и только при наличии access-токена (guard внутри экшена). Рефетч после входа пользователя — в [debt.md](../debt.md).

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

## API

`GET /feature-flags/me` → `EffectiveFeatureFlagListResponse` `{ flags: [{ key, enabled }] }` (bearer). admin/moderator всегда видят все флаги включёнными. Подробнее — [contracts/rest-api.md](../contracts/rest-api.md).

## Тесты

- `src/entities/feature-flags/lib/useFeatureFlag.test.tsx` — null → false, загруженные `true`/`false`, отсутствующий ключ.
- `src/entities/feature-flags/model.test.ts` — guard без токена, преобразование списка, обработка ошибки.
- `src/widgets/tab-bar/ui/useTabPress.test.ts` — таб открывается по флагу, заблокирован без флага.
- `src/pages/read/ui/ReadScreen.test.tsx`, `src/pages/study/ui.test.tsx` — экран рендерит контент при включённом флаге и ничего при выключенном.

## Связанные документы

- [state.md](./state.md) — Reatom-паттерны
- [navigation.md](./navigation.md) — табы и блокировка
- [contracts/rest-api.md](../contracts/rest-api.md) — эндпоинты
- [debt.md](../debt.md) — рефетч при входе

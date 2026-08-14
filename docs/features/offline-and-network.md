# Офлайн и сеть

**Слой:** `shared/lib/network`, `shared/model/network`, `shared/lib/sections-cache`, `widgets/network-status`
**Статус:** готов

## Мониторинг сети

- `subscribeToNetwork` (`src/shared/lib/network/networkSubscription.ts`) — подписка на `@react-native-community/netinfo`; на каждое изменение пишет `isOnlineAtom` (`src/shared/model/network.ts`). Вызывается модульно в `app/_RootLayout.tsx`.
- `NetworkBanner` (`src/widgets/network-status/ui/NetworkBanner.tsx`) — пилюля «Офлайн» поверх экрана (`testID='network-banner'`); появляется при `!isOnline`, анимация разворота — `useNetworkIslandAnimation.ts`. При возврате онлайн скрывается.

## Доступность сервера

`src/shared/model/network.ts`:

- `serverUnreachableAtom` — сервер не ответил;
- `reportServerUnreachable(ctx)` — устанавливает флаг (только один раз за «эпизод» сбоя, авто-сброс через 4с);
- `reportServerReachable(ctx)` — сбрасывает флаг.

`ServerErrorToast` (`src/widgets/network-status/ui/ServerErrorToast.tsx`) — тост «Сервер недоступен», виден когда `isOnline && serverUnreachable`.

**Интеграция с Axios** — `src/shared/api/axiosInstance.ts`:

- response-interceptor: успех → `reportServerReachable(ctx)`; сетевая ошибка (нет `error.response`) → `reportServerUnreachable(ctx)`.
- Дополнительно: request-interceptor добавляет `Bearer`-токен, 401 → `performTokenRefresh` → повтор запроса; при провале refresh токены очищаются.

## Офлайн-повтор запроса

`useOfflineRetry` (`src/shared/lib/network/useOfflineRetry.ts`) — перезапрос данных при возврате онлайн, при выходе приложения в foreground и по фиксированному интервалу (5с без кэша / 30с с кэшем — `src/shared/lib/network/constants.ts`). Принимает `fetchFn`, `hasCachedData`, `isLoading`, `needsRetry`.

## Кэш секций

`src/shared/lib/sections-cache/` — `getCachedSections` / `setCachedSections`, ключ `CACHED_SECTIONS` (`src/shared/config/cache-storage-keys.ts`).

Поток `fetchAllSections` (`src/pages/listen/model.ts`):

1. запрос `sectionsApi.getSections().sectionControllerFindAll()` (сеть);
2. при сетевой ошибке — чтение кэша (`getCachedSections`), источник `'cache'`;
3. успешный сетевой ответ всегда пишется в кэш (fire-and-forget `setCachedSections`).

Источник фиксируется в `sectionDataSourceAtom` (`'cache' | 'network' | 'unknown'`). На главном экране `useOfflineRetry` (в `src/pages/listen/`) перезапрашивает, если последний ответ был не из сети.

### Механизм `useOfflineRetry`

`src/shared/lib/network/useOfflineRetry.ts` — использует refs (`fetchFnRef`, `needsRetryRef`, `isLoadingRef`) и `inflightRef` для защиты от дублирующих параллельных запросов. Три триггера:

1. возврат в **foreground** (`AppState` → `'active'`);
2. восстановление **connectivity** (`isOnline` стал `true`);
3. **polling** по интервалу (только в foreground): 5с (`RETRY_INTERVAL_NO_DATA_MS`) или 30с (`RETRY_INTERVAL_CACHED_MS`) в зависимости от `hasCachedData`.

## Кэш поиска проповедей

`src/features/sermon-search/lib/searchCache.ts` — `getCachedSearchResults` / `setCachedSearchResults`, ключи `cachedSermonSearch:<query>` + индекс `cachedSermonSearch:index` (`src/shared/config/cache-storage-keys.ts`). Ключ запроса нормализуется (`trim` + `toLowerCase`); пустые результаты не кэшируются; индекс хранит до 30 последних ключей, при переполнении самые старые удаляются (`AsyncStorage.multiRemove`). Универсальные обёртки — `src/shared/lib/cache/` (`getCachedJson` / `setCachedJson`).

Поток `fetchSearchResults` (`src/features/sermon-search/model.ts`):

1. запрос `sermonsApi.getSermons().sermonControllerFindAll({ search, take: 20 })` (сеть);
2. успешный ответ всегда пишется в кэш (fire-and-forget `setCachedSearchResults`);
3. при сетевой ошибке — чтение кэша (`getCachedSearchResults`); при непустом результате он показывается, иначе — пустое состояние «Ничего не найдено»;
4. защита от устаревших ответов: кэш-фолбэк применяется, только если `requestId === latestRequestId` (медленное чтение кэша не перезаписывает более свежий поиск).

`useOfflineRetry` для поиска **не** используется (нет UI-индикатора источника данных — см. `docs/debt.md`).

## Кэш аудио

Офлайн-прослушивание обеспечивает кэш аудио — [audio-cache.md](./audio-cache.md). При старте трека `AudioLoader` сначала берёт закэшированный файл, иначе стартует фоновое кэширование.

## Поток: offline ↔ online

- **Offline:** `NetInfo` → `isOnlineAtom = false` → показывается `NetworkBanner`; API-вызовы падают с сетевой ошибкой → `reportServerUnreachable` → `ServerErrorToast`; `fetchAllSections` показывает кэш секций; поиск проповедей показывает per-query кэш (`cachedSermonSearch:<query>`), если он есть; аудио играет из кэша.
- **Online:** `isOnlineAtom = true` → баннер скрывается; `useOfflineRetry` немедленно перезапрашивает данные; успешные ответы → `reportServerReachable`; поиск пишет свежие результаты в кэш.

### Различие баннера и тоста

- `NetworkBanner` — состояние **интернета** (`isOnlineAtom`, NetInfo). Показывается, когда устройство офлайн.
- `ServerErrorToast` — состояние **сервера** (`serverUnreachableAtom`). Показывается, когда интернет есть, но сервер не ответил. `reportServerUnreachable` не срабатывает при `!isOnline`, чтобы не дублировать баннер.

### Экраны и widgets

- `widgets/network-status` — `NetworkBanner`, `ServerErrorToast`, `useNetworkIslandAnimation` (анимация пилюли). Экспорт — `src/widgets/network-status/index.ts`.
- Оба виджета рендерятся в корневом стеке `app/_RootLayout.tsx` поверх навигации и не перекрывают контент (position: absolute, zIndex 100).
- Внешние зависимости: `@react-native-community/netinfo` (мониторинг), `expo-file-system` + `shared/lib/audio-cache` (офлайн-аудио).

### Константы повторов

`src/shared/lib/network/constants.ts`:

- `RETRY_INTERVAL_NO_DATA_MS = 5_000` — повтор каждые 5с, если кэша нет (нужны свежие данные);
- `RETRY_INTERVAL_CACHED_MS = 30_000` — повтор каждые 30с, если показывается кэш (меньше нагрузки).

## Связанные документы

- [state.md](./state.md) — атомы сети (`isOnlineAtom`, `serverUnreachableAtom`)
- [audio-cache.md](./audio-cache.md) — кэш аудио
- [storage.md](../contracts/storage.md) — ключи `cachedSections` и `cachedSermonSearch:*`
- [../screens/listen.md](../screens/listen.md) — офлайн-состояние главного экрана

# Экран плейлиста

**Маршрут:** `/listen/playlist?playlist=<PlaylistData JSON>`
**Файлы:** `app/(tabs)/listen/playlist.tsx` → `export { PlaylistScreen as default }` из `pages/playlist`
**Статус:** готов

## Что делает

Показывает один плейлист: обложку, название, описание, кнопку «Слушать всё» и список треков (проповедей). Поддерживает скачивание плейлиста целиком через контекст-меню.

## Что показывается

- Схлопывающаяся шапка (`PlaylistHeader`, `src/pages/playlist/ui/PlaylistHeader.tsx` + `useCollapsingHeader` из `src/pages/playlist/lib/useCollapsingHeader.ts`).
- Кнопка «Слушать всё» (`PlaylistHeader` → `handlePressPlayAll`).
- Список треков `TracksList`/`PlaylistTrackItem` (`src/pages/playlist/ui/PlaylistTrackItem.tsx`) с иконками «играет»/«кэш» и контекст-меню. Под заголовком каждого трека — подпись «книга глава:стихи» (например «Бытие 1:1-5»); автор в списке не показывается — он вынесен в оверлей «Подробнее» полноэкранного плеера. Формируется через `formatSermonReference` из `src/shared/lib/format/formatSermonReference.ts`; в ходе миграции на спецификацию API v0.15.1 форматтер расширяется на диапазоны глав/стихов (см. [contracts/rest-api.md](../contracts/rest-api.md) → «Главы и стихи»).
- Индикаторы скачивания: прогресс плейлиста, системные уведомления (`src/pages/playlist/lib/PlaylistCacheNotifications.ts`, `notificationConstants.ts`).
- Статус-бар и цвет иконок шапки адаптируются к скроллу (`usePlaylistHeader`, `usePlaylistNavigationOptions`).

## Откуда данные

- Параметр маршрута `playlist` (`useLocalSearchParams<{ playlist: string }>`), парсится через `getParseJsonWithSchema(playlistDataSchema)`; при отсутствии/ошибке используется пустой плейлист-заглушка.
- Плеер: `currentAudioAtom`, `isPlayingAtom`, `downloadingAudioUrlAtom`, `usePlayNewSermon` из `entities/player`.
- Кэш: `cacheUpdateTriggerAtom` (`shared/lib/cache-triggers`), `isCachingPlaylistAtom`/`playlistCacheProgressAtom` из `src/pages/playlist/model.ts`.
- Скачивание: `PlaylistCacheService` (`src/pages/playlist/lib/PlaylistCacheService.ts`), меню `PlaylistCacheMenu`/`PlaylistCacheMenuDropdown` (`src/pages/playlist/ui/`).

## Куда можно перейти

- Тап на трек с `audioUrl` → `usePlayNewSermon({ playlist, sermon })` — запуск в плеере и открытие полноэкранного плеера.
- «Слушать всё» → запуск первого трека с `audioUrl`.

## Состояния

- Загрузка: данные приходят из параметра маршрута (загрузка как таковая отсутствует).
- Пусто: `ListEmptyComponent` — «В плейлисте нет записей».
- Офлайн: зависит от кэша треков (`cacheTrigger`); скачивание в офлайне недоступно.
- Ошибка: некорректный JSON плейлиста → заглушка; ошибки скачивания логируются и отображаются через диалоги/уведомления.

## Связанные документы

- [features/player.md](../features/player.md)
- [features/audio-cache.md](../features/audio-cache.md)
- [screens/listen.md](./listen.md)

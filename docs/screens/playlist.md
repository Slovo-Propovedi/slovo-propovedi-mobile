# Экран плейлиста

**Маршрут:** `/listen/playlist?playlist=<PlaylistData JSON>`
**Файлы:** `app/(tabs)/listen/playlist.tsx` → `export { PlaylistScreen as default }` из `pages/playlist`
**Статус:** готов

## Что делает

Показывает один плейлист: обложку (при отсутствии artwork — фолбэк-обложка иконкой приложения, `IMAGE_PLACEHOLDER`), название, описание, кнопку «Слушать всё» и список треков (проповедей). Поддерживает скачивание плейлиста целиком через контекст-меню.

## Что показывается

- Схлопывающаяся шапка (`PlaylistHeader`, `src/pages/playlist/ui/PlaylistHeader.tsx` + `useCollapsingHeader` из `src/pages/playlist/lib/useCollapsingHeader.ts`). Обложка шапки — через `CoverImage` (eager, фолбэк `IMAGE_PLACEHOLDER`), поверх — блюр 70% (`BlurView` из `expo-blur`, `tint='dark'`) и затемняющий оверлей (`COLORS.black`, opacity 0.3) под заголовком. На Android блюр не работает без `blurTarget`: обложка обёрнута в `BlurTargetView` с `ref`, который передаётся в `BlurView` (`blurMethod='dimezisBlurViewSdk31Plus'` — реальный блюр на Android 12+, на более старых версиях тихий фолбэк на полупрозрачную заливку без блюра).
- Кнопка «Слушать всё» (`PlaylistHeader` → `handlePressPlayAll`).
- Список треков `TracksList`/`PlaylistTrackItem` (`src/pages/playlist/ui/PlaylistTrackItem.tsx`) с иконками «играет»/«кэш» и контекст-меню; обложка трека рендерится через `TracksListItem` (`shared/ui/track-list`, `CoverImage` с фолбэком `IMAGE_PLACEHOLDER`). Каждый трек показывает тонкую полосу прогресса прослушивания (сохранённая позиция из `entities/listening-history` через `useHistoryProgressMap`); полоса обновляется **только по событиям** (старт, пауза/flush, переключение, завершение, удаление) — без live-тикания в реальном времени (live-чтение убрано). Завершённые треки (`progress >= 1`) затемняются (`TracksListItemContent`: обложка opacity 0.5 + приглушённый заголовок, см. [features/listening-history.md](../features/listening-history.md) → «Затемнение завершённых»). Контекст-меню трека (`usePlaylistActions.buildMenuActions`) содержит пункты истории из `buildHistoryMenuActions`: **«Пометить прослушанной»** (для незавершённых) и **«Удалить из истории»** (если проповедь в истории). Под заголовком каждого трека — подпись «книга глава:стихи» (например «Бытие 1:1-5»); автор в списке не показывается — он вынесен в оверлей «Подробнее» полноэкранного плеера. Формируется через `formatSermonReference` из `src/shared/lib/format/formatSermonReference.ts`; в ходе миграции на спецификацию API v0.15.1 форматтер расширяется на диапазоны глав/стихов (см. [contracts/rest-api.md](../contracts/rest-api.md) → «Главы и стихи»).
- Индикаторы скачивания: прогресс плейлиста, системные уведомления (`src/pages/playlist/lib/PlaylistCacheNotifications.ts`, `notificationConstants.ts`). Итог скачивания: при полном успехе — «Скачано N проповедей»; при частичной неудаче — уведомление ошибки с текстом «Не удалось скачать X из N» (неудачные треки остаются с иконкой «облако»); при потере сети посреди прогона — прогон прерывается, уведомление «Нет подключения к интернету» (трактуется как сетевая ошибка — без алерта `playlistCacheErrorAtom`). **Отменённый прогон не показывает уведомлений** (остановка через «Остановить кеширование» — тихая).
- Меню шапки (`PlaylistHeaderMenu`/`PlaylistHeaderMenuDropdown`, `src/pages/playlist/ui/`): пункты кэша — во время кеширования «Закешировать все» сменяется на **«Остановить кеширование»** (иконка `stop-circle-outline`), который живёт на месте «Закешировать все» и **всегда активен — включая офлайн** (отмена не требует сети). Подмена реактивная по атому `isCachingPlaylistAtom`. После остановки: активная закачка прерывается только если она принадлежит исключительно этому прогону (иностранные джойнеры manual/auto не задеваются), run-контроллер прерывается, оставшиеся записи очереди очищаются. Пункты истории (`usePlaylistHistoryMenu`, `PlaylistHistoryDialogs`): **«Пометить все прослушанными»** (иконка `checkmark-done`, виден когда есть playable-проповедь не завершённая) и **«Удалить проповеди из истории»** (иконка `trash-outline`, виден когда хотя бы одна проповедь плейлиста есть в истории) — оба с диалогом подтверждения; массовые экшены `markSermonsListenedAction`/`removeSermonsFromHistoryAction` (см. [features/listening-history.md](../features/listening-history.md) → «Массовые операции плейлиста»).
- Пункт **«Удалить из кеша все»** дизейблится, когда `cachedCount === 0` **или** очередь непуста (реактивно по `cacheQueueAtom`) **или** есть идущая закачка (реактивно по `activeCacheUrlAtom`). Дополнительно press-time guard'ы `handleClearCacheOption`/`handleClearCacheConfirm` перепроверяют `hasInflightCacheDownloads()` (belt-and-suspenders на деструктивной очистке). От сети не зависит.
- **Глобальный стоп из развёрнутого плеера:** кеширование можно остановить не только из меню кэша плейлиста, но и из полноэкранного плеера — кнопка **«Остановить все закачки»** в правом верхнем углу (`HeaderOverlay` → `StopAllCachingButton` → `useStopAllCaching` → `cancelAllCacheDownloads`). Видна, когда очередь непуста или есть активная закачка; всегда активна, в т.ч. офлайн. Прерывает плейлист-прогон (тихо, без ложного «Скачано N из N»), отменяет активную закачку и дренирует очередь. Подробнее — [features/audio-cache.md](../features/audio-cache.md) → «Глобальный стоп».
- Статус-бар и цвет иконок шапки адаптируются к скроллу (`usePlaylistHeader`, `usePlaylistNavigationOptions`).

## Откуда данные

- Параметр маршрута `playlist` (`useLocalSearchParams<{ playlist: string }>`), парсится через `getParseJsonWithSchema(playlistDataSchema)`; при отсутствии/ошибке используется пустой плейлист-заглушка.
- Плеер: `currentAudioAtom`, `isPlayingAtom`, `downloadingAudioUrlAtom`, `usePlayNewSermon` из `entities/player`.
- Кэш: `cacheUpdateTriggerAtom` (`shared/lib/cache-triggers`), `isCachingPlaylistAtom`/`playlistCacheProgressAtom` из `src/pages/playlist/model.ts`.
- Скачивание: `PlaylistCacheService` (`src/pages/playlist/lib/PlaylistCacheService.ts`), меню `PlaylistHeaderMenu`/`PlaylistHeaderMenuDropdown` (`src/pages/playlist/ui/`).

## Куда можно перейти

- Тап на трек с `audioUrl` → `usePlayNewSermon({ playlist, sermon })` — запуск в плеере и открытие полноэкранного плеера. Повторный тап по тому же треку, пока запуск в полёте или в течение 1с после тапа, запустившего его, игнорируется (гард в `usePlayNewSermon`).
- «Слушать всё» → запуск первого трека с `audioUrl`.

## Состояния

- Загрузка: данные приходят из параметра маршрута (загрузка как таковая отсутствует).
- Пусто: `ListEmptyComponent` — «В плейлисте нет записей».
- Офлайн: зависит от кэша треков (`cacheTrigger`); скачивание в офлайне недоступно — перед каждым треком проверяется подключение (`waitForOnline`, до 60с, signal-aware), при его отсутствии прогон прерывается уведомлением «Нет подключения к интернету». Пункт «Закешировать все» в меню кэша дизейблится при офлайне **или** когда все треки уже закэшированы (`isCacheAllDisabled = allCached || !isOnline`); **во время кеширования меню не блокируется** — вместо «Закешировать все» показывается «Остановить кеширование» (активно и офлайн). «Удалить из кеша все» доступно офлайн (см. матрицу disabled выше).
- Ошибка: некорректный JSON плейлиста → заглушка; ошибки скачивания логируются и отображаются через диалоги/уведомления; одиночный трек ретраится (до 3 попыток, см. [features/audio-cache.md](../features/audio-cache.md)).

## Связанные документы

- [features/player.md](../features/player.md)
- [features/audio-cache.md](../features/audio-cache.md)
- [screens/listen.md](./listen.md)

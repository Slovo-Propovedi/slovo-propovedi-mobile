# Виджет плеера для Android (план)

**Слой:** планируется `widgets/player-widget` (UI + task handler) + нативный мост `modules/player-widget-bridge`
**Статус:** **ПЛАН, НЕ РЕАЛИЗОВАНО**

## Резюме

- Цель: home-screen виджет с обложкой/названием трека и кнопками play/pause (+ опционально seek ±10s, next).
- Оценка: 3–5 дней (вариант rnaw), 4–6 дней (полностью нативный RemoteViews — fallback).
- Статус: план, не реализовано.

## Текущее состояние проекта (что уже помогает)

- Плеер: `expo-audio` (`~57.0.5`), обёртка `src/entities/player/lib/PlayerService/index.native.ts` (singleton `playerService`).
- expo-audio уже поднимает Media3 `MediaSessionService` (`expo.modules.audio.service.AudioControlsService`, foreground, `mediaPlayback`) — объявлен в генерируемом манифесте; разрешения FOREGROUND_SERVICE, FOREGROUND_SERVICE_MEDIA_PLAYBACK, POST_NOTIFICATIONS, MODIFY_AUDIO_SETTINGS уже в `app.config.ts`.
- `AudioControlsService.onStartCommand` принимает explicit intent-экшены: `expo.modules.audio.action.PLAY / PAUSE / TOGGLE / SEEK_FORWARD / SEEK_BACKWARD` (seek ±10s). Именно так работают кнопки media-уведомления на Android ≤12 → кнопки виджета могут переиспользовать этот механизм напрямую, без MediaController handshake и без JS round-trip.
- Ограничение expo-audio: НЕТ нативных next/prev экшенов (`AudioMediaSessionCallback` намеренно удаляет COMMAND_SEEK_TO_NEXT/PREVIOUS) — очередь живёт в JS (`src/entities/player/ui/PlayerControls/usePlayerToggleTrack.ts`, `TrackAutoAdvanceService/`).
- Канонический тип метаданных: `LockScreenMetadata { title, artist?, albumTitle?, artworkUrl }` в `src/entities/player/lib/PlayerService/types.ts`; artwork обязан проходить `hasUriProtocol` (`src/shared/lib/app-icon.ts`, контракт `docs/contracts/native-modules.md`, Issue #45).
- Reatom-состояние для синхронизации: `currentAudioAtom`, `isPlayingAtom`, `positionAtom`, `durationAtom` в `src/entities/player/model.ts`.
- `playsInSilentMode: true` уже выставлен (`AudioModeManager.ts`) — иначе play с виджета игнорируется в беззвучном режиме.
- Паттерн локальных нативных модулей отработан: `modules/audio-effects`, `modules/apk-installer` (expo-module.config.json + build.gradle + requireNativeModule + graceful degradation + JVM-тесты через `yarn test:native`).
- Чего нет: никакой widget-инфраструктуры (ни AppWidgetProvider, ни Glance, ни config plugin), нет своих BroadcastReceiver/MediaButtonReceiver.

## Выбранный подход: react-native-android-widget (rnaw)

- Почему: Expo SDK 57 НЕ имеет собственного API для Android-виджетов (`expo-widgets` — iOS-only). rnaw (v0.22.1, активно поддерживается, peer expo >= 54) — единственный поддерживаемый вариант; есть свой config plugin (`app.plugin.js`) → совместим с prebuild.
- Ключевой факт: rnaw рендерит React-дерево В BITMAP, а не RemoteViews. Следствия: обновления относительно дорогие (пушить только при смене состояния, не каждый тик), возможны баги кроппинга на лаунчерах с некорректным size-reporting.
- Риск версии: rnaw dev-тестируется на RN 0.83 / Expo 54–55; наш SDK 57 = RN 0.86. Peers открытые, блокеров в issues нет, но заложить полдня на spike перед стартом.

## Архитектура

```
[Виджет UI] rnaw FlexWidget/TextWidget/ImageWidget (bitmap)
   │ статус: app JS подписан на статус плеера → requestWidgetUpdate при переходах
   │ состояния (play/pause/track change/lock-screen activation), НЕ каждый тик
   ▼
[Клики play/pause/seek] WIDGET_CLICK → widgetTaskHandler (headless JS)
   → локальный Expo module `player-widget-bridge.sendMediaCommand('toggle')`
   → Kotlin: context.startService(Intent(ACTION_TOGGLE на AudioControlsService))
   → сервис expo-audio управляет реальным плеером
[Клики next/prev] нативного экшена нет →
   widgetTaskHandler → bridge эмитит событие в app JS (Expo Modules sendEvent)
   → app JS вызывает playlist/queue next() → синк перерисовывает виджет
   Если app JS мёртв: next/prev — no-op; play/pause работают через service intents.
```

## План реализации (этапы)

1. **Spike (0.5 дня):** `yarn add react-native-android-widget`, минимальный статичный виджет на девайсе, проверка совместимости с RN 0.86 / flavors / prebuild.
2. **Регистрация виджета:** `app.config.ts` → `plugins: [['react-native-android-widget', { widgets: [{ name: 'Player', label, targetCellWidth: 4, targetCellHeight: 2, previewImage, updatePeriodMillis: 0 }] }]]`. `updatePeriodMillis: 0` — виджет медиа, пушит обновления сам (системный минимум — 30 мин, для плеера непригоден). Плюс запись в `docs/decisions.md` (новая зависимость — только через decisions по правилам репо).
3. **Кастомный entry-файл:** корневой `index.ts` + `"main": "index.ts"` в package.json: `import 'expo-router/entry'` + `registerWidgetTaskHandler(widgetTaskHandler)`. Единственная «хитрая» точка интеграции — проверить совместимость с jest/expo entry.
4. **UI виджета:** `src/widgets/player-widget/ui/PlayerWidget.tsx` (rnaw-примитивы, `clickAction="TOGGLE_PLAY"` и т.п.; соблюдать лимит 130 строк — разбить на title row / controls row).
5. **Task handler:** `src/widgets/player-widget/lib/widgetTaskHandler.ts` (WIDGET_ADDED/UPDATE/RESIZED/CLICK).
6. **Синхронизация состояния:** `src/widgets/player-widget/lib/syncPlayerWidget.ts` через `requestWidgetUpdate`; вызывать из переходов состояния плеера (play/pause/track change/`setActiveForLockScreen`), НЕ на каждый position tick.
7. **Нативный мост:** `modules/player-widget-bridge/` (Kotlin ~40–60 строк + expo-module.config.json + локальный config plugin в `plugins/`): `sendMediaCommand(cmd)` → `startService(ACTION_*)` на AudioControlsService; emit событий для next/prev. Добавить модуль в `yarn test:native`.
8. **Prebuild + сборка:** `npx expo prebuild --platform android --clean` → проверить `git status android/` → gradle build → закоммитить регенерированный `android/` в том же PR (политика AGENTS.md).
9. **QA:** Pixel Launcher + Samsung OneUI (кроппинг bitmap-рендера), повороты, темная тема (rnaw поддерживает с 0.19), TalkBack (с 0.20), поведение при убитом процессе.

## Грабли и осознанные компромиссы

- **Replace-in-place священен:** `replaceAudio` держит тот же AudioPlayer/MediaSession/notification ID; интеграция виджета не должна рвать сессию (см. `docs/features/player.md`).
- **Cold start:** при убитом процессе play/pause через сервис no-op (`currentPlayerRef == null`), next/prev — no-op (JS мёртв). Виджет в этом сценарии показывает последнее синхронизированное состояние. → записать в `docs/debt.md` при реализации.
- **`ACTION_PLAY` гейтится silent mode:** ок, т.к. у нас `playsInSilentMode: true`.
- **Нет lock-screen виджетов на Android** — эта поверхность и так занята MediaStyle-уведомлением expo-audio (`setActiveForLockScreen`), делать «виджет на локскрин» не нужно.
- **Битмап-рендеринг:** не рисовать progress bar с обновлением раз в секунду; обновления только по переходам состояния.
- **Валидация на JS→native границе:** artwork через `hasUriProtocol`, try-catch + `reportError` вокруг нативных вызовов (`docs/contracts/native-modules.md`, Issue #45).
- **Expo Go:** не работает (нужен dev build) — проект и так на prebuild-воркфлоу.
- **clickAction требует Android 7+** — для minSdk SDK 57 не проблема. Опционально: `requestPinWidget` (rnaw 0.22) — кнопка «Добавить виджет» из настроек приложения, зависит от лаунчера.

## Fallback: полностью нативный RemoteViews-виджет

Если bitmap-рендер rnaw не устроит (кроппинг/качество): Kotlin `AppWidgetProvider` + RemoteViews layout (~250 строк) + config plugin; кнопки через `PendingIntent.getService` с теми же `expo.modules.audio.action.*`; состояние — MediaController к существующей MediaSession или SharedPreferences-зеркало из bridge-модуля. Оценка 4–6 дней.

## Файлы-ориентиры

- `src/entities/player/lib/PlayerService/index.native.ts`, `native/LockScreenControls.ts`, `native/PlayerStatusListener.ts`, `native/TrackAutoAdvanceService/`
- `src/entities/player/model.ts`, `lib/usePlayer.ts`, `lib/usePlayerState.ts`
- `src/entities/player/ui/PlayerControls/usePlayerToggleTrack.ts`, `useAppStatePlayback.ts`
- `app.config.ts`, `plugins/withAndroidFlavors.ts`, `plugins/gradleSnippets.ts`
- `modules/audio-effects/*`, `modules/apk-installer/*` — шаблон нового нативного модуля
- `docs/features/player.md`, `docs/contracts/native-modules.md`, `docs/features/deep-links.md`

## Связанные документы

- [player.md](./player.md) — модель плеера, `PlayerService`, replace-in-place, lock-screen-метаданные
- [../contracts/native-modules.md](../contracts/native-modules.md) — граница JS→натив, `hasUriProtocol`, `reportError`
- [deep-links.md](./deep-links.md) — пример config plugin / prebuild-воркфлоу и per-flavor нюансы
- [../BUILD-LOCAL.md](../BUILD-LOCAL.md) — prebuild и config-плагины

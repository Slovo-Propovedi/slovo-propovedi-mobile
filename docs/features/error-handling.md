# Обработка ошибок и глобальный диалог

**Слой:** `shared/lib/error-utils`, `shared/model/error-dialog`, `shared/ui/error-dialog`
**Статус:** готов

## Механизм глобального диалога ошибок

Любая ошибка (фатальная, асинхронная или из сервиса) может быть показана пользователю
в модальном диалоге с возможностью **скопировать текст ошибки** и отправить разработчику.

### Состояние — `src/shared/model/error-dialog.ts`

- `globalErrorAtom` (`GlobalError | null`, поля `message` + `detail`) — текущая ошибка;
- `reportError(error, customMessage?)` — императивный репортер, вызывается откуда угодно
  (сервисы, слушатели, не-React код). Использует модульный Reatom-контекст из
  `shared/lib/reatom-ctx` (синглтон), поэтому не требует передачи `ctx` и не требует React;
- `dismissErrorAction(ctx)` — закрывает диалог (очищает атом).

`customMessage` — человекочитаемое описание на русском («что делали, когда упало»);
если не передано, берётся `error.message`.

`reportError` имеет overwrite-семантику: если за один инцидент сработали две ошибки,
в диалоге останется только последняя (очереди нет).

### Хелперы форматирования — `src/shared/lib/error-utils.ts`

- `getErrorMessage(error)` — `error.message` для Error, строка как есть, иначе «Неизвестная ошибка»;
- `getErrorDetail(error)` — `error.stack` для Error (фолбэк `error.message`), строка как есть, `JSON.stringify` для объектов, иначе «Нет деталей».

Раньше жили в `useErrorDialog.ts`, перенесены сюда, чтобы использовать их вне React.

### Отображение — `src/shared/ui/error-dialog/`

- `ErrorDialog.tsx` — презентационный Modal: иконка предупреждения, скроллируемое сообщение,
  моноширинные детали (selectable), кнопки «📋 Копировать» (expo-clipboard) и «Закрыть»;
- `GlobalErrorDialog.tsx` — читает `globalErrorAtom` через `useAtom`, дисмисс через
  `useAction(dismissErrorAction)`. Рендерится в корневом layout `app/_RootLayout.tsx`
  рядом с `NetworkBanner` / `ServerErrorToast` / `UpdateDialogRoot`;
- `GlobalErrorHandler.tsx` — подписка на глобальные сбои: `ErrorUtils.setGlobalHandler`
  (нативные фатальные ошибки, с сохранением оригинального обработчика) и
  `window.addEventListener('unhandledrejection')` (web). Все события идут в `reportError`.
  Сам ничего не рендерит (`return null`);
- `ErrorBoundary.tsx` — классовый boundary для ошибок рендера React; имеет собственный
  локальный `<ErrorDialog>` (state класса) с добавленным Component Stack в деталях.

### Локальный хук `useErrorDialog`

`src/shared/ui/error-dialog/useErrorDialog.ts` — независимое состояние на потребителя
(`showError` / `showErrorWithMessage` / `dismissError`). Используется точечно; глобальные
ошибки идут через `reportError`.

## Интеграция сервисов

Сервисы плеера и истории прослушивания при перехвате ошибок вызывают `console.error`
(для отладки) **и** `reportError(error, 'сообщение')` (для пользователя). Все call sites
импортируют `reportError` напрямую из `shared/model/error-dialog` (deep import) — осознанно,
чтобы избежать barrel-циклов с `shared/model`:

| Место                                                               | Сообщение                                                      |
| ------------------------------------------------------------------- | -------------------------------------------------------------- |
| `entities/listening-history/model/history.ts`                       | Не удалось загрузить историю прослушивания                     |
| `entities/listening-history/lib/historyStorage.ts`                  | Не удалось сохранить историю прослушивания                     |
| `entities/player/lib/PlayerService/PlaybackController.ts`           | Ошибка при перемотке аудио                                     |
| `entities/player/lib/initializePlayer.ts`                           | Ошибка при восстановлении плеера                               |
| `entities/player/lib/PlayerService/AudioLoader.ts` (load)           | Ошибка при загрузке аудио                                      |
| `entities/player/lib/PlayerService/AudioLoader.ts` (cache)          | Ошибка при проверке кэша аудио                                 |
| `entities/player/lib/PlayerService/TrackAutoAdvanceService`         | Ошибка при автоматическом переходе / завершении записи истории |
| `entities/player/lib/PlayerService/TrackAutoAdvanceService` (parse) | Не удалось прочитать данные проповеди/плейлиста из хранилища   |
| `entities/player/lib/PlayerService/index.web.ts`                    | Ошибка при воспроизведении аудио                               |
| `entities/player/lib/PlayerService/BackgroundCachingService`        | Ошибка при фоновом кэшировании аудио                           |
| `entities/player/lib/PlayerService/LockScreenControls.ts`           | Не удалось обновить данные плеера на экране блокировки         |
| `entities/player/ui/PlayerControls/PlayerControls.tsx`              | Ошибка при переключении воспроизведения                        |

Ошибки, связанные с AppState («activity is no longer available»), диалог не поднимают —
только `console.warn`.

### Известный источник ложных срабатываний `unhandledrejection` на web

На mobile-web (Android Chrome) медленная сеть могла поднимать ложное окно
«Произошла ошибка асинхронной операции» из-за `@expo/vector-icons` → `expo-font`
`Font.loadAsync`: async-отклонение шрифта (`FontObserver` 12-сек таймаут, крупные
TTF ~1.3 МБ) утекало как unhandled promise rejection, которое ловил
`GlobalErrorHandler`. Шрифт при этом всё равно загружался через `@font-face` CSS,
поэтому модалка была шумом. Исправлено патчем expo-font (глотает async-отклонение),
см. [`decisions.md`](../decisions.md) → «Патч expo-font». Фильтрация в `GlobalErrorHandler`
сознательно не добавлялась.

## Связанные документы

- [offline-and-network.md](./offline-and-network.md) — тосты/баннеры сети (отдельный механизм)
- [player.md](./player.md) — сервисы плеера, репортящие ошибки
- [listening-history.md](./listening-history.md) — история прослушивания

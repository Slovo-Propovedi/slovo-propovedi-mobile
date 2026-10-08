# Резервная копия настроек и локальных данных

Экспорт/импорт пользовательских данных в JSON-файл: история прослушивания, локальные плейлисты, настройки оформления секции, скалярные настройки приложения и плеера, настройки импорта аудио. Секция «Резервная копия» живёт на экране [«Настройки»](../screens/settings.md) (`BackupSection`).

**Файлы:**

- `src/features/settings-backup/index.ts` — публичный API (только `BackupSection`)
- `src/features/settings-backup/ui/BackupSection.tsx` — секция UI: папка, действия, автосинхронизация, диалоги
- `src/features/settings-backup/ui/useBackupSection.ts` — состояние и обработчики секции (выбор папки, экспорт)
- `src/features/settings-backup/ui/useBackupImport.ts` — импорт: чтение файла, выбор режима, подтверждение смены URL
- `src/features/settings-backup/ui/BackupImportModeDialog.tsx` — диалог «Объединить / Заменить»
- `src/features/settings-backup/ui/ServerUrlChangeDialog.tsx` — диалог подтверждения смены URL сервера
- `src/features/settings-backup/ui/useFolderAvailability.ts` — проверка доступности сохранённой папки
- `src/features/settings-backup/ui/useAutoBackupSync.ts` — debounced-триггер автосохранения (уход в фон)
- `src/features/settings-backup/model/backupPayload.ts` — `backupFileSchema`, типы `BackupFile` / `BackupImportData` / `BackupImportMode`
- `src/features/settings-backup/model/backupScalars.ts` — маркер и версия (`BACKUP_KIND`, `BACKUP_VERSION`), имена файлов, схемы скаляров
- `src/features/settings-backup/model/backupFolder.ts` — атомы `backupFolderUriAtom` / `backupAutosyncEnabledAtom`, ключи `backup_dir_uri` / `backup_autosync`
- `src/features/settings-backup/lib/buildPayload.ts` — сборка снимка для экспорта
- `src/features/settings-backup/lib/readScalars.ts` — чтение скаляров из AsyncStorage
- `src/features/settings-backup/lib/parseBackupFile.ts` — разбор недоверенного файла
- `src/features/settings-backup/lib/applyImport.ts` — применение копии к состоянию приложения
- `src/features/settings-backup/lib/applyBackupScalars.ts` — запись скаляров через владельческие экшены
- `src/features/settings-backup/lib/mergeHistory.ts`, `lib/mergePlaylists.ts` — семантика слияния
- `src/features/settings-backup/lib/backupFiles.ts` — имена файлов и выбор самого свежего ручного бэкапа
- `src/features/settings-backup/lib/autoSync.ts` — фоновая запись `slovo-backup-auto.json`
- `src/features/settings-backup/lib/fileIo/` — платформенный ввод-вывод (`index.native.ts`, `index.web.ts`, `webDirectory.ts`, `webIdb.ts`, `webFallback.ts`)

## Назначение

Пользователь явно экспортирует/импортирует файл копии. Там, где поддерживается синхронизация через папку (Android, web с File System Access API), он выбирает папку; на iOS и в браузерах без FSA экспорт идёт через share sheet / скачивание файла, а импорт — через системный выбор файла. Данные хранятся только локально (AsyncStorage + файл копии), синхронизации с сервером нет. Фича — тонкая обёртка над владельцами: она читает и пишет данные через их публичные пути (`readHistory`/`writeHistory`, `persistMyPlaylists`, `setThemeMode`, экшены плеера и т.д.), а не дублирует схемы и ключи.

## Формат файла (v1)

Один JSON-объект: маркер, версия, время экспорта и секции данных. Все секции в `data` **опциональны** — файл мог быть создан другой версией приложения, а часть данных могла отсутствовать на момент экспорта.

```json
{
  "kind": "slovo-propovedi-backup",
  "version": 1,
  "exportedAt": "2026-10-08T12:34:56.789Z",
  "data": {
    "listeningHistory": [],
    "myPlaylists": [],
    "myPlaylistsSectionSettings": {},
    "settings": {
      "themeMode": "dark",
      "dynamicColors": true,
      "hapticsEnabled": true,
      "serverUrl": "https://api.slovo-istini.com",
      "sermonCachingEnabled": false
    },
    "player": {
      "playbackRate": 1,
      "repeatMode": "off",
      "balance": 0,
      "pitch": 1,
      "equalizerEnabled": false,
      "equalizerGains": [0, 0, 0, 0, 0]
    },
    "youtubeImport": {
      "source": "invidious",
      "invidiousBaseUrl": "https://inv.phobos.observer"
    }
  }
}
```

- `kind` = `'slovo-propovedi-backup'`, `version` = `1` (`BACKUP_KIND` / `BACKUP_VERSION`).
- `exportedAt` — ISO-строка момента экспорта.
- `listeningHistory`, `myPlaylists`, `myPlaylistsSectionSettings` — валидируются **владельческими** схемами (`listeningHistorySchema`, `myPlaylistsArraySchema`, `sectionSettingsDraftSchema`), а не копиями.
- `settings` — подмножество скаляров: `themeMode` (`'system' | 'light' | 'dark'`), `dynamicColors`, `hapticsEnabled`, `serverUrl` (только `http(s)://`), `sermonCachingEnabled`. Все поля опциональны.
- `player` — `playbackRate`, `repeatMode`, `balance`, `pitch`, `equalizerEnabled`, `equalizerGains` (те же схемы плеера, что и при восстановлении).
- `youtubeImport` — `source`, `invidiousBaseUrl`: ослабленная до partial владельческая `importSettingsSchema` из `features/sermon-audio-import` (см. [@x-зависимость](#x-зависимость)).
- Пустые скалярные секции не пишутся вовсе (`dropEmpty` в `buildPayload`): секция без единого определённого поля в файл не попадает.

Разбор недоверенного ввода двухэтапный (`parseBackupFile`): сначала лёгкий конверт `{kind, version}`, затем полная схема данных. Результат: `ok` (данные), `newer-version` (файл новее поддерживаемой версии), `invalid` (битый JSON, чужой маркер, плохие данные).

## Имена файлов

- **Ручной бэкап** — `slovo-backup-YYYY-MM-DD_HH-MM.json` (локальное время, нулевое дополнение: лексикографический порядок равен хронологическому, поэтому «самый свежий» — просто максимальное имя).
- **Автобэкап** — `slovo-backup-auto.json` (фиксированное имя, всегда перезаписывается).

При импорте выбирается **самый свежий ручной** файл из папки; если ручных нет — автобэкап (`pickNewestManualBackupName(names) ?? AUTO_BACKUP_FILE_NAME`).

## Платформы

| Платформа | Выбор папки | Хранение доступа | Автосинхронизация |
| --------- | ----------- | ---------------- | ----------------- |
| **Android** | `Directory.pickDirectoryAsync` (SAF) | Постоянный grant, папка переживает перезапуск | Да |
| **Web** (File System Access API) | `window.showDirectoryPicker` | `FileSystemDirectoryHandle` в IndexedDB (`slovo-backup` / `handles` / `backup-folder`); синтетический URI `web-dir:<name>`; доступность оптимистична (хендл существует = папка доступна) | Да |
| **Web** (Firefox/Safari, mobile) | API нет — папка не выбирается | — | Нет (экспорт = скачивание файла, импорт = системный `<input type="file">`) |
| **iOS** | Экспорт — системный share sheet («Сохранить в Файлы», `expo-sharing`); импорт — документ-пикер (`expo-document-picker`); папка не используется | — | Нет |

- `supportsFolderSync()` (`fileIo/index.native.ts`) = `Platform.OS === 'android'`; на web — `isFolderPickerSupported()` (наличие `window.showDirectoryPicker`). Флаг гейтит строку выбора папки, автосинхронизацию и фоновый автосейв. Когда он `false` (iOS, браузеры без FSA), секция работает в режиме выбора файла: экспорт — `exportViaFilePicker(name, json)`, импорт — `importViaFilePicker(): Promise<null | string>` (`null` — пользователь отменил).
- Режим без папки: iOS — системный share sheet (`expo-sharing.shareAsync`, «Сохранить в Файлы») и `expo-document-picker.getDocumentAsync`; web — скачивание через `<a download>` (`webFallback.downloadBackupFile`) и `<input type="file">` (`webFallback.pickBackupFileText`). Импортированный текст всё равно проходит `parseBackupFile` — без упрощений.
- URI папки — недоверенный legacy-ввод: перед передачей в нативный модуль проверяется схема (`hasUriProtocol`, принимает и `content://`); недоступный путь сбрасывается (`useFolderAvailability` + `clearBackupFolder`).
- Доступность папки определяется **оптимистично**: на web хендл в IndexedDB = папка доступна; `queryPermission` не гейтит (Chromium может отдавать `'prompt'` при фактически активном гранте), недоступность — только при явном `'denied'`. Реальная потеря разрешения (после рестарта браузера; для Firefox/Safari не применимо — папки там нет) проявляется реактивно: операция бросает `FolderPermissionLostError`, и UI переходит в состояние повторного выбора.
- Запись на Android SAF идёт не через `File.write` (он не создаёт документ под `content://`, а `DocumentsContract.createDocument` падает на уже существующем имени): `writeFile` удаляет существующий документ с тем же именем (best-effort) и создаёт новый через `Directory.createFile(name, 'application/json')`, затем пишет содержимое (`lib/fileIo/writeBackupFile.ts`). Единый путь для ручного экспорта и автосинхронизации.
- `folderLabel` показывает последний сегмент пути (на web — имя handle из `web-dir:<name>`).

## Экспорт

Экспорт в обоих режимах делит сборку и валидацию (`buildValidatedJson`), различается только финальный шаг:

1. `buildPayload()` читает владельческие данные (история, плейлисты, настройки секции) и скаляры из AsyncStorage, опуская пустые секции.
2. Результат валидируется `backupFileSchema.safeParse`; при провале — `reportError`.
3. Режим папки (`exportBackup`): файл пишется в папку под именем с текущими датой/временем, планируется автосохранение (если включено).
4. Режим без папки (`exportFromPicker`): тот же JSON отдаётся в `exportViaFilePicker`.
5. В обоих режимах показывается тост «Копия сохранена».

## Импорт: merge vs replace

`importBackup` (режим папки) и `importFromPicker` (режим без папки) читают файл, затем общий `handleRawBackup` разбирает его и кладёт в `pendingFile`; открывается диалог выбора режима:

- **Объединить (merge)** — слить с текущими данными;
- **Заменить (replace)** — записать данные файла как есть.

Различие режимов касается **только истории и плейлистов**; скаляры всегда накладываются по присутствующим полям.

- **История.** `replace` — данные файла; `merge` — `mergeHistory`: дедупликация по `sermon.id`, при совпадении побеждает запись с более свежим `lastPlayedAt`, сортировка по убыванию и обрезка до лимита истории (100, инвариант `sortAndCapEntries`).
- **Плейлисты.** `replace` — нормализованные импортированные + `withFavoritesFirst`; `merge` — `mergePlaylists`: объединение по `id` (импортированный выигрывает по названию), проповеди внутри — по `id` (импортированная выигрывает), затем инвариант «Избранные первыми» и «Избранные существуют».
- **Настройки секции.** Применяются через `updateSectionSettings` (коммит атома) + `persistSectionSettings` (запись в хранилище) — повторный `loadSectionSettings` не нужен, атом уже актуален.
- **Скаляры.** Каждое поле пишется владельческим экшеном только если оно присутствует в файле. `youtubeImport` сливается с сохранёнными значениями (недостающие поля не затирают сохранённые); невалидный итог не сохраняется.
- **Legacy-плейлисты.** Записи, содержащие только `sermonIds` без снапшотов `sermons`, импортируются как **пустые** плейлисты: id без снапшота отбрасываются штатной политикой владельца (`normalizeLocalPlaylist`), рендерить по одним id нечем.
- **Импорт не транзакционен:** при ошибке применяются только секции, обработанные до неё. Порядок применения — сначала дешёвые скаляры (`settings`, `player`, `youtubeImport`), затем настройки секции и, последними, история и плейлисты.
- После записи владельческие `load`-экшены обновляют атомы, показывается тост «Данные восстановлены», планируется автосохранение.

Ошибки разбора: `newer-version` → «Файл создан более новой версией приложения — обновите приложение»; `invalid` → «Файл резервной копии не удалось прочитать».

## Смена URL сервера (подтверждение)

Если в файле есть `settings.serverUrl`, отличный от текущего, после выбора режима открывается `ServerUrlChangeDialog` с новым адресом: «Применить» применяет импорт целиком, «Отмена» отбрасывает импорт (ничего не пишется). Без расхождения URL импорт выполняется сразу.

## Папка недоступна (повторный выбор)

Сохранённый `backup_dir_uri` — недоверенный ввод. Доступность определяется оптимистично (на web — хендл существует; на native — `Directory.exists`); при явной недоступности (`folderExists` → `false`, в т.ч. `queryPermission === 'denied'`) `useFolderAvailability` переводит UI в состояние: подзаголовок «Папка недоступна — выберите заново», кнопка предлагает выбрать папку. Реальная потеря доступа в процессе работы (например, браузер сбросил разрешение) обнаруживается реактивно: `writeWebFile`/`readWebFile`/`listWebFiles` мапят `NotAllowedError`/`SecurityError` в `FolderPermissionLostError`, а экспорт и импорт вызывают `markFolderUnusable()` — тот же экран повторного выбора. Неудачный/отменённый выбор при недоступном сохранённом пути сбрасывает его (`clearBackupFolder`), чтобы UI не писал в никуда.

## Автосинхронизация

Доступна только там, где папка переживает сессию (Android, web с File System Access API) — на iOS чекбокс скрыт (`canFolderSync`), фоновый автосейв дополнительно гейтится `supportsFolderSync()`.

- Включение — чекбокс «Автосинхронизация» (доступен только при выбранной и рабочей папке).
- Конфликт при включении: если в папке уже есть `slovo-backup-auto.json`, открывается `AutosyncConflictDialog` — «Импортировать (объединить)» / «Импортировать (заменить)» (через общий пайплайн импорта, с подтверждением смены URL) либо «Перезаписать бэкап» (записать текущее состояние сразу). После успешного импорта или перезаписи автосинхронизация включается; отмена/закрытие оставляет её выключенной. Повреждённый автофайл предлагает только «Перезаписать бэкап» + «Отмена». Если файла нет — включение сразу.
- Триггер — `useAutoBackupSync`: trailing-дебаунс **30 с** (`useDebounce` с `flushOnUnmount`), срабатывает при уходе приложения в фон (`AppState === 'background'`), после ручного экспорта/импорта и при изменении отслеживаемых данных (настройки темы/хаптики/сервера/кеша/плеера, история, локальные плейлисты, настройки секции).
- Запись сериализуется очередью promise (`writeAutoBackup`), поэтому параллельные flush не перезаписывают `slovo-backup-auto.json` вразнобой; ошибки логируются и не рвут цепочку.
- Фактически пишется только при включённом флаге и наличии URI папки.

Ключи `backup_dir_uri` и `backup_autosync` (значения переживают обновления приложения, читаются защищённо) описаны в [contracts/storage.md](../contracts/storage.md).

## @x зависимость

`features/settings-backup` и `features/sermon-audio-import` — слайсы одного слоя. Кросс-импорт идёт по конвенции FSD `@x`: `src/features/sermon-audio-import/@x/settings-backup.ts` реэкспортирует `importSettingsSchema`, `readImportSettings`, `persistImportSettings`. Благодаря этому фича не дублирует схему и ключ настроек импорта аудио, а `youtubeImport` читается и пишется через владельческий публичный интерфейс.

## Связанные документы

- [screens/settings.md](../screens/settings.md) — секция «Резервная копия» на экране «Настройки»
- [contracts/storage.md](../contracts/storage.md) — ключи `backup_dir_uri`, `backup_autosync`
- [features/my-playlists.md](./my-playlists.md) — локальные плейлисты и настройки оформления
- [features/listening-history.md](./listening-history.md) — история прослушивания и её лимит
- [features/player.md](./player.md) — настройки звука плеера

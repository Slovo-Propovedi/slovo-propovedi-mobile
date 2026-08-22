# Native-модули — контракт границы JS→native

Этот документ описывает **контракт передачи данных из JS в нативные модули** (expo-audio, expo-asset и др.) — то, как значения обязаны выглядеть на JS-границе, чтобы не уронить нативный процесс.

Почему существует: Issue #45 crash loop. Фолбэк-обложка в release-сборке вернула URI без протокола (`assets_fallbackartwork`), expo-audio `setActiveForLockScreen` бросил `MalformedURLException` синхронно, а непойманный throw из колбэка `setInterval` привёл к фатальному крашу на каждом запуске приложения. Данные AsyncStorage, записанные старой версией кода, пережили апдейт — поэтому «просто обновить приложение» не помогло.

## expo-audio контракт

`AudioPlayer.setActiveForLockScreen` (`src/entities/player/lib/PlayerService/LockScreenControls.ts`) — **синхронный JSI-вызов**. Поле `artworkUrl` нативно кастуется в `java.net.URL`; значение без протокола → `MalformedURLException` → `CodedError`, который **бросается синхронно**. Непойманный throw (в т.ч. из колбэка `setInterval`) — фатальный краш приложения (uncaught exception на native-потоке `mqt_v_native`).

Реальный crash log:

```text
FATAL EXCEPTION: mqt_v_native
JavascriptException: Error: Call to function 'AudioPlayer.setActiveForLockScreen' has been rejected.
→ Caused by: Cannot cast value for field 'artworkUrl' ('class java.net.URL?') in record 'expo.modules.audio.Metadata'
→ Caused by: java.net.MalformedURLException: no protocol: assets_fallbackartwork
stack: CodedError ← applyMetadata ← anonymous (setInterval retry callback)
```

**Правила:**

- `artworkUrl` — только полный URI с протоколом (`https://`, `http://`, `file://`, `asset:///`, `content://`). Иначе ключ **опускается совсем** — никогда не отправляется как `undefined`/голое значение. Валидация — `hasUriProtocol` (`src/shared/lib/app-icon.ts`).
- Вызов всегда в try-catch + `reportError` (deep import из `shared/model/error-dialog`) + `console.error`. Обложка и метаданные lock screen — косметика и не имеют права крашить приложение.

## expo-asset контракт

`Asset.fromModule(...)` + `downloadAsync()` (`src/shared/lib/app-icon.ts`):

- В **release-сборках** `asset.uri` / `asset.localUri` МОГУТ быть **голыми именами ассетов без протокола** (`assets_fallbackartwork`) — не URL. Полагаться на них как на URI нельзя.
- `downloadAsync()` — асинхронный; до его завершения `localUri` невалиден. Использовать локальный uri только после успешного `downloadAsync` и только если он прошёл `hasUriProtocol`.
- Паттерн: `localAppIconUri` присваивается только валидному uri; `APP_ICON_URI` — live binding (`export let`), переприсваивается на валидный локальный uri после загрузки.

## apk-installer контракт

`modules/apk-installer` — локальный Expo-модуль (Kotlin) для self-update через Android `PackageInstaller` (см. [`../features/updates.md`](../features/updates.md)):

- **Вход:** `installApk(apkPath)` принимает путь к APK. JS-граница (`src/shared/lib/update-service/updateService.ts`) проверяет `new File(apkPath).exists` ДО вызова; нативный код дополнительно резолвит `Uri.parse(apkPath).path` и повторно проверяет `File.exists()` — Fail Fast.
- **Асинхронность:** промис резолвится из `BroadcastReceiver` (`STATUS_SUCCESS`), а не по завершении commit. При self-update процесс обычно убивается до этого — JS трактует промис как fire-and-forget.
- **Ошибки:** failure-статусы (`STATUS_FAILURE*`) реджектят промис с описанием; `STATUS_PENDING_USER_ACTION` запускает системный диалог подтверждения без резолва.
- **Разрешение:** `canRequestPackageInstalls()` / `openInstallPermissionSettings()` — проверка и открытие системного экрана «Разрешить установку из этого источника».

## Общие правила границы JS→native (чек-лист)

1. **Валидация на JS-границе.** Любое значение, уходящее в нативный модуль, проверяется до вызова. Для URI — `hasUriProtocol` (`src/shared/lib/app-icon.ts`); паттерн тот же, что в LockScreenControls.
2. **try-catch вокруг нативных вызовов.** Нативный вызов, который может бросить/реджектнуть, оборачивается в try-catch (+ `reportError` для видимости). Если функция косметическая (обложка, метаданные), она не имеет права крашить приложение.
3. **AsyncStorage — нелегитимный ввод (untrusted).** Значения из хранилища переживают апдейты приложения и могут быть записаны старыми версиями кода. Парсить/валидировать на границе чтения (zod + `hasUriProtocol` для URI), не доверять слепо.
4. **Нативный краш не ловится сверху.** React ErrorBoundary и JS try-catch вышестоящих callers не перехватывают синхронный throw из JSI-вызова — только try-catch непосредственно вокруг вызова. Диагностика — `adb logcat -b crash` (crash-буфер).

## Связанные документы

- [../features/player.md](../features/player.md) — плеер; **Баг 3** — crash loop и применённый фикс
- [../features/error-handling.md](../features/error-handling.md) — `reportError`, глобальный диалог ошибок, ErrorBoundary, GlobalErrorHandler
- [storage.md](./storage.md) — AsyncStorage (ключи плеера, crash-guard старта, жизненный цикл)
- Код: `src/entities/player/lib/PlayerService/LockScreenControls.ts`, `src/shared/lib/app-icon.ts`, `src/entities/player/lib/startupGuard.ts`

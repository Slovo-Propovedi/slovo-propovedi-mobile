# Native-модули — контракт границы JS→native

Этот документ описывает **контракт передачи данных из JS в нативные модули** (expo-audio, expo-asset и др.) — то, как значения обязаны выглядеть на JS-границе, чтобы не уронить нативный процесс.

Почему существует: Issue #45 crash loop. Фолбэк-обложка в release-сборке вернула URI без протокола (`assets_fallbackartwork`), expo-audio `setActiveForLockScreen` бросил `MalformedURLException` синхронно, а непойманный throw из колбэка `setInterval` привёл к фатальному крашу на каждом запуске приложения. Данные AsyncStorage, записанные старой версией кода, пережили апдейт — поэтому «просто обновить приложение» не помогло.

## expo-audio контракт

`AudioPlayer.setActiveForLockScreen` (`src/entities/player/lib/PlayerService/native/LockScreenControls.ts`) — **синхронный JSI-вызов**. Поле `artworkUrl` нативно кастуется в `java.net.URL`; значение без протокола → `MalformedURLException` → `CodedError`, который **бросается синхронно**. Непойманный throw (в т.ч. из колбэка `setInterval`) — фатальный краш приложения (uncaught exception на native-потоке `mqt_v_native`).

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

**Сборка из исходников и патчи.** `expo-audio` подключён к gradle-сборке **из исходников**: `package.json` → `expo.autolinking.buildFromSource: ["expo-audio"]`. Autolinking создаёт gradle-проект `:expo-audio` из `node_modules/expo-audio/android` на этапе конфигурации (отдельный `expo prebuild` не нужен), поэтому:

- правки Kotlin-исходников в `node_modules/expo-audio/android/**` через `patch-package` **эффективны** — они попадают в компиляцию (пример: `patches/expo-audio+58.0.10.patch` оборачивает JS-геттер `loop` у `AudioPlaylist` в `runOnMain`). Prebuilt AAR такие правки игнорировал;
- `modules/audio-effects` подключается к тому же ExoPlayer через `project(':expo-audio')` (не maven-координату) и видит те же типы `expo.modules.audio.AudioPlayer`;
- при апгрейде expo-audio патч может перестать применяться — `yarn check:patches` падает по дизайну (сверка версии из имени патча), это сигнал пересмотреть патч до сборки.

## expo-asset контракт

`Asset.fromModule(...)` + `downloadAsync()` (`src/shared/lib/app-icon.ts`):

- В **release-сборках** `asset.uri` / `asset.localUri` МОГУТ быть **голыми именами ассетов без протокола** (`assets_fallbackartwork`) — не URL. Полагаться на них как на URI нельзя.
- `downloadAsync()` — асинхронный; до его завершения `localUri` невалиден. Использовать локальный uri только после успешного `downloadAsync` и только если он прошёл `hasUriProtocol`.
- Паттерн: `localAppIconUri` присваивается только валидному uri; `APP_ICON_URI` — live binding (`export let`), переприсваивается на валидный локальный uri после загрузки.

## apk-installer контракт

`modules/apk-installer` — локальный Expo-модуль (Kotlin) для self-update через Android `PackageInstaller` (см. [`../features/updates.md`](../features/updates.md)):

- **Вход:** `installApk(apkPath)` принимает путь к APK. JS-граница (`src/shared/lib/update-service/updateService.ts`) проверяет `new File(apkPath).exists` ДО вызова; нативный код дополнительно резолвит `Uri.parse(apkPath).path` и повторно проверяет `File.exists()` — Fail Fast.
- **Асинхронность:** промис резолвится из `BroadcastReceiver` (`STATUS_SUCCESS`), а не по завершении commit. При self-update процесс обычно убивается до этого — JS трактует промис как fire-and-forget.
- **Ошибки:** failure-статусы (`STATUS_FAILURE*`) реджектят промис со стабильным машинным кодом (первый аргумент `Promise.reject`, в JS — `error.code`) и человекочитаемым описанием; коды — имена статусов, для несовпадения подписей — `INSTALL_SIGNATURE_MISMATCH`. `STATUS_PENDING_USER_ACTION` запускает системный диалог подтверждения без резолва.
- **Разрешение:** `canRequestPackageInstalls()` / `openInstallPermissionSettings()` — проверка и открытие системного экрана «Разрешить установку из этого источника».

## expo-secure-store контракт

`src/shared/api/secureTokenStorage.native.ts` — JWT-токены и кэш профиля администратора.

- **Ключи:** SecureStore допускает только `[A-Za-z0-9._-]`, поэтому legacy-ключи `@access_token`/`@refresh_token` не переиспользуются — новые ключи `slovo_access_token`/`slovo_refresh_token`/`slovo_auth_user` (`secureTokenStorageShared.ts`).
- **`keychainService` фиксирован** (`SECURE_STORE_SERVICE = ru.slovopropovedi.auth`): Android маппит его на отдельный SharedPreferences-файл; изменение сервиса «теряет» уже записанные данные.
- **`keychainAccessible` на iOS:** все записи идут с `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (только пока устройство разблокировано, без переноса в бэкап/на другое устройство); `requireAuthentication` намеренно не задан — биометрический промпт на каждое чтение токена не нужен. Android эту опцию игнорирует.
- **Валидация на чтении:** значения из хранилища считаются untrusted (переживают апдейты и записывались старыми версиями). Токены проходят `toValidToken` (пустое/нестроковое → `null`), кэш профиля — zod `safeParse`; невалидное трактуется как отсутствующее.
- **Миграция:** старые токены из AsyncStorage переносятся в SecureStore при первом чтении (и удаляются из AsyncStorage).
- **Web:** SecureStore на web недоступен. `secureTokenStorage.web.ts` шифрует значения AES-GCM через WebCrypto (`crypto.subtle`), используя **неизвлекаемый** `CryptoKey` (сгенерирован с `extractable: false`), который хранится в IndexedDB (structured clone поддерживает `CryptoKey`); на диск попадает только шифротекст. При недоступности WebCrypto или IndexedDB хранилище деградирует до in-memory — открытый текст в localStorage не пишется. Примитивы — `src/shared/lib/encrypted-store/webEncryption.ts`, фабрика хранилища поверх IndexedDB — `src/shared/lib/encrypted-store/createEncryptedStore.ts` (каждая база — свой ключ; токены — база `slovo_secure_storage` через `src/shared/api/webSecureStore.ts`, конфиденциальный кэш сессии админки — `slovo_session_cache`). Generic-фолбэк — `secureTokenStorage.ts` (AsyncStorage, используется тулингом/type-check); `secureTokenStorageShared.ts` не импортирует нативные модули, чтобы фолбэк не тянул `expo-secure-store` на web.

## Общие правила границы JS→native (чек-лист)

1. **Валидация на JS-границе.** Любое значение, уходящее в нативный модуль, проверяется до вызова. Для URI — `hasUriProtocol` (`src/shared/lib/app-icon.ts`); паттерн тот же, что в LockScreenControls.
2. **try-catch вокруг нативных вызовов.** Нативный вызов, который может бросить/реджектнуть, оборачивается в try-catch (+ `reportError` для видимости). Если функция косметическая (обложка, метаданные), она не имеет права крашить приложение.
3. **AsyncStorage — нелегитимный ввод (untrusted).** Значения из хранилища переживают апдейты приложения и могут быть записаны старыми версиями кода. Парсить/валидировать на границе чтения (zod + `hasUriProtocol` для URI), не доверять слепо.
4. **Нативный краш не ловится сверху.** React ErrorBoundary и JS try-catch вышестоящих callers не перехватывают синхронный throw из JSI-вызова — только try-catch непосредственно вокруг вызова. Диагностика — `adb logcat -b crash` (crash-буфер).

## Unit-тесты нативного кода

Чистая логика нативных модулей вынесена в Kotlin-объекты **без Android-вызовов**, чтобы её можно было прогонять на JVM (обычный JUnit4, без Robolectric — SDK-константы `PackageInstaller.STATUS_*` инлайнятся на компиляции):

- `ApkInstallStatuses` (`modules/apk-installer/android/src/main/java/ru/slovopropovedi/apkinstaller/ApkInstallStatuses.kt`) — маппинг `status → STATUS_FAILURE*`, стабильный код `failureCode` (его читает JS-классификатор `installErrorMessage.ts` как `error.code`) и формат `failureMessage` (`Install failed: <name>, message=<msg>, legacyStatus=<n>`) для диагностики/легаси-разбора;
- `AudioEffectsMath` (`modules/audio-effects/android/src/main/java/ru/slovopropovedi/audioeffects/AudioEffectsMath.kt`) — коэффициенты баланса, `linearToDb` (пол −60 dB), `gainToMillibels`, resize persisted gains, `milliHzToHz`.

Тесты лежат рядом: `modules/<module>/android/src/test/java/...`. Запуск — `yarn test:native` (gradle-проекты `:apk-installer` и `:audio-effects`, задача `testDebugUnitTest` для обоих); `yarn testFinal:all` выполняет их после `yarn testFinal` (только jest). JS-границы модулей покрыты обычными jest-тестами (`modules/apk-installer/index.test.ts`, `modules/audio-effects/platform.native.test.ts`, `.../native/audioEffectsCapabilities.test.ts`).

**Кэш Android SDK в CI (`ci.yml` → `checks`, `release.yml` → `android`).** Самообновляемый: `actions/cache/restore` поднимает самый свежий снимок по префиксу `<os>-android-sdk-v2-`, а после gradle-шага `actions/cache/save` сохраняет новый снимок с ключом из дайджеста установленных каталогов (`build-tools`, `platforms`, `ndk`, `cmake`, `cmdline-tools`) — только если набор изменился. Так в кэш попадает и то, что gradle докачивает сам (NDK, CMake, build-tools); прежний `actions/cache` со статическим ключом сохранялся один раз и никогда не обновлялся, поэтому build-tools скачивались на каждом прогоне — без таймаута, и медленное зеркало вешало `checks` на 20+ минут. В `checks` шаг «Setup Android SDK» дополнительно ставит `ANDROID_SDK_PACKAGES` (`build-tools;36.0.0` — дефолт AGP для библиотек без своей версии, `build-tools;37.0.0` + `platforms;android-37` — дефолты Expo) под таймаутом шага, а не во время конфигурации gradle. Таймауты: установка SDK — 15 мин, нативные тесты — 30 мин. Признак недостающего пакета — строка `Preparing "Install …"` в логе gradle.

## Связанные документы

- [../features/player.md](../features/player.md) — плеер; **Баг 3** — crash loop и применённый фикс
- [../features/error-handling.md](../features/error-handling.md) — `reportError`, глобальный диалог ошибок, ErrorBoundary, GlobalErrorHandler
- [storage.md](./storage.md) — AsyncStorage (ключи плеера, crash-guard старта, жизненный цикл)
- Код: `src/entities/player/lib/PlayerService/native/LockScreenControls.ts`, `src/shared/lib/app-icon.ts`, `src/entities/player/lib/startupGuard.ts`

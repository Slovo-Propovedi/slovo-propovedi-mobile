# Проверка обновлений

**Слой:** `shared/model/update`, `shared/model/updateInstall`, `shared/model/updateOtaGate`, `shared/lib/version-check`, `shared/lib/update-service`, `widgets/update-status`, `features/app-update`, `features/update-notification`, `features/web-update`
**Статус:** готов

## OTA-обновления (expo-updates, self-hosted xprem)

Приложение обновляется по **двум независимым каналам**:

| Канал                                                                                                       | Что доставляет                                              | Как применяется                                                                                               |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| OTA: `expo-updates` ← собственный сервер xprem (`https://ota.slovo-propovedi.ru`, протокол Expo Updates v1) | Только JS-бандл и ассеты                                    | Тихо, в фоне; скачанный бандл применяется при **следующем холодном старте**. Без диалогов и без разрешений ОС |
| APK: Forgejo Release + in-app установка (`modules/apk-installer`)                                           | Нативный код, SDK, конфиг-плагины, разрешения, иконки/сплэш | Диалог «Доступно обновление» (см. «Самообновление (in-app)»)                                                  |

**EAS и EAS Updates (облако Expo) по-прежнему не используются** — сервер обновлений собственный (xprem на своём VPS). `expo-updates` работает напрямую с ним по открытому протоколу, поэтому конфиг живёт в `ota.config.ts` (`runtimeVersion`, блок `updates`), который `app.config.ts` подмешивает в общий конфиг, — а не в EAS-профилях.

### runtimeVersion — фиксированный литерал

`ota.config.ts` задаёт `runtimeVersion` **строковым литералом** (не `pkg.version`): литерал гейтит доставку — манифест с другим `runtimeVersion` устройству не предлагается.

- **Меняется только вместе с нативным кодом:** апгрейд Expo SDK / React Native, добавление-обновление нативной зависимости, изменение конфиг-плагинов (`plugins/*.ts`), разрешений, иконок/сплэша. Тогда же выпускается новый APK.
- **Не меняется для JS-only правок** (экраны, логика, стили, тексты): такой бандл уходит по OTA и совместим с уже установленными сборками.
- **Подъём при нативной правке проверяет CI, а не память.** Job `changes` в `.forgejo/workflows/release.yml` диффит тег против предыдущего: если затронуты нативные пути (`android/`, `ios/`, `plugins/`, `modules/`, `package.json`, `yarn.lock`, `app.config.ts`, `ota.config.ts`), а `RUNTIME_VERSION` не изменился — job падает с `::error::Native paths changed but RUNTIME_VERSION (ota.config.ts) was not bumped — bump it in the same PR`. От `changes` зависят **все** job'ы (`create-release`, `web`, `android`, `ota`), поэтому красный guard блокирует весь релиз: забыть поднять литерал теперь нельзя — это красный пайплайн, а не тихая несовместимость.
- `ota.config.ts` в списке нативных путей намеренно: его блок `updates.*` и сам `RUNTIME_VERSION` запекаются в бинарник.

### Поведение проверки на устройстве

Блок `updates` в `ota.config.ts`:

- `checkAutomatically: 'ON_LOAD'` — манифест проверяется при каждом холодном старте (на Android транслируется в `ALWAYS`);
- `fallbackToCacheTimeout: 0` — старт **никогда не ждёт** загрузку: скачивание идёт в фоне, а найденный бандл применяется при следующем запуске (никаких «обновитесь сейчас»);
- `requestHeaders` — идентификация приложения/канала на сервере (см. ниже).

Встроенный бандл (`Updates.isEmbeddedLaunch === true`) остаётся рабочим всегда: если сервер недоступен, приложение просто запускается на том, что есть. На web OTA не работает вовсе — PWA обновляется через Service Worker (`expo-updates` импортируется лениво и в web-сборке не вычисляется, см. «OTA-aware гейт»).

### Релизные режимы (release.yml)

`.forgejo/workflows/release.yml` определяет режим в job `changes` (полная история: `fetch-depth: 0` + теги) по диффу `PREV..$GITHUB_REF_NAME`, где `PREV` — предыдущий тег по `creatordate`. Если предыдущего тега нет — режим `native` (сборка APK, самый безопасный дефолт).

| Режим     | Когда                                                                                                                                                 | Что делает пайплайн                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `native`  | дифф затронул `android/`, `ios/`, `plugins/`, `modules/`, `package.json`, `yarn.lock`, `app.config.ts` или `ota.config.ts` (или предыдущего тега нет) | job `android`: keystore-гейт, prebuild с четырьмя `EXPO_PUBLIC_*`, gradle APK, ZIP + `SHA256SUMS.txt` в Forgejo-релиз, зеркала GitHub и Codeberg |
| `js-only` | нативных путей в диффе нет                                                                                                                            | job `ota`: публикация бандла в xprem; **Forgejo-релиз не создаётся вообще** (тег есть, релиз-объекта нет)                                        |
| `web`     | всегда, независимо от режима                                                                                                                          | job `web`: экспорт PWA и деплой на VPS; web-zip в релиз — только в `native` (в `js-only` релиза нет)                                             |

**Forgejo-релиз создаётся только в `native`** (job `create-release`, он же гейт по CI и версиям). Смысл релиза — «на лендинге появился новый APK»: новые пользователи всегда скачивают последний APK и на первом запуске молча догоняют актуальный JS-бандл по OTA. В `js-only` релиз-объект не нужен: тег остаётся в git (его создаёт `bump-version`), а обновление уже установленных сборок приезжает по OTA.

**Зеркала GitHub и Codeberg — только в `native`**: они зеркалируют APK-ассеты (в `js-only` релиза нет, зеркалировать нечего; клиентская цепочка источников останавливается на Forgejo — см. «Проверка версии»).

**Web релизится всегда**: job `web` зависит только от `changes` и не имеет условия по режиму, поэтому PWA выходит на каждом теге. Web-zip прикрепляется к релизу только в `native`; в `js-only` деплой на VPS выполняется без сборки zip.

### Публикация OTA (job `ota` → eoas)

Job `ota` запускается только в `js-only` режиме (`if: needs.changes.outputs.native == 'false'`):

- шаг требует **все** четыре OTA-переменные (см. «Окружение OTA») и секрет `XPREM_EOO_TOKEN`; если хотя бы одна из них пуста, шаг печатает `::warning::` с именами отсутствующих и выходит с `exit 0` — пайплайн остаётся зелёным без настройки. Причина строгого гейта: `eoas publish` выполняет `expo export`, который вычисляет `app.config.ts`; без переменных экспортированный бандл получил бы `updates.enabled: false` и ничего бы не доставил;
- иначе: `yarn install --frozen-lockfile`, затем `eoas publish --branch "$EXPO_PUBLIC_XPREM_BRANCH_NAME" --platform android --nonInteractive` (CLI `eoas` из npm, версия держится **синхронно с версией сервера xprem**; токен — в `EOO_TOKEN`). Пин версии — единый файл `.eoas-version` в корне репозитория, его читают оба workflow'а, а Renovate поднимает его автоматически (custom manager с datasource `npm`). Ветка берётся из `EXPO_PUBLIC_XPREM_BRANCH_NAME` — та же переменная, что встроена в APK заголовком `xprem-branch`, поэтому публикация и клиент не расходятся;
- `yarn install` выполняется внутри самого шага: job `ota` не наследует установку из `android` (джобы не делят шаги);
- любая ошибка публикации — `::warning::`, джоба продолжается. В `js-only` режиме провал означает, что релиз не доставлен ничем (релиз-объекта нет, OTA — единственный канал) — строка `⚠️ failed` в summary требует ручного разбора и перезапуска. `EAS_NO_VCS=1` задан постоянно: `eoas` в неинтерактивном режиме иначе отказывается публиковать из грязного дерева;
- бандл экспортируется с теми же `EXPO_PUBLIC_*` переменными, что и APK, иначе OTA-бандл указывал бы на неверные хосты.

**Ручная публикация без релиза.** Отдельный workflow `.forgejo/workflows/ota-publish.yml` («Publish OTA update (manual)») — хотфикс без тега: публикует бандл в xprem **и** деплоит новую web-версию на VPS, но не создаёт Forgejo-релиз и не собирает APK. Forgejo → Actions → Run workflow → выбрать ветку. Порядок шагов: сначала OTA (хотфикс доходит до установленных сборок), затем web-деплой; провал OTA — `::warning::` и не блокирует деплой. Каждый шаг дописывает свою строку в job summary (конфиг OTA, публикация, web export/deploy), финальный вердикт — `🎉` при полном успехе, `⚠️` при пропусках или некритичном провале OTA, `❌` при провале web-пути; отсутствие строки означает, что шаг не запускался. Обычные js-only релизы делают то же автоматически через `release.yml`.

Сервер сверяет `runtimeVersion` манифеста с запрошенным устройством и публикует манифест с `extra.expoClient.version` (версия из `app.config.ts`/`package.json` на момент публикации) — именно её читает клиентский гейт.

### Окружение OTA: четыре переменные, all-or-nothing

`ota.config.ts` (импортируется в `app.config.ts` как `OTA_CONFIG`) читает **только** переменные окружения — конкретных URL, app id, канала и ветки в коде нет:

| Переменная                       | Значение                                                            |
| -------------------------------- | ------------------------------------------------------------------- |
| `EXPO_PUBLIC_OTA_URL`            | базовый URL xprem-сервера; `/manifest` добавляет сам `expo-updates` |
| `EXPO_PUBLIC_XPREM_APP_ID`       | идентификатор приложения из дашборда xprem                          |
| `EXPO_PUBLIC_XPREM_CHANNEL_NAME` | канал xprem, из которого клиент запрашивает манифесты               |
| `EXPO_PUBLIC_XPREM_BRANCH_NAME`  | ветка xprem, в которую публикует `eoas publish` в CI                |

**Контракт all-or-nothing.** Если все четыре непустые — в конфиг попадает полный блок `updates` (url, `requestHeaders`, `checkAutomatically: 'ON_LOAD'`, `fallbackToCacheTimeout: 0`, а при наличии сертификата — код-подпись). Если хотя бы одна пуста — `updates: { enabled: false }`, то есть OTA для этой сборки **полностью выключен**. Это намеренно: сборка без deployment-окружения (F-Droid buildbot в будущем, произвольная локальная сборка) не должна тянуть бандлы из чужого канала поставки — свойство, которое делает такие сборки безопасными по умолчанию (см. «F-Droid»).

Где живут значения:

- **CI** — Forgejo org/repo `vars` с теми же именами; job `android` прокидывает их в prebuild и сборку APK, job `ota` — в `eoas publish` (`.forgejo/workflows/release.yml`). Это не секреты (URL, app id, канал, ветка); при желании их можно перенести в `secrets.` без изменения кода.
- **Локально** — `.env` (скопировать `.env.example`); без него локальная сборка получит `updates.enabled: false`.

`runtimeVersion` при этом остаётся **литералом** в `ota.config.ts`: это версионирование (гейт совместимости), а не deployment-конфиг, поэтому он сознательно не вынесен в env (см. «runtimeVersion — фиксированный литерал»).

Заголовки запросов (`updates.requestHeaders`) уходят с каждым запросом манифеста/ассетов: `expo-app-id`, `expo-channel-name`, `xprem-branch` — все три значения берутся из соответствующих `EXPO_PUBLIC_XPREM_*`.

Включение пакета — нативная правка: `android/` перегенерируется (`expo prebuild --platform android --clean`), потому что meta-data `expo.modules.updates.*` (url, runtime version, request headers, код-подпись) в закоммиченном манифесте появляется только после prebuild с заданными переменными, и выпускается новый APK. Без prebuild локальные сборки запускаются без OTA (meta-data нет), OTA-бандлы им не доставляются.

### Bootstrap: переменные, сертификат, токен

Порядок включения OTA:

1. Задать в Forgejo org/repo `vars` четыре переменные: `EXPO_PUBLIC_OTA_URL`, `EXPO_PUBLIC_XPREM_APP_ID` (значение из дашборда xprem), `EXPO_PUBLIC_XPREM_CHANNEL_NAME`, `EXPO_PUBLIC_XPREM_BRANCH_NAME`.
2. Положить `certs/xprem-certificate.pem` — код-подпись включается **автоматически**: если файл сертификата есть, в блок `updates` добавляются `codeSigningCertificate` и `codeSigningMetadata` (`rsa-v1_5-sha256`, `keyid: main`), иначе блок не эмитится и обновления принимаются без подписи. После появления сертификата нужен новый prebuild (meta-data попадает в манифест) и новое APK.
3. Создать секрет `XPREM_EOO_TOKEN` для публикации.

Плейбук сервера — `configuring-playbook-xprem.md`.

### OTA-aware гейт диалога APK

`src/shared/model/updateOtaGate.ts` (внутренний модуль слайса, из барреля не экспортируется):

- `getRunningManifestVersion(manifest)` → `string | null` — `extra.expoClient.version` запущенного манифеста; отсутствие `extra`, `expoClient` или нестроковое значение трактуются как «версии нет»;
- `resolveEffectiveAppVersion({ appVersion, isEmbeddedLaunch, manifestVersion })` → `string` — при встроенном запуске версия из APK, при OTA-запуске версия из манифеста с фолбэком на версию APK;
- `isReleaseNewerThanRunning(releaseVersion, runningVersion)` → `boolean` — тот же `compareVersions`, но относительно **фактически запущенного** кода;
- `decideUpdatePrompt({ releaseIsNewer, otaAvailable })` → `boolean` — показывать ли диалог APK.

**Правило подавления диалога:** APK-диалог показывается, только если для текущего runtimeVersion **нет** OTA-пути. Когда релиз новее, `checkForUpdateAction` дополнительно спрашивает `Updates.checkForUpdateAsync()` (тот же лениво импортированный `expo-updates`, внутри своего `try/catch`): `isAvailable === true` → пропускаются **и диалог, и push-уведомление** — бандл применится молча на следующем холодном старте, после чего запущенная версия совпадёт с релизом и гейт замолчит. Любое исключение из `checkForUpdateAsync` трактуется как `otaAvailable = false` (fail open — диалог остаётся безопасным фолбэком). Запрос выполняется только на редком пути «релиз новее»; собственный запрос манифеста от `checkForUpdateAsync` приемлем — `expo-updates` и так проверяет манифест при загрузке.

`checkForUpdateAction` (`src/shared/model/update.ts`) сравнивает релиз с эффективной версией, поэтому после тихого OTA диалог и push-уведомление не появляются, если исправление уже приехало бандлом. Чтение состояния `expo-updates` вынесено во внутренний `src/shared/model/updateOtaStatus.ts`; модуль импортируется **динамически внутри нативной ветки** (после ранних выходов для web/офлайна) — web-сборка его не загружает; ошибка импорта (Expo Go, web) откатывает гейт к `APP_VERSION`.

### F-Droid

Сборки F-Droid подписываются ключом F-Droid и поставляются своим клиентом — OTA-канал для них неприменим. Публикация F-Droid пока в планах; когда канал появится, такие сборки должны собираться **без** четырёх `EXPO_PUBLIC_*` OTA-переменных — тогда all-or-nothing конфиг автоматически даёт `updates: { enabled: false }`, и сборка не тянет бандлы из чужого канала. Проверить это на реальном buildbot — запись в [`debt.md`](../debt.md).

## Проверка версии

`checkForUpdateAction` — `src/shared/model/update.ts`:

- выходит, если `Platform.OS === 'web'` — веб-версия обновляется сама через Service Worker; применение новой версии — через модалку подтверждения (features/web-update, см. [web.md](./web.md) → PWA), диалог «скачать APK» там не имеет смысла;
- выходит, если `!ctx.get(isOnlineAtom)`;
- получает последний релиз через `fetchLatestRelease()`; если нет — выходит;
- сравнивает `compareVersions(release.version, <эффективная версия>)` через `isReleaseNewerThanRunning` — эффективная версия учитывает запущенный OTA-бандл (см. «OTA-aware гейт диалога APK»);
- если релиз новее — спрашивает OTA (`checkForUpdateAsync`): при `isAvailable === true` выходит без уведомления и диалога (бандл приедет сам), иначе планирует уведомление и открывает диалог обновления.

`src/shared/lib/version-check/`:

- `fetchLatestRelease.ts` — цепочка источников **Forgejo → Codeberg → GitHub**: `git.lightnode.ru/api/v1/repos/Slovo_Propovedi/slovo-propovedi-mobile/releases/latest`, при провале — `codeberg.org/api/v1/repos/Slovo_Propovedi/slovo-propovedi-mobile/releases/latest`, при провале — `api.github.com/repos/Slovo-Propovedi/...`. Отбрасывает prerelease и теги с дефисом; извлекает APK-ассет `slovo-propovedi-v<версия>.zip` и ассет `SHA256SUMS.txt` (точное имя, регистронезависимо).
- `isApkZipAssetName.ts` — якорный matcher имени APK-ассета (`^slovo-propovedi-v[0-9][^/]*\.zip$`), отсекает веб-экспорт `slovo-propovedi-web-v<версия>.zip` (как в landing-скрипте).
- `compareVersions.ts` — сем-вер сравнение (`a`/`b` → `-1 | 0 | 1`).
- `types.ts` — `LatestReleaseInfo` (`version`, `htmlUrl`, `zipDownloadUrl`, `sha256SumsDownloadUrl`, `body`, ...).

Ссылки «Открыть в браузере» (диалог обновления, push-уведомление, экран «Поделиться») ведут на страницу релиза того источника, который ответил на проверку версии (`release.htmlUrl`): обычно это git.lightnode.ru, а страницы codeberg/github открываются только если ответил соответствующий fallback-источник. Цепочка источников и скачивания остаётся **Forgejo → Codeberg → GitHub**; URL самих ZIP/sums также берутся из ответившего источника.

### Валидация ответа релиза

`fetchLatestRelease` валидирует ответ Zod-схемами (`rawReleaseSchema`, `releaseAssetSchema`) и `parseRelease`:

- отклоняет `prerelease === true`;
- отклоняет теги, содержащие `-` (например, `v0.4.0-rc1`);
- `version` берётся из `tag_name` с отрезанной ведущей `v`;
- `zipDownloadUrl` — URL APK-ассета, имя которого матчится якорным regex `^slovo-propovedi-v[0-9][^/]*\.zip$` (может быть `null`). В native-режиме релизный пайплайн (`.forgejo/workflows/release.yml`) загружает единственный такой ассет `slovo-propovedi-v<версия>.zip`, внутри которого лежит APK `Slovo.Propovedi v<версия>.apk`. В js-only режиме релиза нет вообще, поэтому `releases/latest` продолжает отдавать предыдущий native-релиз: клиент не видит более новой версии и обновляется по OTA. Если релиз всё же ответил без APK-ассета (старые записи, ручные релизы), `zipDownloadUrl` остаётся `null` — клиент это допускает. Веб-экспорт `slovo-propovedi-web-v<версия>.zip` не матчится ни при каких условиях.
- `sha256SumsDownloadUrl` — URL ассета `SHA256SUMS.txt` (точное имя, регистронезависимо; может быть `null`/отсутствовать у старых релизов). Используется для проверки целостности скачанного ZIP.
- Сетевые ошибки логируются (`console.warn`) и не прерывают `checkForUpdateAction`.

### Подпись и контроль целостности релиза (CI)

`.forgejo/workflows/release.yml`, job `android`:

- шаг **«Restore release keystore»** — жёсткий гейт: если секрет `ANDROID_KEYSTORE_BASE64` не задан, джоба падает (`::error::ANDROID_KEYSTORE_BASE64 is not configured — refusing to publish a debug-signed release`), а не публикует debug-подписанный APK. Debug-подпись ломает in-app обновление (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`), поэтому релиз без release-keystore недопустим.
- шаг **«Rename and zip APK»** вместе с ZIP генерирует `SHA256SUMS.txt` (`sha256sum` → стандартная строка `<hex>  <zip-filename>`).
- шаг **«Upload APK to the Forgejo Release»** прикладывает к релизу оба ассета — ZIP и `SHA256SUMS.txt`; те же два ассета зеркалируются в GitHub и Codeberg (см. ниже).

**Контракт релиза:** любой релиз, который клиент может установить, обязан содержать `SHA256SUMS.txt` с digest'ом ZIP-ассета. Клиент проверяет его до распаковки и установки (см. «Целостность обновления (SHA-256)»); релиз без sums-ассета обновлением не устанавливается (fail-closed).

### Зеркалирование релиза в GitHub (CI)

`.forgejo/workflows/release.yml` после публикации релиза в Forgejo выполняет шаг **«Mirror release to GitHub»** (опциональный): создаёт/обновляет релиз в `Slovo-Propovedi/slovo-propovedi-mobile` и загружает ZIP-ассет и `SHA256SUMS.txt` через GitHub REST API v3 (`Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`). Шаг пропускается (`exit 0`), если секрет `MIRROR_GITHUB_TOKEN` не задан — пайплайн остаётся зелёным без конфигурации. Любая ошибка GitHub API — `::warning::`, джоба не падает (релиз Forgejo уже опубликован). HTTP 422 при загрузке ассета (имя уже занято) трактуется как успех.

**Настройка:**

1. В GitHub создать PAT (Personal Access Token) со scope `repo` (для публичного репозитория достаточно `public_repo`) — права на создание релизов и загрузку ассетов.
2. В настройках Forgejo-репозитория (`Settings → Actions → Secrets`) добавить секрет `MIRROR_GITHUB_TOKEN` со значением PAT.
3. Тег `v*` должен быть запушен в GitHub (репозиторий зеркалируется) — если тега ещё нет, создание релиза упадёт с предупреждением, джоба продолжит работу.

### Зеркалирование релиза в Codeberg (CI)

`.forgejo/workflows/release.yml` после GitHub-шага выполняет шаг **«Mirror release to Codeberg»**: создаёт релиз в Codeberg и прикладывает ZIP-ассет и `SHA256SUMS.txt` к тегу. Секрет `MIRROR_CODEBERG_TOKEN` настраивается в Forgejo-секретах репозитория; без него шаг пропускается (`exit 0`), пайплайн остаётся зелёным. Любая ошибка Codeberg API — `::warning::`, джоба не падает (релиз Forgejo — источник истины).

API base: `https://codeberg.org/api/v1/repos/Slovo_Propovedi/slovo-propovedi-mobile` (Codeberg работает на Forgejo, API совместим с Gitea 1.22). Используемые эндпоинты:

- `GET /releases/tags/{tag}` — проверка существования релиза и dedup: Forgejo **не** отвергает ассеты с повторяющимся именем, поэтому перед загрузкой шаг читает `.assets[]` и загружает только отсутствующие (`ZIP_FILE`, `SHA256SUMS.txt`); если оба уже приложены — загрузка пропускается;
- `POST /releases` — создание релиза (тело `{tag_name, name, body}`, **без** `target_commitish`: к этому моменту тег уже существует на Codeberg — см. «Лаг git-зеркала» ниже);
- `POST /releases/{id}/assets?name=<filename>` — загрузка ассета сырым телом (`--data-binary`, `Content-Type: application/zip` для ZIP и `text/plain` для sums). Query-параметр `name` в raw-режиме обязателен; `201` — успех, `413` — превышен лимит;
- `GET /releases?limit=50` и `DELETE /releases/{id}/assets/{attachment_id}` — retention-прунинг старых ZIP (см. «Квота и retention» ниже): релизы сортируются по `created_at`, у релизов вне окна удаляется `.zip`-ассет; `204` — успех.

Аутентификация — заголовок `Authorization: token <PAT>` (схема Forgejo, как у шага загрузки в сам Forgejo; **не** `Bearer` из GitHub-шага). Анонимные GET-запросы к Codeberg работают, поэтому клиент использует `releases/latest` как один из источников обновлений (см. ниже).

**Лаг git-зеркала.** Git-зеркало в Codeberg может отставать от пуша тега: в момент релиза тега (а часто и его коммита) там ещё нет. Раньше шаг передавал `target_commitish: <github.sha>`, и Forgejo пытался создать тег на коммите, которого в Codeberg ещё нет — `404` «object does not exist». Поэтому ветка «релиза ещё нет» (`404` на `releases/tags/{tag}`) теперь:

1. best-effort дёргает локальный Forgejo `POST /api/v1/repos/{owner}/{repo}/push_mirrors-sync` (токен `GITHUB_TOKEN`) — синхронизирует **все** push-зеркала репозитория; при отсутствии push-зеркал это no-op/`404`, результат игнорируется;
2. опрашивает `GET /tags/{tag}` на Codeberg — до 10 попыток с паузой 30 с (~5 мин бюджета: джоба android в это время занимает слот раннера);
3. при найденном теге создаёт релиз **без** `target_commitish` (Forgejo привязывает релиз к существующему тегу) и загружает ассеты как раньше;
4. если тег так и не появился — `::warning::` (проверить git-зеркало и перезапустить шаг после синхронизации), строка `⚠️ failed (tag not mirrored)` в summary, `exit 0` — джоба не падает, релиз Forgejo остаётся источником истины.

**Квота и retention.** У Codeberg действует мягкая квота на вложения репозитория ~1.5 GiB (релизные ZIP — десятки мегабайт); при исчерпании квоты загрузка вернёт `413`, а шаг деградирует в предупреждение. Чтобы квота не исчерпалась, сразу после зеркалирования шаг **«Prune old Codeberg release assets»** удаляет `.zip`-ассеты у всех релизов, кроме `RELEASE_KEEP_COUNT` самых новых (по умолчанию 10 — это ~10 ZIP по 60-100MB, заметно ниже ~1.5 GiB; значение переопределяется одноимённой переменной репозитория; нечисловое или чрезмерно большое значение (9+ цифр) сбрасывается к 10). Сортировка — по `created_at` (тайбрейкер — `id`), релиз текущего тега (`github.ref_name`) не удаляется даже вне окна. Удаляются только `.zip`: `SHA256SUMS.txt` и тело релиза остаются, поэтому старые страницы релизов остаются консистентными. Любая ошибка прунинга — `::warning::`, джоба не падает; без секрета `MIRROR_CODEBERG_TOKEN` шаг пропускается.

**Настройка:**

1. Создать PAT в Codeberg (`Settings → Applications`) с правами на запись в репозиторий (включая релизы).
2. В настройках Forgejo-репозитория (`Settings → Actions → Secrets`) добавить секрет `MIRROR_CODEBERG_TOKEN` со значением PAT (по аналогии с `MIRROR_GITHUB_TOKEN`).
3. Репозиторий должен быть зеркалирован в Codeberg (push-зеркало на Forgejo или pull-зеркало на Codeberg) — иначе тег не доедет и шаг деградирует в warning после ~5-минутного таймаута (см. «Лаг git-зеркала»).

## Состояние

`src/shared/model/update.ts`:

- `latestVersionAtom` (строка версии);
- `releaseUrlAtom` (URL страницы релиза ответившего источника — `release.htmlUrl`);
- `zipDownloadUrlAtom` (URL скачивания ZIP-ассета с APK, используется самообновлением).

При обнаружении новой версии `checkForUpdateAction` открывает диалог (`updateDialogVisibleAtom = true`) — при каждом запуске приложения, пока доступна новая версия (без гейта «показывать раз на версию»). Диалог открывается **в конце** экшена: сначала устанавливаются атомы версии/URL, затем выполняется необязательная секция push-уведомления (запрос разрешений через `requestPermissions()` и планирование), и только потом — `updateDialogVisibleAtom = true`. Такой порядок нужен, чтобы системный промпт разрешений не появлялся поверх модалки обновления.

`src/shared/model/updateInstall.ts` — состояние процесса самообновления (общее для диалога и push-уведомления):

- `updateStateAtom` (`UpdateState`): `'idle' | 'downloading' | 'extracting' | 'installing' | 'permission' | 'error'` — этап самообновления;
- `updateProgressAtom` (number 0–100): процент загрузки ZIP;
- `updateErrorAtom` (`null | string`): текст ошибки для диалога (всегда человекочитаемый);
- `updateErrorKindAtom` (`null | UpdateErrorKind`): структурный тип ошибки (`download`, `extract`, `offline`, `install-*`, `install-generic`, `unknown`) — см. «Классификация ошибок обновления»;
- `updateDialogVisibleAtom` (boolean): видимость диалога обновления;
- `startUpdateAction` — запуск самообновления (см. ниже);
- `resumeUpdateAfterPermissionAction` — продолжение после возврата из настроек разрешения (см. ниже);
- `resetUpdateAction` — сброс состояния и скрытие диалога.

Файл разбит на `updateInstall.ts` (типы, атомы, чистые хелперы `isBusyUpdateState`/`decidePermissionResume`) и `updateInstallFlow.ts` (экшены и поток).

Проверка запускается в `app/_RootLayout.tsx` после `InteractionManager.runAfterInteractions`.

## UI

`UpdateDialogRoot` (`src/widgets/update-status/ui/UpdateDialogRoot.tsx`) — контейнер без пропсов, рендерится в `app/_RootLayout.tsx` рядом с `NetworkBanner` / `ServerErrorToast` / `GlobalErrorDialog`. Подписан на `updateDialogVisibleAtom` и рендерит `UpdateDialog`; закрытие диалога сбрасывает атом в `false`.

### UpdateDialog

`src/widgets/update-status/ui/UpdateDialog.tsx` — модальный диалог самообновления (RN `Modal`, fade). Состояния определяются `updateState` из хука `useUpdateInstall` (`features/app-update`):

| Состояние     | Заголовок              | Содержимое                                                                                                              |
| ------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `idle`        | «Доступно обновление»  | версия из `latestVersionAtom`, кнопки «Обновить» / «Не обновлять», ссылка «Все версии обновлений»                       |
| `downloading` | «Обновление»           | прогресс-бар + «Загрузка... N%»                                                                                         |
| `extracting`  | «Обновление»           | «Распаковка...»                                                                                                         |
| `installing`  | «Обновление»           | «Запуск установки...»                                                                                                   |
| `permission`  | «Требуется разрешение» | объяснение + кнопки «Открыть настройки» / «Не сейчас»                                                                   |
| `error`       | «Ошибка обновления»    | текст ошибки, кнопки «Повторить» / «Открыть в браузере» / «Закрыть» (порядок и акцент зависят от `updateErrorKindAtom`) |

- «Обновить» → `startUpdate()`; во время загрузки закрытие диалога заблокировано (`onRequestClose` — no-op).
- Закрытие («Не обновлять», «Закрыть», «Не сейчас», back) вызывает `reset()` хука и `onClose`.
- Ссылки открывают `releaseUrlAtom` (страница релиза ответившего источника) через `openReleaseUrl` (`lib/openReleaseUrl.ts`) с защитой: только `https://`.

Составные части: `UpdateDialogConfirm.tsx`, `UpdateDialogProgress.tsx`, `UpdateDialogPermission.tsx`, `UpdateDialogError.tsx`, общие стили — `updateDialogStyles.ts`. Кнопки переиспользуют `shared/ui/confirm-dialog/ConfirmDialogButton`.

## Самообновление (in-app)

Полный поток: **диалог подтверждения → скачивание ZIP → распаковка APK → проверка разрешения → установка через `PackageInstaller`**. Работает только на Android; на iOS и при ошибках — фолбэк на открытие страницы релизов в браузере.

> **F-Droid:** сборки F-Droid подписываются собственным ключом F-Droid, поэтому самообновление в них не сработает — подпись установленной версии не совпадёт с подписью APK из релиза (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`). Обновление таких сборок — через клиент F-Droid.

### Фича app-update

`src/features/app-update/lib/useUpdateInstall.ts` — хук `useUpdateInstall()`, тонкая обёртка над общим состоянием из `shared/model/updateInstall.ts`. Публичный API хука: `{ error, errorKind, progress, reset, startUpdate, updateState }`. Атомы и логика переехали в `shared/model`, чтобы и `features/update-notification` (обработчик push), и `widgets/update-status` (диалог) могли их использовать без нарушения FSD (импорт features → features запрещён).

Хук также подписывается на `AppState` (`change` → `active`, debounce 500 мс) и вызывает `resumeUpdateAfterPermissionAction` — это продолжает установку, когда пользователь вернулся из системных настроек разрешения.

Логика `startUpdateAction` (guard-клаузы по порядку):

1. уже идёт загрузка/распаковка/установка (`isBusyUpdateState`) → повторно показать диалог с текущим прогрессом и выйти (защита от повторного входа при повторном тапе по кнопке уведомления);
2. платформа не Android (iOS) → открыть страницу релизов в браузере;
3. офлайн (`!isOnlineAtom`) → `updateErrorAtom = «Нет подключения к интернету»`, состояние `error`, диалог видим;
4. нет `zipDownloadUrlAtom` → открыть страницу релизов в браузере;
5. иначе: `updateDialogVisibleAtom = true`, `updateProgressAtom = 0`, `updateErrorAtom = null`, последовательно `downloading` → `extracting` → `installing`; любой шаг упал — состояние `error` с классифицированными `updateErrorKindAtom` + `updateErrorAtom`; сырая ошибка уходит в глобальный обработчик (`reportError`) **только для непредвиденных видов** (`unknown` / `install-generic`, см. «Диагностика ошибок обновления»), предвиденные виды показываются лишь человекочитаемым текстом в диалоге.

**Тайминг очистки:** `cleanupUpdateFiles()` вызывается в **начале** потока (перед скачиванием — чистит остатки прошлого запуска), а НЕ в `finally`. Файлы никогда не удаляются, пока сессия `PackageInstaller` может их читать (раньше `finally` удалял APK сразу после старта интента установщика — причина «Возникла проблема с файлом приложения»). Дополнительно при ошибке до установки (скачивание, проверка целостности, распаковка) каталог обновлений очищается в `catch` `performUpdate`; после перехода в `installing` очистка не выполняется.

**Фолбэк скачивания (зеркала):** если `downloadUpdateZip` упал (Forgejo ответил при проверке, но «умер» до тапа «Обновить»), `downloadUpdateZipWithFallback` (`src/shared/model/updateInstallFallback.ts`) один раз перезапрашивает `fetchLatestRelease()` и, если у свежего релиза `zipDownloadUrl` **отличается** от упавшего URL **и версия не старше** упавшей (`compareVersions(release.version, failedVersion) >= 0`, где `failedVersion` — `latestVersionAtom`), сбрасывает `updateProgressAtom` в 0, обновляет `latestVersionAtom`/`releaseUrlAtom`/`zipDownloadUrlAtom` (ссылка «Открыть в браузере» в диалоге ошибки ведёт на живую страницу) и повторяет скачивание с новым URL. Ретрай ровно один, без циклов. Если релиз недоступен, `zipDownloadUrl` пуст/совпадает с упавшим URL, версия фолбэка старше упавшей или повторное скачивание тоже упало — пробрасывается исходная ошибка (существующий поток `setErrorState`). Вместе с URL обновляется и `sha256SumsUrlAtom`: повторная попытка проверяет digest по sums-ассету свежего релиза. Решение о ретрае — чистый хелпер `getFallbackDownloadUrl(failedUrl, failedVersion, release)` (тесты рядом, `updateInstallFallback.test.ts`). Фолбэк применяется **только** к шагу скачивания: ошибки распаковки/установки обрабатываются как раньше. Таймаут-ошибка скачивания — легитимный триггер ретрая: `downloadFileWithTimeout` бросает её после 10-минутного бюджета, и фолбэк перезапрашивает свежий релиз с зеркал (Forgejo → Codeberg → GitHub) так же, как при любой другой ошибке скачивания.

### Классификация ошибок обновления

Ошибки самообновления классифицируются структурно в `src/shared/lib/update-service/installErrorMessage.ts`:

- `classifyUpdateError(rawError)` → `{ kind, message }`, где `kind` — `UpdateErrorKind`, а `message` — всегда непустой человекочитаемый русский текст;
- `GENERIC_ERROR_MESSAGE` — общий текст для неклассифицируемых ошибок.

Основной путь классификации — **машинный код отказа**: нативный модуль `apk-installer` передаёт его первым аргументом `Promise.reject` (Expo доставляет его в `error.code`). Кодами служат имена статусов `PackageInstaller` (`STATUS_FAILURE_ABORTED`, `STATUS_FAILURE_BLOCKED`, …), а для несовпадения подписей выделен отдельный код `INSTALL_SIGNATURE_MISMATCH` — SDK сообщает его лишь грубым статусом `STATUS_FAILURE_INCOMPATIBLE`.

`kind` (порядок проверки в `classifyUpdateError`):

| Условие (код, либо легаси-подстрока в сообщении)                                   | `kind`                 | Текст ошибки                                                                              |
| ---------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| `INSTALL_SIGNATURE_MISMATCH` (код) / `INSTALL_FAILED_UPDATE_INCOMPATIBLE` (легаси) | `install-signature`    | подписи установленной и новой версии различаются — удалите приложение и установите заново |
| `Нет подключения к интернету`                                                      | `offline`              | «Нет подключения к интернету»                                                             |
| `ERR_DOWNLOAD` / `Network request failed`                                          | `download`             | «Не удалось скачать обновление. Проверьте подключение и попробуйте снова»                 |
| `No .apk file found` / `Extracted APK is missing` / `unzip`                        | `extract`              | «Не удалось распаковать обновление. Повторите попытку или скачайте его из браузера»       |
| `STATUS_FAILURE_ABORTED` (код или легаси)                                          | `install-aborted`      | «Установка отменена»                                                                      |
| `STATUS_FAILURE_BLOCKED` (код или легаси)                                          | `install-blocked`      | «Установка заблокирована системой»                                                        |
| `STATUS_FAILURE_CONFLICT` (код или легаси)                                         | `install-conflict`     | «Конфликт версий: обновление несовместимо с установленной версией»                        |
| `STATUS_FAILURE_INCOMPATIBLE` (код или легаси)                                     | `install-incompatible` | «Обновление несовместимо с этим устройством или версией Android»                          |
| `STATUS_FAILURE_INVALID` (код или легаси)                                          | `install-invalid`      | «Файл обновления повреждён»                                                               |
| `STATUS_FAILURE_STORAGE` (код или легаси)                                          | `install-storage`      | «Недостаточно места для установки обновления»                                             |
| `STATUS_FAILURE` (generic) или любая другая `Error` без известного кода            | `install-generic`      | «Не удалось установить обновление»                                                        |
| вход не `Error` (или `Error` без сообщения и без известного кода)                  | `unknown`              | «Не удалось установить обновление»                                                        |

Поиск подстрок в тексте — **легаси-фолбэк**, он включается только если у ошибки нет известного кода (ошибки старых сборок нативного модуля, скачивание/распаковка, прочие JS-ошибки). Для ошибок установки из текущего `apk-installer` код имеет приоритет и не зависит от формата сообщения.

Сырая ошибка при этом **всегда** логируется через `console.error` (диагностика), а в глобальный обработчик `reportError(installError, 'Ошибка обновления приложения')` (`shared/model/error-dialog`) она попадает **только для непредвиденных видов** (`isUnexpectedUpdateError(kind) === true`, т.е. `kind === 'unknown' || kind === 'install-generic'`). Предвиденные виды (все остальные: `download`, `extract`, `offline`, `install-signature`, `install-aborted`, `install-blocked`, `install-conflict`, `install-incompatible`, `install-invalid`, `install-storage`) уже имеют курируемый русский текст в диалоге, и глобальная модалка только накладывала бы поверх него сырой технический текст. Намеренная отмена установщика (`install-aborted`) — предвиденный вид, поэтому глобального диалога не вызывает (как и раньше). Предикат `isUnexpectedUpdateError(kind)` (`src/shared/lib/update-service/installErrorMessage.ts`) построен на явном allowlist «предвиденных» видов: вид, добавленный позже, по умолчанию считается непредвиденным, пока его сообщение не откурировано, — так новая неисследованная ошибка не потеряется для диагностики. Логика живёт в `handleUpdateFailure` (`src/shared/model/updateInstallFlow.ts`) и вызывается и из `performUpdate`, и из `resumeUpdateAfterPermissionAction`.

### Действия в диалоге ошибки

`src/widgets/update-status/ui/UpdateDialogError.tsx` получает `errorKind`, `errorMessage`, `onRetry`, `onOpenReleases`, `onClose`:

- `download | extract | offline | install-aborted | install-generic | unknown` — primary-кнопка **«Повторить»** (`startUpdate`), secondary «Открыть в браузере», tertiary «Закрыть»;
- `install-signature | install-blocked | install-conflict | install-incompatible | install-invalid | install-storage` — primary **«Открыть в браузере»** (повтор часто бесполезен: проблема в подписи/устройстве/месте), secondary «Повторить», tertiary «Закрыть».

`UpdateDialog` передаёт `errorKind ?? 'unknown'` и `errorMessage ?? GENERIC_ERROR_MESSAGE` — модалка всегда показывает человекочитаемый текст.

### Диагностика ошибок обновления (две ветки UX)

Ошибки самообновления делятся на две ветки:

- **Предвиденные** (`isUnexpectedUpdateError(kind) === false`): показываются **только** внутри диалога обновления человекочитаемым русским текстом (`updateErrorAtom`). Никакого глобального диалога и никакого сырого технического текста — текущее поведение сохраняется.
- **Непредвиденные** (`kind === 'unknown' || 'install-generic'`): причина неизвестна, поэтому **дополнительно** открывается глобальная модалка ошибки (`reportError(error, 'Ошибка обновления приложения')`), где пользователь видит сырые детали и может снять скриншот / отправить разработчику. Диалог обновления при этом продолжает показывать свой общий текст (`GENERIC_ERROR_MESSAGE`) и действия поверх глобальной модалки.

Глобальная модалка (`ErrorDialog`) рендерит поле «Детали ошибки» из `getErrorDetail` (`shared/lib/error-utils.ts`): для `Error` — `error.stack || error.message` (полный стек), для строки — саму строку, для объекта — `JSON.stringify`. То есть пользователю доступен не только текст, но и стек/имя ошибки. Кнопка «Копировать» копирует сообщение и детали целиком.

### Разрешение установки из этого источника

После распаковки APK `startUpdateAction` вызывает `canRequestPackageInstalls()`:

- разрешение есть → сразу `installing` → `installApk`;
- разрешения нет → путь APK сохраняется в module-level `pendingApkPath`, состояние `permission` (диалог «Требуется разрешение»).

Когда пользователь возвращается из настроек (`AppState` → `active`, debounce 500 мс), `resumeUpdateAfterPermissionAction`:

1. если состояние не `permission` — выход;
2. повторно `canRequestPackageInstalls()` + проверка существования APK (`apkFileExists`) через чистый хелпер `decidePermissionResume`:
   - `wait` (разрешения всё ещё нет) — остаёмся в `permission`;
   - `install` (разрешение есть, APK на месте) — `installing` → `installApk`;
   - `restart` (разрешение есть, APK пропал) — перезапуск всего потока `startUpdateAction`.

`resetUpdateAction` очищает `pendingApkPath` и возвращает атомы в исходное состояние.

### Сервис update-service

`src/shared/lib/update-service/updateService.ts`:

| Функция                                                                            | Назначение                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `downloadUpdateZip(url, onProgress?, timeoutMs = DOWNLOAD_TIMEOUT_MS, integrity?)` | Скачивание ZIP через `File.createDownloadTask` (expo-file-system) в `<cache>/updates/slovo-propovedi-update.zip`; прогресс в процентах через колбэк. Guard: URL только `https://` и хост из allowlist (`git.lightnode.ru`, `github.com`, `objects.githubusercontent.com`). Перед скачиванием обязателен `SHA256SUMS.txt` (URL передаётся в `integrity.sha256SumsDownloadUrl`); после скачивания digest ZIP сверяется с sums-файлом. Отсутствие sums, битый/несовпадающий digest — ошибка до распаковки (см. «Целостность обновления (SHA-256)»). Таймаут-семантика: бюджет `DOWNLOAD_TIMEOUT_MS` = 10 минут; по истечении `AbortController` отменяет нативную закачку; частичный файл удаляется при любой ошибке скачивания. |
| `extractApkFromZip(zipPath)`                                                       | Поиск первого `.apk` внутри архива (`listContents`) с проверкой пути на traversal (`..`/абсолютный путь → ошибка), селективная распаковка (`unzip`, `react-native-zip-archive`) и переименование в `update.apk` — оригинальное имя `Slovo.Propovedi v<версия>.apk` содержит пробелы и небезопасно для shell.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `installApk(apkPath)`                                                              | Если доступен локальный модуль `apk-installer` — установка через `PackageInstaller` (сессия, стриминг APK, commit; результат приходит broadcast'ом). Иначе — фолбэк `IntentLauncher.startActivityAsync(VIEW_ACTION, ...)` (Expo Go / экзотика).                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `canRequestPackageInstalls()`                                                      | Обёртка над нативным `canRequestPackageInstalls()`; при недоступности модуля возвращает `true` (фолбэк-установщик сам решает).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `openInstallPermissionSettings()`                                                  | Открывает системный экран «Разрешить установку из этого источника» (`Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `apkFileExists(apkPath)`                                                           | Проверка существования APK на диске (`new File(path).exists`, `updateFiles.ts`) — используется при возобновлении после разрешения.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `cleanupUpdateFiles()`                                                             | Удаление каталога `<cache>/updates` (вызывается в начале потока обновления); ошибки логируются, не бросаются. На не-Android — no-op.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Все функции установки бросают ошибку при вызове не на Android (`assertAndroid`) — Fail Fast.

Утилита скачивания с таймаутом вынесена в `src/shared/lib/fs/downloadFileWithTimeout.ts` и стала общей: её использует и `downloadUpdateZip` (10-минутный бюджет), и импорт аудио из YouTube/Invidious (15 минут, отмена при размонтировании формы через внешний `AbortSignal`) — см. [features/admin.md](./admin.md) → «Импорт аудио из YouTube / Invidious». Сообщение таймаута намеренно нейтральное — `Download timed out after <Xs>`, без префикса `[updateService]`; классификатор ошибок обновления (`installErrorMessage.ts`, `DOWNLOAD_HINTS`) узнаёт его по подстроке `'Download timed out'`, поэтому вид `download` и его русский текст не изменились. Помимо абсолютного бюджета действует stall-guard: если 30 секунд (`DOWNLOAD_STALL_TIMEOUT_MS`) не приходит ни одного тика прогресса, закачка обрывается с сообщением `Download stalled: no progress for 30s` — `DOWNLOAD_HINTS` относит его к тому же виду `download` (прецедент — stall-guard в audio-cache, [features/audio-cache.md](./audio-cache.md)).

### Целостность обновления (SHA-256)

Контракт релиза: к релизу прикладывается `SHA256SUMS.txt` со стандартными строками `<hex>  <filename>` (регистр digest'а и имени файла сравнивается без учёта регистра; поддерживается бинарный маркер `*`). Строка должна покрывать именно ZIP-ассет, с которого скачивается обновление.

Поток `downloadUpdateZip` (`src/shared/lib/update-service/updateService.ts`):

1. `assertAllowedUpdateUrl` — только `https:` и хост из allowlist `ALLOWED_UPDATE_HOSTS` (`codeberg.org`, `git.lightnode.ru`, `github.com`, `objects.githubusercontent.com`) — `downloadUrlPolicy.ts`. Любой другой хост → ошибка.
2. `downloadChecksumText` (`checksumVerification.ts`) — скачивает текст `SHA256SUMS.txt` (таймаут 10 с). Если у релиза нет sums-ассета → ошибка **до** скачивания ZIP (fail-closed).
3. Скачивается ZIP.
4. `verifyDownloadedZipChecksum` — имя ассета берётся из URL ZIP, digest ищется в sums-файле, затем нативный `apk-installer.computeSha256` (стриминговый `MessageDigest`, lowercase hex) считает digest скачанного файла. Нет строки для ассета или digest не совпал → ошибка **до** распаковки, скачанный ZIP удаляется (`cleanupUpdateFiles`).

Отсутствие/повреждение sums и несовпадение digest трактуются как непредвиденная ошибка (`install-generic`/`unknown`): диалог показывает общий текст, а сырая деталь уходит в глобальный обработчик для диагностики. Распаковка и `PackageInstaller` до успешной проверки не запускаются. Zip-slip дополнительно блокируется в `extractApkFromZip`: запись с `..`-сегментом или абсолютным путём отвергается (`zipEntrySafety.ts`).

### Локальный модуль apk-installer

`modules/apk-installer` — локальный Expo-модуль (Kotlin, `expo-modules-core`), подключён через `"apk-installer": "file:./modules/apk-installer"` в корневом `package.json`. API:

- `installApk(apkPath)` — создаёт `PackageInstaller.SessionParams(MODE_FULL_INSTALL)` с `setAppPackageName(context.packageName)` (self-update), стримит APK в сессию (`openWrite("base.apk", 0, -1)` → `fsync`), коммитит с `PendingIntent` broadcast (`FLAG_UPDATE_CURRENT | FLAG_MUTABLE`). Перед созданием сессии сверяет SHA-256 сертификата подписи APK с сертификатом установленного приложения (`getPackageArchiveInfo`/`getPackageInfo`; API 28+ — `GET_SIGNING_CERTIFICATES`, ниже — `GET_SIGNATURES`): несовпадение или нечитаемый APK → reject с кодом `INSTALL_SIGNATURE_MISMATCH` без создания сессии (defense-in-depth поверх SHA-256 ZIP). Promise резолвится из `BroadcastReceiver` (`STATUS_SUCCESS` → `{ status: 'success' }`; `STATUS_PENDING_USER_ACTION` → запуск системного диалога подтверждения; failure-статусы → reject с описанием). При self-update процесс обычно убивается до `STATUS_SUCCESS` — JS трактует промис как fire-and-forget после commit.
- `canRequestPackageInstalls()` — `packageManager.canRequestPackageInstalls()` (API 26+; ниже — `true`).
- `computeSha256(fileUri)` — стриминговый SHA-256 (`java.security.MessageDigest`, буфер) по файлу; возвращает lowercase hex. Используется проверкой целостности ZIP перед распаковкой; при отсутствии нативного модуля бросает ошибку (веб/Expo Go не устанавливают APK).
- `openInstallPermissionSettings()` — системный экран разрешения.
- `isApkInstallerAvailable()` — безопасная проверка наличия нативного модуля (try/catch вокруг `requireNativeModule`; `false` в Expo Go / web).
- Чистая логика статусов (`ApkInstallStatuses`) покрыта JVM-юнит-тестами (`modules/apk-installer/android/src/test/...`) — `yarn test:native` (см. [`../contracts/native-modules.md`](../contracts/native-modules.md) → «Unit-тесты нативного кода»).

### Разрешение и зависимость

- **`REQUEST_INSTALL_PACKAGES`** объявлен в `app.config.ts` (`android.permissions`) и в закоммиченном `android/app/src/main/AndroidManifest.xml` (CI `prebuild --clean` регенерирует манифест из `app.config.ts`, локальные gradle-сборки используют закоммиченный).
- **Android auto-backup включён** (`android.allowBackup: true` в `app.config.ts`, правила — `plugins/withBackupRules.ts`): данные приложения (плейлисты, история, настройки) намеренно попадают в системный бэкап/Seedvault и переносятся между устройствами; чувствительное исключено через `dataExtractionRules`/`fullBackupContent` — prefs-файл `expo-secure-store` (`SecureStore.xml`) в бэкап не попадает (токены на Android запечатаны Keystore).
- **`SYSTEM_ALERT_WINDOW` заблокирован** (`android.blockedPermissions` в `app.config.ts`, `tools:node="remove"` в манифесте): приложение не запрашивает «поверх других приложений» в рантайме, разрешение осталось от debug-тулинга (release-манифест чист — проверено по merged prodRelease manifest; debug-сборки добавляют её обратно для dev-оверлеев RN — это ожидаемо).
- **`react-native-zip-archive`** — распаковка ZIP-ассета (см. [`../decisions.md`](../decisions.md) → Approved stack → Обновления).
- **`modules/apk-installer`** — локальный модуль для `PackageInstaller` (см. [`../decisions.md`](../decisions.md) → Approved stack → Обновления).

## Push-уведомления vs диалог

Категория `app-update` содержит два действия, оба открывают приложение:

| Триггер                            | Действие                                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Автооткрытие при старте приложения | Диалог подтверждения (`checkForUpdateAction` ставит `updateDialogVisibleAtom = true` в конце экшена — после секции push) — каждый запуск, пока доступна новая версия |
| Push: кнопка «Обновить»            | In-app установка: `startUpdateAction(ctx)` — диалог открывается автоматически с прогрессом                                                                           |
| Push: кнопка «Перейти»             | Открытие страницы релизов в браузере (`Linking.openURL`)                                                                                                             |

Push обрабатывается через `useUpdateNotificationResponse`: `start-in-app-update` запускает `startUpdateAction` (диалог виден благодаря `updateDialogVisibleAtom`), `open-release-url` ведёт в браузер.

## Push-уведомления

`src/shared/lib/notifications/`:

- `ensureNotifications.ts` — ленивый синглтон `ensureNotifications` (динамический импорт `expo-notifications`, установка `setNotificationHandler` один раз за сессию; возвращает `null` при ошибке загрузки). Не зависит от остальных модулей папки — разрывает цикл зависимостей. Файл назван по единственному публичному экспорту (конвенция как у `usePlayer.ts`); прежнее имя `notificationsApi.ts` конфликтовало по регистру с тип-фасадом `NotificationsApi.ts` на файловых системах без учёта регистра, отсюда переименование.
- `notificationsHelpers.ts` — `scheduleNotification`, `requestPermissions`, `hideNotification` (в Expo Go — no-op). Перед планированием/скрытием уведомления гарантирует регистрацию категории через мемоизированный промис `ensureCategory()` (один вызов `setupUpdateNotificationCategory` за сессию; в `requestPermissions` — fire-and-forget). `scheduleNotification(content, identifier, groupId, channelId?)` — необязательный `channelId`: на Android превращается в `trigger: { type: 'channel', channelId }` (уведомление уходит в указанный канал, звук/важность канала управляют поведением), на остальных платформах `trigger: null`. Необязательный `content.sound` (`null | boolean | string`) пробрасывается в контент (по умолчанию `null`). **Внимание (iOS):** `null` декодируется в nil → системный звук по умолчанию (`NotificationRecords.swift`), тишина гарантируется только `sound: false`; на Android 8+ звук управляется каналом, контентный `sound` игнорируется.
- `notificationActions.ts` — `setupUpdateNotificationCategory` (категория `app-update` с действиями `start-in-app-update` («Обновить») и `open-release-url` («Перейти»), канал `app-update`), `addNotificationResponseListener`.
- `NotificationsApi.ts` — тип-фасад над `expo-notifications`.

Граф зависимостей ацикличен: `notificationsHelpers → notificationActions → ensureNotifications`; `index.ts` реэкспортирует публичное API.

При доступном обновлении `checkForUpdateAction` планирует локальное уведомление «Доступна новая версия» (если для этой версии ещё не показывалось — ключ `LAST_UPDATE_NOTIFIED_KEY`).

### Поток планирования уведомления

1. `requestPermissions()` — запрос разрешений (в Expo Go возвращает `false`).
2. `scheduleNotification({ title, body, categoryIdentifier: 'app-update', data: { releaseUrl } }, UPDATE_NOTIFICATION_ID, UPDATE_NOTIFICATION_GROUP)` — отложенное уведомление с `trigger: null` (мгновенное).
3. запись `LAST_UPDATE_NOTIFIED_KEY = release.version`, чтобы не повторять уведомление на ту же версию.

## Фича update-notification

`src/features/update-notification/lib/useUpdateNotificationResponse.ts` — `useUpdateNotificationResponse()`, вызывается в `_RootLayout`. Слушает ответы на push; при `actionIdentifier === 'start-in-app-update'` запускает `startUpdateAction(ctx)` (in-app установка с автоматически открытым диалогом); при `actionIdentifier === 'open-release-url'` открывает `releaseUrl` через `Linking.openURL` (только `https://`).

### compareVersions

`compareVersions(a, b)` (`src/shared/lib/version-check/compareVersions.ts`) нормализует версии (`normalizeVersion`): убирает `v` и всё после `-`, разбивает на части по `.` и сравнивает покомпонентно (отсутствующие части = 0). Возвращает `1` если `a > b`, `-1` если `a < b`, иначе `0`.

## Связанные документы

- [state.md](./state.md) — атомы обновления в карте состояния
- [offline-and-network.md](./offline-and-network.md) — гейт проверки по `isOnlineAtom`
- [web.md](./web.md) — PWA обновляется через Service Worker, диалог отключён на `Platform.OS === 'web'`
- [storage.md](../contracts/storage.md) — ключ `last-update-notified-version`
- [../decisions.md](../decisions.md) — `react-native-zip-archive` в Approved stack

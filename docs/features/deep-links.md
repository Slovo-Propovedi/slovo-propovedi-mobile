# Android App Links (глубокие ссылки)

**Слой:** `app.config.ts` (`android.intentFilters`), `android/` (prebuild), `public/.well-known/assetlinks.json`, `nginx.conf`, `src/pages/playlist` (сетевой резолв по id)
**Статус:** заявлены 2 маршрута (`/listen`, `/listen/playlist`), локально проверены (`yarn web:build` + preview); прод-деплой `assetlinks.json` не выполнен — ручной шаг

## Обзор

Приложение заявляет **Android App Links** для хоста `https://app.slovo-propovedi.ru` — по клику на ссылку этого домена открывается установленное приложение вместо браузера. Хост **не захардкожен**: он берётся из обязательной переменной `EXPO_PUBLIC_WEB_HOSTNAME` (валидируется zod в `src/shared/config/env.ts`, без значения по умолчанию — при незаданной переменной приложение падает fail-fast). Значение обязано совпадать с доменом, на котором задеплоен `assetlinks.json` (prod: `app.slovo-propovedi.ru`); CI инжектит его и в prebuild-, и в gradle-шаг `release.yml`. Экспо-роутер навигирует сам, без кастомной linking-конфигурации: заявленные пути совпадают с маршрутами `app/`, параметры приходят через `useLocalSearchParams`, как при обычной внутренней навигации.

Механика (Android):

1. **Манифест** (`<intent-filter android:autoVerify="true">`) заявляет, что приложение умеет открывать https-ссылки указанного хоста и путей;
2. **assetlinks.json** на том же хосте подтверждает связку `<package_name, отпечаток подписи>` — только при совпадении система считает заявку **verified** и открывает ссылки без системного диалога;
3. Оба артефакта генерируются в репозитории: манифест — prebuild'ом из `app.config.ts`, assetlinks.json — лежит в `public/` и попадает в веб-дистрибутив.

Кастомная схема теперь **per-flavor**: main-манифест схемы не содержит (поле `scheme` убрано из `app.config.ts`), `plugins/withAndroidFlavors.ts` пишет source-set манифесты с аддитивным VIEW-фильтром — prod `slovo-propovedi://`, dev `slovo-propovedi-dev://` — чтобы параллельная установка dev+prod не конфликтовала за одну схему (фильтры без `autoVerify`).

## Конфиг: `app.config.ts`

```typescript
import { ENV } from './src/shared/config/env.ts'

// Android App Links host, validated together with the rest of the EXPO_PUBLIC_*
// config in src/shared/config/env.ts (zod, no defaults — a missing var must fail
// prebuild rather than emit an unverifiable App Links host). Relative import (the
// Expo config evaluator resolves neither tsconfig path aliases nor extensionless
// specifiers, hence the explicit .ts — same as the ./plugins/*.ts imports below).
// CI prebuild injects the env (see .forgejo/workflows/release.yml).
const webHostname = ENV.webHostname

intentFilters: [
  {
    action: 'VIEW',
    autoVerify: true,
    category: ['BROWSABLE', 'DEFAULT'],
    data: [
      { host: webHostname, path: '/listen', scheme: 'https' },
      { host: webHostname, path: '/listen/playlist', scheme: 'https' },
    ],
  },
],
```

После `npx expo prebuild --platform android` (что при изменении `app.config.ts` делать обязательно, см. [../BUILD-LOCAL.md](../BUILD-LOCAL.md) → «Prebuild и config-плагины») в `AndroidManifest.xml` основной activity появляется:

```xml
<intent-filter android:autoVerify="true" data-generated="true">
  <action android:name="android.intent.action.VIEW"/>
  <data android:host="app.slovo-propovedi.ru" android:path="/listen" android:scheme="https"/>
  <data android:host="app.slovo-propovedi.ru" android:path="/listen/playlist" android:scheme="https"/>
  <category android:name="android.intent.category.BROWSABLE"/>
  <category android:name="android.intent.category.DEFAULT"/>
</intent-filter>
```

## Почему точные `path`, а не `pathPrefix`

Пути объявлены **точно** (`path`), а не префиксом (`pathPrefix`) — заявка покрывает ровно два маршрута:

- `/listen` — таб «Слушать» (`app/(tabs)/listen/index.tsx` → `ListenScreen`);
- `/listen/playlist` — экран плейлиста (`app/(tabs)/listen/playlist.tsx` → `PlaylistScreen`), id приходит в query (`?playlist=<uuid>`).

**Query-строка в сравнении путей не участвует** — `/listen/playlist?playlist=<uuid>` матчится по `path`, а сам параметр expo-router передаёт в `useLocalSearchParams`.

Всё, что не совпадает точно, **остаётся в браузере** (веб-SPA открывается как раньше):

- `/listen/playlist-list` — список плейлистов **не заявлен**: экран резолвит раздел по id из секций/кэша, сетевого резолва по id нет → открытие извне показало бы пустой экран. Расширение заявки — отдельная процедура (см. ниже);
- опечатки и прочие маршруты (`/listenXYZ`, `/settings`, `/read` и т.п.) — тоже в браузере, потому что матчинг точный.

## Поведение незаявленных путей

- **Приложение установлено** — система сравнивает URL с заявленными путями: совпадение → открыть приложение (`launchMode="singleTask"`, холодный старт или поверх запущенного), несовпадение → открыть в браузере.
- **Приложение не установлено** — браузер открывает веб-SPA как обычно (`try_files`-фолбэк nginx отдаёт индекс).

## Порядок расширения заявки

Чтобы заявить новый маршрут (например `/listen/playlist-list`):

1. **Сначала** дать экрану сетевой резолв по id (по образцу `src/pages/playlist/lib/resolvePlaylistFromApi.ts` + трёхуровневый `usePlaylistById`) — иначе холодный старт по ссылке покажет заглушку «не найдено», пока секции не загрузил экран «Слушать»;
2. **Потом** добавить точный `path` в `intentFilters` в `app.config.ts`;
3. Запустить `npx expo prebuild --platform android` (закоммитить regenerated `android/` в том же PR) и добавить/обновить проверки.

## Файл верификации: `public/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ru.slovopropovedi",
      "sha256_cert_fingerprints": ["FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C"]
    }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ru.slovopropovedi.dev",
      "sha256_cert_fingerprints": ["FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C"]
    }
  }
]
```

- массив из двух statements: prod-пакет `ru.slovopropovedi` и dev-пакет `ru.slovopropovedi.dev`. Оба flavor подписаны одним `android/app/debug.keystore`, поэтому отпечатки совпадают — dev-сборки теперь **проходят** автоматическую верификацию App Links наравне с prod;
- отпечаток — SHA256 ключа, которым подписывается `assembleProdRelease`: сейчас это `android/app/debug.keystore` (alias `androiddebugkey`), см. [../BUILD-LOCAL.md](../BUILD-LOCAL.md) → «Android Release Build» («By default, release builds use the debug keystore»);
- лежит в `public/`, поэтому `yarn web:build` (`expo export -p web`) копирует его в `dist/.well-known/assetlinks.json` автоматически.

**Правило обновления при смене ключа подписи:** когда `release.keystore` заменит debug-подпись — **добавить** новый SHA256 **вторым элементом** массива `sha256_cert_fingerprints` (Android допускает несколько отпечатков) и передеплоить веб. Не заменять — иначе установленные ранее сборки перестанут верифицироваться.

## nginx: `/.well-known/`

Для верификации Google скачивает `https://app.slovo-propovedi.ru/.well-known/assetlinks.json`. В `nginx.conf` после блока `location ^~ /_expo/` добавлен:

```nginx
# Android App Links verification file: serve directly, no SPA fallback.
# ^~ is REQUIRED: the regex dot-deny rule (location ~ /\.) would otherwise
# win over a plain prefix location and return 403 for /.well-known/*.
location ^~ /.well-known/ {
    try_files $uri =404;
    default_type application/json;
}
```

**Почему `^~`:** ниже в конфиге есть regex-правило `location ~ /\. { deny all; }` (защита от листинга dot-файлов). Regex-локации выигрывают у обычных prefix-локаций независимо от порядка объявления — без `^~` запрос `/.well-known/assetlinks.json` попал бы в deny и вернул `403`. Модификатор `^~` отключает regex-поиск для этого префикса. `try_files $uri =404` отдаёт файл как есть (без SPA-фолбэка), `default_type application/json` — корректный Content-Type.

Локальная проверка деплоя: `yarn web:build` → `dist/.well-known/assetlinks.json` существует → `yarn web:preview` отдаёт его с `200` + `application/json`.

**Прод-деплой не выполнен** — `scripts/vps-deploy-web.sh` запускается на VPS из Forgejo release-воркфлоу (общий флоу деплоя веб-приложения — [web.md](./web.md) → «Деплой»). После деплоя вручную проверить:

```bash
curl -sI https://app.slovo-propovedi.ru/.well-known/assetlinks.json   # 200, application/json, без редиректа
curl -sI https://app.slovo-propovedi.ru/.well-known/does-not-exist    # 404, НЕ 403
```

## Тестирование на устройстве (adb, Android 12+)

`pm get-app-links` доступен с Android 12 — тестировать на Android 12+.

```bash
# Статус верификации prod (минимум ~20с после установки — система проверяет в фоне):
adb shell pm get-app-links ru.slovopropovedi
# ожидаем: app.slovo-propovedi.ru: verified
# dev-флейвор заявляет тот же домен и верифицируется так же (мультипакетный assetlinks.json):
adb shell pm get-app-links ru.slovopropovedi.dev
# ожидаем: app.slovo-propovedi.ru: verified
```

Если статус `legacy_failure` (например, переустановка/очистка данных раньше, чем система успела проверить) — форсировать перепроверку:

```bash
adb shell pm verify-app-links --re-verify ru.slovopropovedi
```

Открытие ссылки (имитация клика из браузера):

```bash
adb shell am start -a android.intent.action.VIEW -c android.intent.category.BROWSABLE \
  -d "https://app.slovo-propovedi.ru/listen/playlist?playlist=<uuid>"
```

Нюансы прогона:

- **Холодный старт** — чистый сценарий «только что установили и кликнули ссылку»: `adb shell pm clear ru.slovopropovedi` (после clear при необходимости повторить `verify-app-links --re-verify`), затем `am start` извне;
- **Тёплый старт** — приложение уже запущено: `am start` пушит экран плейлиста поверх текущего экрана.

## Ограничения

- **URL, набранный вручную в адресной строке браузера, НИКОГДА не открывает приложение** — это поведение платформы: App Links работают только по клику на ссылку (из другого приложения/поиска), а не из адресной строки.
- **Expo Go не поддерживает App Links** — проверять только по локальным сборкам (`yarn build-local-debug:android` и prod-вариант).
- **dev-флейвор `ru.slovopropovedi.dev`** получает тот же `<intent-filter>` (https-фильтр лежит в общем `src/main`; кастомные схемы — per-flavor, см. выше) и **верифицируется так же, как prod**: его пакет добавлен вторым statement'ом в `assetlinks.json` (см. выше), поэтому `adb shell pm get-app-links ru.slovopropovedi.dev` тоже показывает `verified`. Нюанс: при **параллельной установке dev + prod** обе сборки заявляют один домен — система может показать выбор приложения (chooser) или открыть то, что назначено по умолчанию; назначить дефолт можно в системных настройках App Links (Settings → Open by default / «Открывать по умолчанию»).
- **Android < 12** — `pm get-app-links` недоступен; верификацию наблюдать по факту открытия ссылки.
- Верификация происходит при **установке** обновления приложения: после смены подписи/assetlinks.json нужно переустановить (или `pm clear`) и подождать ≥20с; `--re-verify` форсирует.

## Задел iOS (не реализовано)

Краткий план на будущее (iOS App Links / Universal Links):

- `app.config.ts` → `ios.associatedDomains: ['applinks:app.slovo-propovedi.ru']`;
- файл `/.well-known/apple-app-site-association` (AASA) — нужен Apple Team ID и `appIDs` вида `<TEAMID>.ru.slovopropovedi`, path-паттерны для заявленных маршрутов;
- Apple кеширует AASA ~24ч, перечитывает при update-install — итерация медленная;
- Expo Go не поддерживает Universal Links (тестировать по локальным сборкам);
- нюанс: тап по ссылке того же домена в Safari iOS может не открывать приложение — возможный обход через поддомен `go.<domain>` для внешних ссылок.

## Связанные документы

- [navigation.md](./navigation.md) — маршруты, на которые ведут App Links
- [web.md](./web.md) — веб-платформа и деплой (`yarn web:build`, `nginx.conf`); SPA-фолбэк
- [../screens/playlist.md](../screens/playlist.md) — трёхуровневый резолв плейлиста (секции → кэш → `GET /playlists/{id}`)
- [../contracts/rest-api.md](../contracts/rest-api.md) — сетевая часть резолва (`playlistControllerFindOne`)
- [../BUILD-LOCAL.md](../BUILD-LOCAL.md) — prebuild, подпись (debug.keystore), flavors dev/prod
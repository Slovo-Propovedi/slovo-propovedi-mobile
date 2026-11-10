# CI: Forgejo оркестрирует, GitHub-hosted исполняет

**Статус:** пилот в `slovo-propovedi-mobile`; распространение на остальные репозитории — после живой проверки (см. [`debt.md`](../debt.md) → «CI: Forgejo → GitHub»).

Forgejo остаётся источником истины: секреты, keystore, релизы, коммит-статусы. GitHub-hosted раннеры выполняют только вычисления (тяжёлые проверки и сборки), а результат возвращается в Forgejo артефактами и статусом `CI / checks`.

## Зачем

У Forgejo-раннера один хост на 4 ГБ и два слота: Gradle, Metro и jest-expo упираются в память, а `memory-heavy-jobs` сериализует сборки, чтобы не ловить OOM (exit 137). GitHub-hosted раннеры дают ~16 ГБ и независимые машины; для публичных репозиториев они бесплатны. При этом всё чувствительное (release-keystore, токены публикации, создание релиза) остаётся в Forgejo — на GitHub не уезжает ни один секрет.

## Архитектура и поток

```
Forgejo (оркестратор, секреты, релизы)
   push / тег
     |
     |  .forgejo/workflows/ci.yml | release.yml
     v
scripts/ci/github-dispatch.sh -- workflow_dispatch --> GitHub (зеркало)
     |   ждёт SHA, поллит run, скачивает артефакты        .github/workflows/*
     v                                                        |
Forgejo: статус CI / checks, подпись, публикация <-- артефакты
```

1. Push или тег приходит в Forgejo; workflow вызывает `scripts/ci/github-dispatch.sh`.
2. Диспетчер ждёт, пока коммит появится в GitHub-зеркале, и отправляет `workflow_dispatch` в `.github/workflows/ci.yml` или `release.yml`.
3. GitHub выполняет composite-действия из `actions/` и складывает результаты в артефакты.
4. Диспетчер поллит run; при успехе скачивает и распаковывает запрошенные артефакты, при реальном провале — печатает хвост логов упавших job'ов, при инфраструктурном сбое — отменяет run и сигнализирует fallback.
5. Forgejo подписывает APK, публикует релиз и ставит статус — своими секретами и в своём UI.

## Контракт диспетчера (`scripts/ci/github-dispatch.sh`)

Обязательные переменные: `GH_TOKEN`, `GH_REPO` (`owner/name` зеркала), `WORKFLOW` (имя файла, не display-name), `REF` (ветка или тег — **никогда не SHA**, dispatch API его отвергает), `SHA` (полный 40-hex коммит: ждём его в зеркале и коррелируем run по `head_sha`).

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `MIRROR_WAIT_MIN` | `5` | сколько ждать появления SHA в GitHub-зеркале |
| `QUEUE_TIMEOUT_MIN` | `30` | сколько run может висеть в `queued` до отмены |
| `RUN_TIMEOUT_MIN` | `90` | общий лимит времени run до отмены |
| `ARTIFACTS` | — | `name=outdir` через запятую; архивы GitHub распаковываются в `outdir` |
| `DISPATCH_INPUTS` | — | JSON-объект, уходит в тело dispatch как `inputs` (например, `{"mode":"native"}`) |
| `GH_API_BASE` | `https://api.github.com` | подмена API для self-test/enterprise |
| `GH_DISPATCH_DRY_RUN` | — | `1` — напечатать план вызовов без сети и выйти 0 |

Коды возврата — это и есть контракт с вызывающим workflow:

| Код | Значение | Что делает вызывающий |
| --- | --- | --- |
| `0` | run успешен, все запрошенные артефакты скачаны | продолжить (статус success) |
| `1` | run завершился неуспешно (тесты/сборка) или артефакта нет | **не перезапускать локально**; провалить job |
| `2` | ошибка использования/окружения (нет env, битый SHA/REF/ARTIFACTS, нет jq/unzip) | провалить job |
| `3` | коммит не дошёл до зеркала или run не появился | провалить job (это не инфраструктурный fallback) |
| `42` | инфраструктура: dispatch отвергнут, queue-timeout или run-timeout; run отменён через `cancel` | запустить локальный fallback |

Детали поведения:

- Перед отменой по таймауту диспетчер делает `POST .../actions/runs/<id>/cancel` — «зависший» run не продолжит жечь минуты после fallback.
- Артефакты GitHub отдаются zip-архивами; диспетчер проверяет непустоту и распаковывает их в целевой каталог (`unzip`). Поэтому `ARTIFACTS="unsigned-apk=unsigned-apk"` даёт в `unsigned-apk/` сам APK, а не вложенный zip.
- В stdout печатается одна машинная строка `GH_RUN_URL=<url>` (до поллинга), поэтому вызывающий шаг может приложить ссылку к статусу на путях `0/1/42`. Весь человекочитаемый прогресс идёт в stderr.
- `REF`/`SHA` намеренно разные: dispatch принимает ветку/тег, а ожидание в зеркале и корреляция run — по коммиту.

Самопроверка: `scripts/ci/github-dispatch-selftest.sh` поднимает локальный мок `scripts/ci/mock-github-api.py` на `GH_API_BASE` и проверяет успех с артефактом, реальный провал, queue-timeout с cancel, передачу `DISPATCH_INPUTS` и dry-run. Сеть не нужна.

## Контракт статусов

Автоматические статусы Forgejo имеют вид `<workflow> / <job>` (`CI / dco`, `CI / remote`, `CI / local`, `CI / gate`); некоторые версии дописывают событие (`CI / dco (push)`). Имена job'ов подобраны так, чтобы ни один автостатус не начинался с `CI / checks`: этот контекст ставит только job `gate` вручную, через `scripts/ci/forgejo-set-status.sh` (state: pending|success|error|failure|warning).

`create-release` в `.forgejo/workflows/release.yml` ждёт успешный статус по префиксу `CI / checks` у коммита тега (первая, то есть самая свежая запись). Следствия:

- нельзя добавлять job с именем `checks` — его автостатус `CI / checks (…)` пересечётся с префиксом;
- переименование `gate` или смена контекста ручного статуса требует правки ожидания в `create-release`;
- статус можно ставить повторно (re-run), свежая запись перекрывает старую.

Вердикт `gate`: `success`, если локальный fallback отработал успешно **или** локальный не запускался (skipped), а remote завершился успешно; иначе `failure`. Реальный провал remote (`exit 1`) локально не повторяется — gate падает.

## CI-поток (`.forgejo/workflows/ci.yml`)

Триггеры прежние (push/PR в `main`); на тегах job'ы пропускаются тем же guard'ом `github.ref_type != 'tag'`, что и `dco`.

```
dco --> remote --(exit 42, fallback=true)--> local
  |         |                                    |
  +---------+--------------> gate <--------------+
                              |
                        CI / checks (commit status)
```

- `dco` — проверка `Signed-off-by`, без изменений.
- `remote` — checkout + `scripts/ci/github-dispatch.sh`; выход 0 → `fallback=false`, 42 → `fallback=true` + warning и `run_url`; прочие коды проваливают job. В группе `memory-heavy-jobs` **не состоит** — это лёгкий сетевой job.
- `local` — `needs: [dco, remote]`, `if: always() && needs.remote.outputs.fallback == 'true'`; запускает `./actions/checks` с `profile: constrained`; держит `memory-heavy-jobs`, чтобы не пересечься с релизной сборкой на общем хосте.
- `gate` — `always()`, ставит статус и пишет таблицу в job summary (remote/local/verdict/ссылка на run). На тегах пропускается, чтобы не поставить ложный `failure` на коммит тега.

Логика проверок живёт в `actions/checks` (patch-package, `check:types`, `check:fsd`, lint, jest, нативные unit-тесты Gradle). `profile: constrained` включает `--maxWorkers=2` для jest; `profile: hosted` оставляет дефолт. Composite-шаги не поддерживают `timeout-minutes` — лимиты задаёт вызывающий workflow (`.github/workflows/ci.yml` — 90 минут).

## Релизный поток (`.forgejo/workflows/release.yml`)

Режим (`native`/`js-only`) по-прежнему определяет job `changes`; описание режимов, RUNTIME_VERSION-гейтов и публикации — в [`updates.md`](./updates.md). Оркестрация меняет только исполнителя сборки:

```
changes --> create-release (только native)
   |
   +--> build-remote --> android-package --> publish-release
   |        |              (native)
   |        +--> web-package  (всегда)
   |        |
   |        +- fallback=true -> android-package/web-package собирают локально
   |
   +--> ota (только js-only, остаётся на Forgejo)
```

- `build-remote` — лёгкий диспетчер: `DISPATCH_INPUTS={"mode":...}`, `ARTIFACTS` по режиму (`unsigned-apk` + `web-dist` для native, только `web-dist` для js-only), выход 0/42 как в CI. Скачанные каталоги он перекладывает в Forgejo-артефакты (v3) с теми же именами; при `fallback=true` ничего не загружает — локальные job'ы создадут файлы сами. В группе `memory-heavy-jobs` не состоит. На стороне GitHub job `android` включается только при `mode=native`, а job `web` выполняется всегда — поэтому js-only тег всё равно получает `web-dist`.
- `android-package` (native) — либо скачивает `unsigned-apk` и подписывает его, либо при fallback собирает и подписывает локально; результат — артефакт `release-assets`.
- `web-package` — берёт `web-dist` из GitHub (или локальный экспорт при fallback), затем выполняет прежние шаги деплоя: сборка web-образа, деплой на VPS, zip и прикрепление к релизу в native-режиме.
- `publish-release` — `needs: [create-release, android-package]`; скачивает `release-assets` и публикует в Forgejo, GitHub и Codeberg (без изменений).
- `ota` — только js-only; остаётся локальным (см. ниже).

Артефактные контракты:

| Артефакт | Создаёт | Потребляет |
| --- | --- | --- |
| `unsigned-apk` | GitHub `release.yml` (job `android`, `signing: none`) | `build-remote` → `android-package` |
| `web-dist` | GitHub `release.yml` (job `web`) | `build-remote` → `web-package` |
| `release-assets` (zip + `SHA256SUMS.txt`) | `android-package` (обе ветки) | `publish-release` |
| `web-dist` (Forgejo) | `build-remote` | `web-package` (docker build + zip в релиз) |

Группа `memory-heavy-jobs` держит только тяжёлые job'ы: `android-package`, `web-package`, `ota` (и `local` в CI). `build-remote`, `create-release` и `publish-release` вне группы: это сетевые job'ы, а `create-release` ещё и ждёт `CI / checks` — займи он слот, локальный fallback не смог бы получить раннер (дедлок).

## Неподписанный APK и подпись

GitHub не получает keystore. Его сборка идёт с `signing: none`: `scripts/gradle/disable-release-signing.gradle` обнуляет `buildTypes.release.signingConfig` (без него `android/app/build.gradle` откатился бы к debug-ключу), поэтому на выходе получается `app-prod-release-unsigned.apk` и артефакт `unsigned-apk`.

Подпись выполняет Forgejo в `android-package` → `actions/sign-android`:

1. `zipalign -f 4`;
2. `apksigner sign` с `android/app/release.keystore` и `ANDROID_*` env;
3. `apksigner verify --print-certs` — жёсткий гейт против `APK_SIGNER_SHA256` (один или несколько 64-hex digest'ов через запятую — задел на ротацию ключа);
4. переименование в `Slovo.Propovedi v<версия>.apk`, zip `slovo-propovedi-v<версия>.zip` и `SHA256SUMS.txt` в `release-assets/`.

Детали keystore-секретов и локальной сборки — в [`BUILD-LOCAL.md`](../BUILD-LOCAL.md); контракт подписи и релиза — в [`updates.md`](./updates.md) → «Подпись и контроль целостности релиза (CI)».

## Секреты и переменные

Композитные actions читают конфигурацию из обычного окружения: `secrets` им недоступны, а `vars` не попадают в env сами по себе — значения передаёт вызывающий workflow через `env:` шага. Поэтому на каждой стороне свой набор.

На GitHub (репозиторий-зеркало) секретов **нет**. Нужны 10 repository/org variables, потому что сборка выполняется там:

- plain-переменные (их же валидирует `actions/release-android`): `BACKEND_API_HOSTNAME`, `LANDING_HOSTNAME`, `WEB_HOSTNAME`, `MIRROR_CODEBERG_URL`, `MIRROR_GITHUB_URL`, `MOBILE_REPOSITORY_NAME`;
- OTA/xprem (своих plain-аналогов нет): `EXPO_PUBLIC_OTA_URL`, `EXPO_PUBLIC_XPREM_APP_ID`, `EXPO_PUBLIC_XPREM_CHANNEL_NAME`, `EXPO_PUBLIC_XPREM_BRANCH_NAME`.

`EXPO_PUBLIC_*` host/mirror/repo имена отдельными переменными не дублируются: `.github/workflows/release.yml` выводит их из plain-переменных workflow-level `env:`-блоком (`EXPO_PUBLIC_BACKEND_API_HOSTNAME: ${{ vars.BACKEND_API_HOSTNAME }}` и т.д.) — та же схема, что была в prebuild-шаге старого Forgejo `release.yml`. `EXPO_PUBLIC_REPOSITORY_URL`/`_OWNER` тоже не дублируются: actions берут их из `github.server_url`/`github.repository_owner`. Composite-шаги наследуют этот `env:` и читают только обычное окружение; значения публичны по природе — вшиваются в клиентский бандл и манифест.

В Forgejo:

| Имя | Тип | Назначение |
| --- | --- | --- |
| `CI_GITHUB_TOKEN` | secret | PAT для dispatch и чтения run/артефактов (статусы не пишутся); classic-скоупов `repo` + `workflow` достаточно. Возможная замена на `MIRROR_GITHUB_TOKEN` — решается на живой проверке. |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | secrets | release-keystore; используются только в `android-package` на Forgejo |
| `APK_SIGNER_SHA256` | variable | пиннинг сертификата, жёсткий гейт `sign-android` |
| хост/mirror-переменные и `PACKAGE_REGISTRY_TOKEN`, `VPS_*`, `XPREM_EOO_TOKEN` | как раньше | деплой web/OTA/публикация (см. [`updates.md`](./updates.md), [`web.md`](./web.md)) |

Имя dispatch-секрета выбрано не случайно: Forgejo резервирует префиксы `GITHUB_`, `GITEA_` и `FORGEJO_` за автоматическими токенами, поэтому секрет с префиксом `GITHUB_` создать нельзя. Используется `CI_GITHUB_TOKEN` — org-level секрет (при распространении паттерна общий для всех репозиториев организации). Подходит classic PAT со скоупами `repo` + `workflow`: их хватает на dispatch, чтение run/артефактов, работу без записи статусов и push `.github/workflows` при зеркалировании.

Для одноразовой настройки зеркала нужны `FORGEJO_TOKEN` (repo admin) и `GITHUB_MIRROR_TOKEN` (Contents write на GitHub-репозиторий) — их читает только `scripts/ci/setup-github-mirror.sh`, в workflow они не попадают.

## Fallback-политика

- `exit 42` — единственный сигнал «GitHub сейчас недоступен». Сюда попадают отвергнутый dispatch (401/403/5xx), billing-блок (run навсегда остаётся в `queued`), общий queue-timeout и превышение `RUN_TIMEOUT_MIN`. Перед выходом run отменяется.
- Пороги заданы в dispatch-шагах workflow и могут быть уменьшены для конкретного прогона (`QUEUE_TIMEOUT_MIN`, `RUN_TIMEOUT_MIN`, `MIRROR_WAIT_MIN`).
- `exit 1` — реальный провал тестов/сборки: локальный повтор запрещён (он не «лечит» красные тесты и тратит дефицитный раннер).
- `exit 3` — коммит не доехал до зеркала или run не появился: job падает, fallback не запускается (это ошибка настройки/зеркала, а не перегрузка).
- В релизе fallback означает: `build-remote` не загружает артефакты, а `android-package`/`web-package` собирают локально тем же composite-действием с `profile: constrained`.

## Зеркало GitHub

`scripts/ci/setup-github-mirror.sh` идемпотентно создаёт push-mirror Forgejo → GitHub:

```
scripts/ci/setup-github-mirror.sh
  FORGEJO_TOKEN=... GITHUB_MIRROR_TOKEN=...
```

- по умолчанию `FORGEJO_REPO=Slovo_Propovedi/slovo-propovedi-mobile` → `GITHUB_REPO=Slovo-Propovedi/slovo-propovedi-mobile` (в Forgejo подчёркивания, в GitHub дефисы);
- интервал `MIRROR_INTERVAL` (по умолчанию `8m0s`), `sync_on_commit: true` — каждый push и тег уезжает сразу;
- существующий mirror (`remote_name: github-mirror` или адрес с `github.com/<repo>`) не пересоздаётся — печатается «already configured»;
- секреты не печатаются: POST-тело живёт в приватном temp-файле, dry-run (`SETUP_MIRROR_DRY_RUN=1`) показывает запрос с `<redacted>`.

Благодаря зеркалу `.github/workflows/*` автоматически оказываются на default-ветке GitHub, а HEAD тега совпадает с Forgejo — диспетчер ждёт именно этот SHA.

## Что осталось локальным (намеренно)

- job `ota` в `release.yml` — `expo export` + публикация в xprem с `XPREM_EOO_TOKEN`; перенос потребовал бы OTA-секрета на GitHub ради одного шага;
- `.forgejo/workflows/ota-publish.yml` — ручной хотфикс без тега (secret-bound + web-деплой);
- `.forgejo/workflows/xprem-cleanup.yml` — обслуживание OTA-сервера по расписанию.

Отдельно на GitHub-hosted выполняется **Renovate** (`.github/workflows/renovate.yml`): платформа остаётся `forgejo` (endpoint `https://git.lightnode.ru/api/v1`), но тяжёлое обновление `yarn.lock` больше не грузит 4-ГБ хост. Нужны org secrets `RENOVATE_TOKEN` (Forgejo bot PAT) и `RENOVATE_GITHUB_COM_TOKEN` плюс org var `RENOVATE_GIT_AUTHOR` — значения дублируются с Forgejo. `.forgejo/workflows/renovate.yml` оставлен только для ручных аварийных запусков (расписание оттуда убрано).

## Как проверить живьём

1. **Зеркало:** запустить `scripts/ci/setup-github-mirror.sh` с `FORGEJO_TOKEN`/`GITHUB_MIRROR_TOKEN`; повторный запуск должен напечатать «already configured».
2. **GitHub-variables:** завести 10 переменных — 6 plain (`BACKEND_API_HOSTNAME`, `LANDING_HOSTNAME`, `WEB_HOSTNAME`, `MIRROR_CODEBERG_URL`, `MIRROR_GITHUB_URL`, `MOBILE_REPOSITORY_NAME`) и 4 OTA/xprem (`EXPO_PUBLIC_OTA_URL`, `EXPO_PUBLIC_XPREM_APP_ID`, `EXPO_PUBLIC_XPREM_CHANNEL_NAME`, `EXPO_PUBLIC_XPREM_BRANCH_NAME`); `EXPO_PUBLIC_*` host/mirror workflow выводит из plain-переменных сам.
3. **Токен dispatch:** org-level секрет `CI_GITHUB_TOKEN` в Forgejo (classic PAT: `repo` + `workflow`).
4. **CI:** push в `main` → `dco` → `remote` → `gate`; в Forgejo появился статус `CI / checks` со ссылкой на GitHub-run; job summary показывает таблицу remote/local/verdict.
5. **Релиз:** prerelease-тег `v*` → `changes` → `build-remote` → `android-package`/`web-package`; проверить артефакты `release-assets` (zip + `SHA256SUMS.txt`); `publish-release` — на реальном теге (он создаёт релиз).
6. **Fallback:** временно выставить `QUEUE_TIMEOUT_MIN=0` в dispatch-шаге (или использовать заведомо невалидный `GH_TOKEN`) — должен отработать `local`/локальная сборка, а gate — success.
7. **Без сети:** `GH_DISPATCH_DRY_RUN=1 bash scripts/ci/github-dispatch.sh` и `bash scripts/ci/github-dispatch-selftest.sh`.

## Ограничения и известные компромиссы

- **Composite actions читают только обычное окружение.** `secrets` им недоступны, `vars` сами в env не попадают; вся конфигурация приходит через `env:` вызывающего workflow — забытый маппинг даёт пустые значения и провал валидации действия.
- **Вложенные локальные actions не используются.** Общая логика вынесена в `scripts/ci/*`, а не в композицию `uses: ./actions/...` внутри композита — поддержка вложенных локальных actions не гарантирована на обеих платформах.
- **`profile: constrained | hosted`.** Один и тот же composite управляет памятью: `constrained` включает ограничения Gradle/Metro/jest под 4 ГБ хост, `hosted` — дефолты GitHub-раннера.
- **`curl -q` в скриптах.** Нейтрализует пользовательский `~/.curlrc` (например, `--continue-at -` ломает POST); на раннере поведение не меняется.
- **`pull_request`-события не покрыты пилотом.** Диспетчер получает `github.ref_name`/`github.sha` в расчёте на push/тег; семантика PR-событий (merge-commit vs head, ref-нейминг) не адаптирована — CI на PR остаётся локальным/непроверенным.
- **Таймауты — на вызывающей стороне.** Composite-шаги не поддерживают `timeout-minutes`; лимиты живут в `.github/workflows/*` и в dispatch-конфиге.
- **Артефакт-actions зажаты на v3** на обеих сторонах (Forgejo не реализует GitHub Results API) — подробности и симптом в [`updates.md`](./updates.md) и [`debt.md`](../debt.md).
- **GitHub-workflow'ы — только `workflow_dispatch`.** Никаких `push`/`pull_request` триггеров: зеркало не должно запускать сборки само по себе.

## Распространение на остальные репозитории

Скрипты уже параметризованы: `scripts/ci/github-dispatch.sh` принимает `GH_REPO`/`WORKFLOW`, `scripts/ci/setup-github-mirror.sh` — `FORGEJO_REPO`/`GITHUB_REPO`, `scripts/ci/forgejo-set-status.sh` — `FORGEJO_REPO`. Для нового репозитория достаточно скопировать `scripts/ci/`, `actions/` и `.github/workflows/`, завести GitHub-variables и секреты, прогнать setup-скрипт.

Особенности остальных репозиториев: у backend/docs/landing релизы деплойные и завязаны на секреты (VPS, реестр, ключи), поэтому на GitHub-hosted уезжает **только CI**; релизы остаются на Forgejo-раннере. Мобильный — единственный, где hosted-сборка отдаёт неподписанный артефакт обратно. Детали переноса и открытые вопросы — в [`debt.md`](../debt.md) → «CI: Forgejo → GitHub».

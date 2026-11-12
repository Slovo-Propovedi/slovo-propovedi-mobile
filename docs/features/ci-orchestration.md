# CI: Forgejo оркестрирует, GitHub-hosted исполняет

**Статус:** пилот отработан в `slovo-propovedi-mobile`; паттерн раскатан (2026-11-11) на backend, docs, landing и playbook — см. «Распространение на остальные репозитории».

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
Forgejo: статус CI / checks, подпись, web-сборка, публикация <-- артефакты
```

1. Push или тег приходит в Forgejo; workflow вызывает `scripts/ci/github-dispatch.sh`.
2. Диспетчер ждёт, пока коммит появится в GitHub-зеркале, и отправляет `workflow_dispatch` в `.github/workflows/ci.yml` или `release.yml`.
3. GitHub выполняет composite-действия из `actions/` и складывает результаты в артефакты.
4. Диспетчер поллит run; при успехе скачивает и распаковывает запрошенные артефакты, при реальном провале — печатает хвост логов упавших job'ов, при инфраструктурном сбое — отменяет run и сигнализирует fallback.
5. Forgejo подписывает APK, собирает web и публикует релиз — своими секретами и в своём UI.

## Контракт диспетчера (`scripts/ci/github-dispatch.sh`)

Обязательные переменные: `GH_TOKEN`, `GH_REPO` (`owner/name` зеркала), `WORKFLOW` (имя файла, не display-name), `REF` (ветка или тег — **никогда не SHA**, dispatch API его отвергает), `SHA` (полный 40-hex коммит: ждём его в зеркале и — при `VERIFY_REF=1` — сверяем с ним `head_sha` run).

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `MIRROR_WAIT_MIN` | `5` | сколько ждать появления SHA в GitHub-зеркале |
| `QUEUE_TIMEOUT_MIN` | `30` | сколько run может висеть в `queued` до отмены |
| `RUN_TIMEOUT_MIN` | `90` | общий лимит времени run до отмены |
| `ARTIFACTS` | — | `name=outdir` через запятую; архивы GitHub распаковываются в `outdir` |
| `DISPATCH_INPUTS` | — | JSON-объект, уходит в тело dispatch как `inputs` (например, `{"mode":"native"}`) |
| `VERIFY_REF` | — | `1` — включить привязку к коммиту: `REF` обязан резолвиться в `SHA` (exit `44`), `head_sha` run — совпадать (exit `1`). Ставит только релизный workflow; на ветках проверка выключена |
| `GH_API_BASE` | `https://api.github.com` | подмена API для self-test/enterprise |
| `GH_DISPATCH_DRY_RUN` | — | `1` — напечатать план вызовов без сети и выйти 0 |

Коды возврата — это и есть контракт с вызывающим workflow:

| Код | Значение | Что делает вызывающий |
| --- | --- | --- |
| `0` | run успешен, все запрошенные артефакты скачаны | продолжить (статус success) |
| `1` | run завершился неуспешно (тесты/сборка), артефакта нет, либо при `VERIFY_REF=1` `head_sha` run не равен `SHA` | **не перезапускать локально**; провалить job |
| `2` | ошибка использования/окружения (нет env, битый SHA/REF/ARTIFACTS, нет jq/unzip) | провалить job |
| `3` | run не появился на GitHub (не удалось обнаружить после dispatch) | провалить job (это не инфраструктурный fallback) |
| `42` | инфраструктура: токен отклонён (401/403 на зеркале), коммит не дошёл до зеркала за `MIRROR_WAIT_MIN`, dispatch отвергнут, queue-timeout или run-timeout, `startup_failure` (run вообще не запустился — ноль job'ов); timeout-пути отменяют run через `cancel` | запустить локальный fallback |
| `43` | run отменён извне (например, GitHub-concurrency при быстром втором push) | нейтрально: не fallback и не failure — результат даст более новый run |
| `44` | `REF` не резолвится в `SHA` на GitHub-зеркале (только при `VERIFY_REF=1`; тег переехал или зеркало отстало) | провалить job без fallback — локальная сборка замаскировала бы подмену |

Детали поведения:

- Перед отменой по таймауту диспетчер делает `POST .../actions/runs/<id>/cancel` — «зависший» run не продолжит жечь минуты после fallback.
- Зеркало: HTTP `401`/`403` на опросе коммита — сразу `42` с подсказкой проверить `CI_GITHUB_TOKEN` (ретраи бессмысленны, dispatch не выполняется); коммит не доехал за `MIRROR_WAIT_MIN` — `42` с подсказкой про push-mirror (sync-on-commit / «Sync now»). Оба случая ведут в локальный fallback, а не в красный job.
- Синхронизация зеркала — по каждому push: у push-mirror включён `sync_on_commit: true` (его выставляет `scripts/ci/setup-github-mirror.sh`, либо включите «sync on commit» в UI зеркала). Диспетчер дополнительно ждёт появления SHA в зеркале до `MIRROR_WAIT_MIN` (по умолчанию 5 мин) — это страховка, а не замена sync-on-commit. Автоматический job-токен **не может** вызывать `POST .../push_mirrors-sync` (403: управление зеркалом требует прав repo admin), поэтому этот шаг из workflow убран — не возвращайте его.
- Dispatch POST ретраится до 3 попыток с паузой 5 с на транспортных ошибках (HTTP `000` — DNS/connect — и `5xx`); `4xx` (auth/validation) не ретраится и сразу даёт `42` (fallback).
- Общий бюджет поллинга (`RUN_TIMEOUT_MIN`) включает периоды недоступности API: если api.github.com не отвечает весь бюджет (HTTP `000`), диспетчер выходит с `42` (локальный fallback) **без** отмены GitHub-рана — его результат игнорируется.
- Артефакты GitHub отдаются zip-архивами; диспетчер проверяет непустоту и распаковывает их в целевой каталог (`unzip`). Поэтому `ARTIFACTS="unsigned-apk=unsigned-apk"` даёт в `unsigned-apk/` сам APK, а не вложенный zip.
- В stdout печатается одна машинная строка `GH_RUN_URL=<url>` (до поллинга), поэтому вызывающий шаг может приложить ссылку к статусу на путях `0/1/42/43`. Весь человекочитаемый прогресс идёт в stderr.
- `REF`/`SHA` намеренно разные: dispatch принимает ветку/тег, а ожидание в зеркале и корреляция run — по коммиту.
- Внешняя отмена (`conclusion: cancelled`, например GitHub отменил старый run из-за `concurrency: cancel-in-progress` при быстром втором push) — это `exit 43`: диспетчер не шлёт cancel (run уже отменён) и не печатает логи job'ов; вызывающий помечает старый коммит `warning` («superseded»), а не красным.
- `VERIFY_REF=1` включает привязку к коммиту; ставит только `.forgejo/workflows/release.yml` (теги). `.forgejo/workflows/ci.yml` диспетчеризует ветку `main`, которая двигается по определению: гонка зеркала при параллельном push не должна краснить хороший коммит (в `ci.yml` только `42` ведёт в fallback, `44`/`1` фатальны), поэтому по умолчанию проверки выключены.
- `verify_tag_ref` (после ожидания зеркала, до dispatch): `GET /git/ref/tags/<REF>` с fallback на `/git/ref/heads/<REF>`, аннотированный тег разыменовывается через `/git/tags/<sha>`. Если ref не резолвится в `SHA` — `exit 44` сразу (переехавший тег назад не вернётся); недоступность/404 до дедлайна `MIRROR_WAIT_MIN` — тоже `44`.
- При `VERIFY_REF=1` каждый успешный poll сверяет `head_sha` run с `SHA`; расхождение — `exit 1` **без** `cancel` (run может быть чужим).
- На успешном пути после распаковки артефакта печатается `GH_UNSIGNED_APK_SHA256=<64-hex>`, если в каталоге ровно один `*.apk`. Ноль или ≥2 файлов — строки нет; вызывающий обязан трактовать отсутствие digest'а как фатальное (fail-closed).

Самопроверка: `scripts/ci/github-dispatch-selftest.sh` поднимает локальный мок `scripts/ci/mock-github-api.py` на `GH_API_BASE` и проверяет успех с артефактом (включая digest `GH_UNSIGNED_APK_SHA256`), реальный провал, queue-timeout с cancel, передачу `DISPATCH_INPUTS`, сбой скачивания артефакта (42), внешнюю отмену (43), ретрай dispatch после 503, недоступный API во время поллинга (42), расхождение тега (44) и `head_sha` (1) при `VERIFY_REF=1`, а также дефолтный путь без привязки (`VERIFY_REF` не задан → 0) и dry-run. Сеть не нужна.

## Контракт статусов

Автоматические статусы Forgejo имеют вид `<workflow> / <job>` (`CI / dco`, `CI / remote`, `CI / local`, `CI / gate`); некоторые версии дописывают событие (`CI / dco (push)`). Имена job'ов подобраны так, чтобы ни один автостатус не начинался с `CI / checks`: этот контекст ставит только job `gate` вручную, через `scripts/ci/forgejo-set-status.sh` (state: pending|success|error|failure|warning).

`create-release` в `.forgejo/workflows/release.yml` ждёт успешный статус по префиксу `CI / checks` у коммита тега (первая, то есть самая свежая запись). В раскатанных репозиториях контекст свой и совпадает с их поллингом — `CI / check-and-build` (backend), `CI / validate` (docs, landing), `CI / lint` (playbook); см. «Распространение на остальные репозитории». Следствия:

- нельзя добавлять job с именем `checks` — его автостатус `CI / checks (…)` пересечётся с префиксом;
- переименование `gate` или смена контекста ручного статуса требует правки ожидания в `create-release`;
- статус можно ставить повторно (re-run), свежая запись перекрывает старую.

Вердикт `gate`: `success`, если локальный fallback отработал успешно **или** локальный не запускался (skipped), а remote завершился успешно; иначе `failure`. Реальный провал remote (`exit 1`) локально не повторяется — gate падает. Отдельный случай — superseded (`exit 43`): если GitHub отменил run извне (быстрый повторный push), gate ставит статус `warning` с описанием «Superseded by a newer push — checks re-run on the newer commit» и не краснит старый коммит; сам job при этом остаётся зелёным.

## CI-поток (`.forgejo/workflows/ci.yml`)

Триггеры прежние (push/PR в `main`); на тегах job'ы пропускаются тем же guard'ом `github.ref_type != 'tag'`, что и `dco`.

```
dco --> remote --(exit 42, fallback=true)--> local
  |         |                                    |
  +---------+--------------> gate <--------------+
                              |
                        CI / checks (commit status)
```

- `dco` — проверка `Signed-off-by`: наличие, совпадение email с автором и трейлер последней непустой строкой сообщения. Check 3 регистрозависим (`Signed-off-by:` — канон) и совпадает со строгим правилом `signed-off-by-last` в `commitlint.config.ts`. Force-push может осиротить `github.event.before`, тогда диапазон не резолвится, и цепочка восстановления такая: прицельный `git fetch` этого SHA → список коммитов из payload push-события (поле `.commits[].id`, Forgejo/Gitea; дедуп с сохранением порядка, только не-merge коммиты, которые есть в checkout) → `::warning::` и пропуск, если ничего не нашлось (деградированный режим: `0 commit(s) verified`, полная проверка — на следующем обычном push). Payload ограничен ~20 коммитами: при более крупном force-push проверяется только перечисленная часть и выводится предупреждение о возможной усечённости.
- `remote` — checkout + `scripts/ci/github-dispatch.sh`; выход 0 → `fallback=false`, 42 → `fallback=true` + warning и `run_url`, 43 → `superseded=true` (нейтрально, без fallback); прочие коды проваливают job. В группе `memory-heavy-jobs` **не состоит** — это лёгкий сетевой job.
- `local` — `needs: [dco, remote]`, `if: always() && needs.remote.outputs.fallback == 'true'`; запускает `./actions/checks` с `profile: constrained`; держит `memory-heavy-jobs`, чтобы не пересечься с релизной сборкой на общем хосте.
- `gate` — `always()`, ставит статус и пишет таблицу в job summary (remote/local/verdict/ссылка на run); для superseded-рана ставит `warning`, а не `failure`. На тегах пропускается, чтобы не поставить ложный статус на коммит тега.

Логика проверок живёт в `actions/checks` (patch-package, `check:types`, `check:fsd`, lint, jest, нативные unit-тесты Gradle). `profile: constrained` включает `--maxWorkers=2` для jest; `profile: hosted` оставляет дефолт. Composite-шаги не поддерживают `timeout-minutes` — лимиты задаёт вызывающий workflow (`.github/workflows/ci.yml` — 90 минут).

## Релизный поток (`.forgejo/workflows/release.yml`)

Режим (`native`/`js-only`) по-прежнему определяет job `changes`; описание режимов, RUNTIME_VERSION-гейтов и публикации — в [`updates.md`](./updates.md). Оркестрация меняет только исполнителя сборки:

```
changes --> create-release (только native)
   |
   +--> build-remote --> android-package --> publish-release
   |      (native)          (native)
   |                           |
   |                           +--> web-package (любой тег; native — после подписи)
   |
   +--> ota (только js-only, остаётся на Forgejo)
```

- `build-remote` — лёгкий диспетчер, только native: js-only тег вообще не обращается к GitHub. `DISPATCH_INPUTS={"mode":"native"}`, `ARTIFACTS="unsigned-apk=unsigned-apk"`, `VERIFY_REF=1`. GitHub теперь собирает только APK (его job `web` удалён); скачанный `unsigned-apk/` он перекладывает в Forgejo-артефакт (v3 — ограничение Forgejo-раннера). При `fallback=true` ничего не загружает — `android-package` соберёт локально. `if-no-files-found: error`: на успешном пути артефакт обязан быть, иначе падаем до digest-гейта. В группе `memory-heavy-jobs` не состоит.
- `android-package` (native) — либо скачивает `unsigned-apk` и подписывает его, либо при fallback собирает и подписывает локально; результат — артефакт `release-assets`. Подпись удалённого APK предваряется digest-гейтом `expectedSha256` (см. «Привязка артефакта к коммиту»).
- `web-package` — всегда собирает `dist/` локально (`./actions/release-web`, `profile: constrained`), без артефакта из GitHub. `needs: [changes, android-package]` + skip-aware `if`: на native-теге job стартует только после успешной подписи APK, поэтому провал `android-package` не оставляет в реестре образ (включая мутабельный `latest`), не деплоит VPS и не прикрепляет web-zip. На js-only `android-package` пропущен (`skipped`), условие проходит, и web выходит как раньше. Далее — прежние шаги: сборка/пуш образа, деплой на VPS, zip и прикрепление к релизу в native-режиме.
- `publish-release` — `needs: [create-release, android-package]`; скачивает `release-assets` и публикует в Forgejo, GitHub и Codeberg (без изменений).
- `ota` — только js-only; остаётся локальным (см. ниже).

Артефактные контракты:

| Артефакт | Создаёт | Потребляет |
| --- | --- | --- |
| `unsigned-apk` | GitHub `release.yml` (job `android`, `signing: none`) | `build-remote` → `android-package` |
| `release-assets` (zip + `SHA256SUMS.txt`) | `android-package` (обе ветки) | `publish-release` |

`web-dist` больше не пересекает границу платформ: `web-package` собирает `dist/` на месте, GitHub web не собирает.

Группа `memory-heavy-jobs` держит только тяжёлые job'ы: `android-package`, `web-package`, `ota` (и `local` в CI). `build-remote`, `create-release` и `publish-release` вне группы: это сетевые job'ы, а `create-release` ещё и ждёт `CI / checks` — займи он слот, локальный fallback не смог бы получить раннер (дедлок). Экспорт web теперь всегда идёт на 4-ГБ хосте (раньше в native-режиме его делал GitHub): каждый тег занимает слот на время `yarn web:build`, а native-тег ещё и сериализует web после подписи APK — учитывайте при оценке очереди релиза.

## Неподписанный APK и подпись

GitHub не получает keystore. Его сборка идёт с `signing: none`: без `RELEASE_STORE_FILE` AGP подписывает release-APK debug-ключом (fallback в `android/app/build.gradle`), поэтому промежуточный APK может быть debug-signed и называться `app-prod-release.apk`. Артефакт всё равно называется `unsigned-apk` (контракт с Forgejo не меняется); гарантия подписи — не промежуточный файл, а гейт `APK_SIGNER_SHA256` после `zipalign + apksigner sign` на Forgejo, который заменяет существующие подписи.

Подпись выполняет Forgejo в `android-package` → `actions/sign-android`:

1. «Verify unsigned APK digest» — пересчитывает sha256 файла и сверяет с `expectedSha256` (значение `GH_UNSIGNED_APK_SHA256` из dispatch'а); выполняется **до** восстановления keystore, поэтому при подмене артефакта секреты не касаются диска;
2. `zipalign -f 4`;
3. `apksigner sign` с `android/app/release.keystore` и `ANDROID_*` env;
4. `apksigner verify --print-certs` — жёсткий гейт против `APK_SIGNER_SHA256` (один или несколько 64-hex digest'ов через запятую — задел на ротацию ключа);
5. переименование в `Slovo.Propovedi v<версия>.apk`, zip `slovo-propovedi-v<версия>.zip` и `SHA256SUMS.txt` в `release-assets/`.

### Привязка артефакта к коммиту (hash chain)

Релизный dispatch включает `VERIFY_REF=1`, поэтому APK, который подписывает Forgejo, связан с коммитом тега:

1. `verify_tag_ref` — тег на GitHub-зеркале резолвится ровно в `SHA` (иначе `44`, без fallback);
2. poll run — `head_sha` запущенного run равен `SHA` (иначе `1`, без cancel);
3. `GH_UNSIGNED_APK_SHA256` — digest скачанного артефакта (ровно один `*.apk`);
4. `actions/sign-android` → `expectedSha256` — повторный sha256 перед восстановлением keystore; пустое/не-64-hex значение или расхождение — отказ.

Цепочка ловит чужой или устаревший run, подмену файла при передаче и порчу архива, а также привязывает артефакт к коммиту. Она **не** защищает от полностью скомпрометированного GitHub-продюсера: атакующий, контролирующий сборку, посчитает честные digest'ы. Для web продюсер убран (сборка только на Forgejo); для APK split оставлен намеренно (разгрузка вычислений), остаточный риск принят и контролируется cert-pin гейтом `APK_SIGNER_SHA256`.

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

- `exit 42` — единственный сигнал «GitHub сейчас недоступен». Сюда попадают токен, отклонённый на опросе зеркала (401/403), коммит, не дошедший до зеркала за `MIRROR_WAIT_MIN`, отвергнутый dispatch (401/403/5xx), billing-блок (run навсегда остаётся в `queued`), общий queue-timeout, превышение `RUN_TIMEOUT_MIN` и `startup_failure` (run не удалось запустить — ноль job'ов, типично при сбоях GitHub Actions). Перед выходом run отменяется (кроме случая недоступного API и уже завершившегося `startup_failure`).
- Пороги заданы в dispatch-шагах workflow и могут быть уменьшены для конкретного прогона (`QUEUE_TIMEOUT_MIN`, `RUN_TIMEOUT_MIN`, `MIRROR_WAIT_MIN`).
- `exit 1` — реальный провал тестов/сборки (conclusion `failure`/`timed_out`), либо при `VERIFY_REF=1` `head_sha` запущенного run не совпал с `SHA`: локальный повтор запрещён (он не «лечит» красные тесты и тратит дефицитный раннер).
- `exit 3` — run не появился на GitHub (discovery после dispatch): job падает, fallback не запускается (это ошибка настройки/диспетчеризации, а не перегрузка).
- `exit 44` — тег на зеркале не резолвится в `SHA` (`VERIFY_REF=1`): жёсткий провал без fallback, иначе локальная сборка замаскировала бы переехавший тег.
- В релизе fallback означает: `build-remote` не загружает артефакты, а `android-package` собирает и подписывает APK локально тем же composite-действием с `profile: constrained`; `web-package` собирает web локально в любом случае.

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

Зеркало доставляет `.github/workflows/*` на default-ветку GitHub. Что тег указывает на ожидаемый SHA, зеркало не гарантирует (push-mirror может отставать, тег — переехать): это проверяет `verify_tag_ref` релизного dispatch'а (`VERIFY_REF=1`), расхождение — `exit 44` без локальной сборки.

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
5. **Релиз:** prerelease-тег `v*` → `changes` → `build-remote` → `android-package` → (`web-package` после успешной подписи) → `publish-release`; проверить артефакты `release-assets` (zip + `SHA256SUMS.txt`); `publish-release` — на реальном теге (он создаёт релиз).
6. **Fallback:** временно выставить `QUEUE_TIMEOUT_MIN=0` в dispatch-шаге (или использовать заведомо невалидный `GH_TOKEN`) — должен отработать `local`/локальная сборка, а gate — success.
7. **Без сети:** `GH_DISPATCH_DRY_RUN=1 bash scripts/ci/github-dispatch.sh` и `bash scripts/ci/github-dispatch-selftest.sh`.

## Ограничения и известные компромиссы

- **Composite actions читают только обычное окружение.** `secrets` им недоступны, `vars` сами в env не попадают; вся конфигурация приходит через `env:` вызывающего workflow — забытый маппинг даёт пустые значения и провал валидации действия.
- **Вложенные локальные actions не используются.** Общая логика вынесена в `scripts/ci/*`, а не в композицию `uses: ./actions/...` внутри композита — поддержка вложенных локальных actions не гарантирована на обеих платформах.
- **`profile: constrained | hosted`.** Один и тот же composite управляет памятью: `constrained` включает ограничения Gradle/Metro/jest под 4 ГБ хост, `hosted` — дефолты GitHub-раннера.
- **Maven-зеркало на GitHub-hosted выключено.** Оба `.github/workflows/*` задают `MAVEN_ALIYUN_MIRROR=false`: `maven.aliyun.com` отдаёт 502 с US-IP, а Gradle не переходит к следующему репозиторию на HTTP-ошибке, поэтому на GitHub сборка идёт напрямую через `google()`/`mavenCentral()`; Forgejo-раннер сохраняет Aliyun-first (Maven Central троттлится из РФ).
- **`curl -q` в скриптах.** Нейтрализует пользовательский `~/.curlrc` (например, `--continue-at -` ломает POST); на раннере поведение не меняется.
- **`pull_request`-события не покрыты.** Диспетчер получает `github.ref_name`/`github.sha` в расчёте на push/тег; семантика PR-событий (merge-commit vs head, ref-нейминг) не адаптирована — CI на PR остаётся локальным/непроверенным.
- **Таймауты — на вызывающей стороне.** Composite-шаги не поддерживают `timeout-minutes`; лимиты живут в `.github/workflows/*` и в dispatch-конфиге.
- **Артефакт-actions: GitHub — v4, Forgejo — v3.** На GitHub-hosted workflow'ах `upload-artifact` теперь v4 (v3 полностью отключён на GitHub-hosted раннерах); на Forgejo-стороне загрузка/скачивание остаются v3 — раннер Forgejo не умеет GitHub Results API. REST-скачивание артефактов диспетчером (`GET .../runs/{id}/artifacts` + `archive_download_url`) версионно-агностично: v4 сменил внутреннее хранение, а не API.
- **GitHub-workflow'ы — только `workflow_dispatch`.** Никаких `push`/`pull_request` триггеров: зеркало не должно запускать сборки само по себе.

## Распространение на остальные репозитории

Паттерн раскатан (2026-11-11) на `slovo-propovedi-backend`, `slovo-propovedi-docs`, `slovo-propovedi-landing` и `slovo-propovedi-playbook`. Скрипты параметризованы (`GH_REPO`/`WORKFLOW` у диспетчера, `FORGEJO_REPO`/`GITHUB_REPO` у setup-скрипта), поэтому копии в репозиториях идентичны; отличаются только `actions/checks` и контекст статуса:

- `scripts/ci/github-dispatch.sh` и `scripts/ci/forgejo-set-status.sh` — построчно одинаковые копии мобильных;
- `actions/checks` — composite под инструментарий репозитория: npm (`lint` + `test` + `build`) у backend, `validate:openapi` у docs, `validate` у landing, python + ansible (yamllint, ansible-lint, syntax check) у playbook;
- `.github/workflows/ci.yml` — только `workflow_dispatch`, запускает `./actions/checks`; ни vars, ни secrets ему не нужны: это чистые проверки кода, артефакты обратно не едут (мобильный — единственный, где hosted-сборка отдаёт неподписанный APK);
- `.forgejo/workflows/ci.yml` — та же цепочка `remote → local → gate`;
- `gate` ставит собственный контекст, совпадающий с тем, что поллит релизный пайплайн репозитория: `CI / check-and-build` (backend), `CI / validate` (docs, landing), `CI / lint` (playbook) — ни один из них не пересекается с автостатусами `CI / remote|local|gate`.

Renovate переехал на GitHub-hosted во всех репозиториях: endpoint по-прежнему `https://git.lightnode.ru/api/v1`, `RENOVATE_REPOSITORIES` задаётся по репозиторию (в Forgejo — подчёркивания), расписание у playbook недельное (`0 6 * * 1`), у остальных ежедневное. Секреты `RENOVATE_TOKEN`/`RENOVATE_GITHUB_COM_TOKEN` и переменная `RENOVATE_GIT_AUTHOR` — org-level, на уровне репозитория ничего заводить не нужно.

Релизные и деплойные пайплайны backend/docs/landing остаются на Forgejo без изменений: тронуто только окно ожидания статуса в `create-release` (40 → 60 попыток × 15 с). У playbook релизного пайплайна нет. Особенности: у backend/docs/landing релизы деплойные и завязаны на секреты (VPS, реестр, ключи), поэтому на GitHub-hosted уезжает **только CI**. Детали переноса и открытые вопросы — в [`debt.md`](../debt.md) → «CI: Forgejo → GitHub».

Новый репозиторий подключается копированием `scripts/ci/`, `actions/` и `.github/workflows/` плюс настройкой зеркала (`scripts/ci/setup-github-mirror.sh`); dispatch-секрет `CI_GITHUB_TOKEN` org-level, повторно заводить его не нужно.

### Codeberg как вычислительный tier — отклонено

Вариант «диспетчеризовать проверки в Codeberg-hosted раннеры» рассмотрен и отклонён (2026-11-11). Решающие факты:

- **Лейблы и бюджеты.** Codeberg принимает только `codeberg-tiny`/`small`/`medium(-lazy)`; `ubuntu-*` не матчится, а бюджет лимитирован на лейбл (2/5/10 мин) — проверкам мобильного нужно 15–40 мин.
- **Политика использования.** Usage policy Codeberg запрещает «extensive LLM-driven pipelines»; наш оркестратор построен AI-агентами и диспетчеризует запуски автоматически.
- **Приоритет каталогов workflow.** Побеждает первый существующий каталог: `.forgejo/workflows` перекрывает `.github/workflows`, поэтому GitHub-исполнители на Codeberg невидимы, а оркестратор там бы исполнялся.

Итог: Codeberg остаётся зеркалом релизов (`publish-release`), не вычислительным tier'ом. Пересматривать — только если Codeberg изменит лейблы, бюджеты или политику.

# AI Profiles — профили моделей OpenCode

В проекте настроены 4 набора моделей («профили») для локальной оркестрации
`opencode`: оркестратор (agent `plan`/`build`/`researcher` и модель текущей
сессии), исполнители (агенты `coder`, `explore`, `scribe`) и ревьюер (агент
`reviewer`). Система полностью самодостаточна внутри `.opencode/`: глобальные
конфиги opencode не затрагиваются, файл `.opencode/opencode.jsonc` не мутирует
никогда.

Профили переключаются **внутри самого OpenCode** командой `/profile` — это
единственный механизм. Обычный `opencode` работает как есть: плагин читает
последний выбранный профиль из своего хранилища при старте и применяет модели.

## Профили

| Профиль               | Orchestrator (primary, `plan`, `build`, `researcher`) | Worker (`coder`, `explore`, `scribe`) | Reviewer (`reviewer`)     |
| --------------------- | ----------------------------------------------------- | ------------------------------------- | ------------------------- |
| `zai_and_free`        | `zai-coding-plan/glm-5.3-flash`                       | `opencode/big-pickle`                 | `zai-coding-plan/glm-5.3` |
| `go_glm_and_free`     | `opencode-go/glm-5.3-flash`                           | `opencode/big-pickle`                 | `opencode-go/glm-5.3`     |
| `go_glm_and_deepseek` | `opencode-go/glm-5.3-flash`                           | `opencode-go/deepseek-v4.1-flash`     | `opencode-go/glm-5.3`     |
| `zai_and_go_deepseek` | `zai-coding-plan/glm-5.3-flash`                       | `opencode-go/deepseek-v4.1-flash`     | `zai-coding-plan/glm-5.3` |

## Быстрый старт

```sh
opencode                        # просто работает; применится последний профиль (или стандартные модели)
/profile                        # внутри OpenCode: список профилей + активный
/profile go_glm_and_deepseek    # внутри OpenCode: переключить профиль
/profile-go_glm_and_deepseek    # то же самое — но со стандартным автодополнением по имени
```

Переключение мгновенное: модель текущей сессии меняется сразу, модели
субагентов применяются при следующем спавне. Выбор сохраняется между
запусками.

Чтобы не вспоминать точные имена — начни набирать `/profile-` и остановись:
opencode покажет список всех `.opencode/profiles/*.json` с описанием
(`primary`-модель) через штатное автодополнение по имени команды. Это
единственный вид подсказок, который плагин API реально поддерживает — без
диалога-пикера (см. "Как это работает" ниже).

## Как это работает

- Плагин `.opencode/plugins/profile/index.ts` регистрирует команду `/profile`,
  по одной команде `/profile-<имя>` на каждый файл в `.opencode/profiles/`
  (снимок при старте плагина — новый файл профиля подхватится под своим
  именем после рестарта/hot-reload) и преобразование агентов
  (`ctx.agent.transform`). Источник данных — `.opencode/profiles/<имя>.json`
  (простые JSON-файлы, без комментариев).
- Диалог выбора (как `/models`) не реализован: TUI-плагин с
  `context.ui.dialog.select` был опробован и отброшен —
  `context.ui.router.current()` не сообщает `{type: "session"}` во время
  обычного чата (проверено и на opencode 2.0.8, и на 2.0.11), а резервный
  вариант через `context.ui.tabs` тоже не дал результата. Без надёжного
  способа для TUI-плагина узнать "в какой сессии сейчас ввод" диалог не может
  адресовать нужную сессию — поэтому `/profile` остаётся текстовым (список +
  прямое переключение по имени), без пикера.
- Профиль записывает `primary` (для `plan`/`build` — текущая сессия) и модели
  субагентов `researcher`, `coder`, `explore`, `scribe`, `reviewer`. Строки
  имеют вид `provider/model` (опционально `#variant`).
- `/profile <имя>` сохраняет выбор в хранилище плагина (`ctx.storage`),
  переприменяет реестр агентов (`ctx.agent.reload`) и переключает модель
  текущей сессии (`ctx.session.switchModel`).
- Семантика применения — **важно**: `plan`/`build` (`mode: primary`)
  переключаются **только** через `switchModel`, и в реестр агентов
  сознательно **не** пишутся. У opencode агент со своей моделью в реестре
  всегда побеждает над моделью сессии — если бы `plan`/`build` тоже пинились
  в реестре, `switchModel` перестал бы на них действовать уже после первого
  переключения профиля (реестр стал бы единственным источником истины, а он
  применяется только к новым спавнам, не к текущей сессии). Модели
  `researcher`/`coder`/`explore`/`scribe`/`reviewer` (`mode: subagent`)
  пишутся в реестр через `ctx.agent.transform` и применяются **при следующем
  спавне** субагента.
- Профиль выбирается **только** внутри сессии; никаких переменных окружения,
  `OPENCODE_CONFIG`, `--standalone` и перезапусков сервиса больше нет.
  Перезапуск демонов после выбора профиля не нужен в принципе.
- Права (permissions) живут в базе (`agents.*.permissions` в
  `.opencode/opencode.jsonc`) и во frontmatter `.opencode/agents/*.md` —
  профили содержат только модели.

## Когда переключаться

- Упёрлись в лимиты подписки z.ai → уходите с `zai-coding-plan/*`: любой
  профиль `go_*` (`go_glm_and_free`, `go_glm_and_deepseek`,
  `zai_and_go_deepseek` для ревьюера остаётся GLM).
- Лимиты/недоступность BigPickle (`opencode/big-pickle`) → берите профиль с
  worker'ом на DeepSeek: любой `*_deepseek` (`go_glm_and_deepseek`,
  `zai_and_go_deepseek`).
- `zai_and_free` — исходная связка; когда квоты восстановились, вернитесь:
  `/profile zai_and_free`.

## Автоматический фейловер при лимитах

Помимо ручного переключения, плагин следит за ретраями и при ошибке
квоты/лимита (**`status 429`** или текст `quota`/`insufficient`/`credits`/
`rate limit`/`billing`/`payment`) на **втором и последующих** ретраях
(`attempt >= 2`) автоматически переводит модели на запасные:

- `zai-coding-plan/glm-5.3-flash` → `opencode-go/glm-5.3-flash`
- `zai-coding-plan/glm-5.3` → `opencode-go/glm-5.3`
- `opencode/big-pickle` → `opencode-go/deepseek-v4.1-flash`

Overlay живёт 30 минут (TTL) и затем откатывается; между revert и следующей
активацией — cooldown 5 минут. Состояние — `.opencode/profile-fallback.json`,
аудит-лог — `.opencode/profile-fallback.log` (ротация при 1 MB). Репетиция
без применения — `/profile-failover-test dry [modelRef]`; реальный тест —
`/profile-failover-test [modelRef]`. Любое ручное `/profile <имя>` сбрасывает
overlay. Подробности — в `.opencode/README.md` → «Фейловер моделей при
лимитах».

## Структура файлов

- `.opencode/opencode.jsonc` — **тонкая база** в V2-формате: `agents`
  (permissions встроенных агентов), `permissions`, `mcp`, `instructions`;
  без model-wiring, не мутирует никогда.
- `.opencode/profiles/` — 4 JSON-файла профилей (модели) — **единственный
  источник данных** для плагина.
- `.opencode/plugins/profile/index.ts` — плагин `/profile`.
- `.opencode/agents/` — md-агенты (`build`, `coder`, `researcher`, `reviewer`,
  `scribe`) со своими permissions во frontmatter.
- `.opencode/skills/`, `tools/` — скиллы, инструменты.
- `.opencode/lib/` — общие модули плагинов.

## Добавить свой профиль

1. Создайте `.opencode/profiles/<имя>.json`:

   ```json
   {
     "primary": "provider/orchestrator-model",
     "agents": {
       "plan": "provider/orchestrator-model",
       "build": "provider/orchestrator-model",
       "researcher": "provider/orchestrator-model",
       "coder": "provider/worker-model",
       "explore": "provider/worker-model",
       "scribe": "provider/worker-model",
       "reviewer": "provider/reviewer-model"
     }
   }
   ```

2. Проверьте: `opencode` → `/profile` → профиль в списке → `/profile <имя>`.

## Заметки

- При старте opencode могут показываться ошибки сторонних V1-плагинов из
  ГЛОБАЛЬНОГО конфига пользователя. Лечение — только в глобальном конфиге,
  к этой системе отношения не имеет.
- Если профиль в хранилище плагина ссылается на удалённый JSON-файл, плагин
  предупредит в логе и стартует со стандартными моделями.

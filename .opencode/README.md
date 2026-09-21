# .opencode — локальная самодостаточная настройка OpenCode

Этот каталог содержит полностью самодостаточную настройку opencode: конфиг,
агенты, скиллы, инструменты, плагины. Обычный запуск `opencode` в этом
каталоге всегда подхватывает `.opencode/opencode.jsonc` — глобальные конфиги
не затрагиваются.

## Карта файлов

- `opencode.jsonc` — **тонкая база** в V2-формате (`agents` — permissions
  встроенных агентов, `permissions`, `mcp`, `instructions`); без model-wiring,
  никогда не мутирует. Обычный `opencode` стартует с последним выбранным
  профилем (или со стандартными моделями)
- `profiles/` — 4 JSON-файла профилей моделей — **единственный источник
  данных** для плагина `/profile`
- `plugins/profile/index.ts` — плагин `/profile` (in-session переключатель
  профилей; единственный механизм смены профилей) + файловер моделей при
  лимитах (см. «Фейловер моделей» ниже)
- `agents/` — определения агентов (`build`, `coder`, `researcher`, `reviewer`,
  `scribe`) со своими permissions во frontmatter
- `skills/` — скиллы (`code-philosophy`, `code-review`, `frontend-philosophy`,
  `plan-protocol`, `plan-review`)
- `tools/` — инструменты (`philosophy.md`)
- `plugins/` — плагины `profile` + портированные V2-плагины `kdco.*`
  (`worktree`, `workspace`, `background-agents`, `notify`)
- `lib/` — общие модули плагинов

## Профили моделей

Работа с профилями моделей (4 набора, переключение через `/profile`, механика
плагина) → [../AI_PROFILES.md](../AI_PROFILES.md). Кратко:

- запуск: обычный `opencode` — применится последний выбранный профиль
- переключение: `/profile` (список) и `/profile <имя>` (активация) внутри
  сессии; выбор сохраняется между запусками, перезапуск сервиса не нужен
- модель текущей сессии меняется сразу (`primary`), модели субагентов
  применяются при следующем спавне

Плагины `profile` и `kdco.worktree` / `kdco.workspace` /
`kdco.background-agents` / `kdco.notify` — см. `plugins/` и `lib/`.

## Фейловер моделей при лимитах (profile-failover)

Плагин `profile` следит за ретраями сессии и при ошибках квоты/лимита
автоматически переключает запрошенные модели на запасные:

- **Триггеры** (два канала — retry-хук и `http.response`):
  - **жёсткий** лимит — `status 429` или текст про
    `quota`/`insufficient`/`credits`/`billing`/`payment`; ретрай его не
    восстанавливает, поэтому фейловер активируется **сразу, уже на первой
    попытке** (в т.ч. по сырому ответу сервиса `429`/`402`);
  - **мягкий** лимит — только текст `rate limit`/`too many requests`; может
    пройти сам, поэтому активируется на **втором и последующих** ретраях
    (`attempt >= 2`), а первый логируется как `skip ... first attempt`.
  Ошибка на уже активной **запасной** модели никогда не откатывает фейловер —
  только логируется; оба канала делят один mutex и гард «уже переключено», так
  что один сбой активирует фейловер ровно один раз.
- **Пары** (source → fallback):

  | Source                          | Fallback                          |
  | ------------------------------- | --------------------------------- |
  | `zai-coding-plan/glm-5.3-flash` | `opencode-go/glm-5.3-flash`       |
  | `zai-coding-plan/glm-5.3`       | `opencode-go/glm-5.3`             |
  | `opencode/big-pickle`           | `opencode-go/deepseek-v4.1-flash` |

- **Что переключается**: субагенты под failing-моделью (frontmatter для
  markdown-агентов + registry-пин для `explore`) и primary текущей сессии,
  если её живая модель (в т.ч. переключённая вручную через `/models`)
  совпадает с failing-моделью.
- **Состояние**: файл `.opencode/profile-fallback.json` (overlay или
  dry-run-маркер) — переживает рестарты; при старте живой overlay
  переприменяется, истёкший overlay откатывается с cooldown, устаревший
  dry-run-маркер просто удаляется (без cooldown).
- **TTL**: 30 минут — затем авто-revert и повторное применение профиля.
  **Cooldown**: 5 минут между revert и следующей активацией.
- **Лог**: `.opencode/profile-fallback.log` — одна строка на событие; при
  превышении 1 MB ротируется в `.log.1` (перезапись). Skip-строки
  дедуплицируются (не чаще раза за cooldown-окно на пару «причина + модель»).
- **Репетиция**: `/profile-failover-test dry [modelRef]` — только логирует
  (`dry-run`), ничего не применяет. Реальный тест: `/profile-failover-test
[modelRef]` (по умолчанию — модель текущей сессии); это единственный путь,
  который обходит cooldown, чтобы форсировать прогон сразу после revert.
- **Ручное переключение профиля** (`/profile <имя>`) сбрасывает overlay
  (reset). При hot-reload плагина cleanup отписывает retry- и
  `http.response`-хуки, диспоузит registry-пины и снимает TTL-таймер.

## V1-плагины, не переносимые в V2

Плагины `@tarquinen/opencode-dcp@3.1.3` и `@franlol/opencode-md-table-formatter@0.0.6`
из старой V1-базы при миграции на V2 **не восстановлены**: оба написаны под
V1 plugin API и не проходят загрузку в V2 (V2 требует default-export
`Plugin.define({ id, setup })`, а у них — V1-хуки). При попытке подключения
через `plugins` в `opencode.jsonc` OpenCode ставит их в изолированный кэш,
но падает с `Plugin must export a default definition with an id and an effect
or setup function`. Можно вернуть, когда пакеты будут портированы на V2 API;
конфиг-запись намеренно не оставлена, чтобы не плодить ошибки загрузки.

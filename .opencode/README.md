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
  профилей; единственный механизм смены профилей)
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

## V1-плагины, не переносимые в V2

Плагины `@tarquinen/opencode-dcp@3.1.3` и `@franlol/opencode-md-table-formatter@0.0.6`
из старой V1-базы при миграции на V2 **не восстановлены**: оба написаны под
V1 plugin API и не проходят загрузку в V2 (V2 требует default-export
`Plugin.define({ id, setup })`, а у них — V1-хуки). При попытке подключения
через `plugins` в `opencode.jsonc` OpenCode ставит их в изолированный кэш,
но падает с `Plugin must export a default definition with an id and an effect
or setup function`. Можно вернуть, когда пакеты будут портированы на V2 API;
конфиг-запись намеренно не оставлена, чтобы не плодить ошибки загрузки.
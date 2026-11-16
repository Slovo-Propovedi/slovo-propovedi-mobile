# .crush — локальная самодостаточная настройка Crush

Этот каталог содержит порт самодостаточной настройки opencode (`.opencode/`)
под [Crush](https://github.com/charmbracelet/crush): базовый конфиг, профили
моделей, оркестрацию и инструменты. Crush подхватывает root-файл `.crushrc`
в проекте, который просто вызывает `source .crush/config.sh` — глобальные
конфиги Crush не затрагиваются.

## Карта файлов

- `.crushrc` (в корне проекта) — **тонкий шим**: единственный root-файл,
  обязательно нужен, потому что Crush ищет конфиг в корне, а не внутри
  `.crush/`. Содержит только `source .crush/config.sh`
- `config.sh` — **тонкая база** (без model-wiring): context-файлы, MCP,
  permissions, разрешение профиля. Никогда не мутирует
- `profiles/` — 4 bash-файла профилей моделей — **единственный источник
  model-wiring** (имена совпадают с `.opencode/profiles/*.json`)
- `tools/profile.sh` — CLI-переключатель профилей (persist + list)
- `tools/philosophy.md`, `tools/workflows.md` — context-файлы (порт
  `.opencode/tools/*.md`), подключаются через `option context-path`
- `skills/` — скиллы:
  - `profile` — user-invocable команда списка/переключения профилей
    (вызывается из палитры команд `ctrl+p` как `project:profile`) плюс 4
    прямые команды на каждый профиль (аналог `/profile-<имя>` в OpenCode):
    `project:profile-go-glm-and-deepseek`, `project:profile-go-glm-and-free`,
    `project:profile-zai-and-free`, `project:profile-zai-and-go-deepseek`.
    Имена команд — с дефисами, имена профилей в `profile.sh` — с
    подчёркиваниями
  - `agent-orchestrator`, `agent-coder`, `agent-researcher`,
    `agent-reviewer`, `agent-scribe` — ролевые скиллы, порт
    `.opencode/agents/*.md`
- `active-profile` — state-файл с именем активного профиля (создаётся
  `profile.sh`; machine-owned)
- `logs/`, сессии и прочие сабдиректории — **machine-owned state** Crush
  (здесь data-directory), не конфиг и не для ручного редактирования
- `.gitignore` — исходно crush init игнорирует весь каталог (`*`); переписан
  на whitelist, чтобы конфиг (кроме state-файлов) попал в git

## Профили моделей

Работа с профилями моделей → [../AI_PROFILES.md](../AI_PROFILES.md).
Кратко:

- запуск: обычный `crush` — применится последний выбранный профиль
  (`.crush/active-profile`) или стандартные модели, если профиль ещё не
  выбирался
- переключение:

  ```sh
  ./.crush/tools/profile.sh            # список + активный
  ./.crush/tools/profile.sh <имя>      # переключить (действует со следующего старта)
  CRUSH_PROFILE=<имя> crush            # разовый запуск с профилем
  ```

- либо user-invocable скилл `project:profile` в палитре команд (`ctrl+p`)
- внутри уже запущенной сессии модели меняются вручную пикером (`ctrl+l`)
  по refs из вывода `profile.sh`

## Отличия от OpenCode-системы (честный порт)

| Механика OpenCode (`.opencode/`) | Crush (`.crush/`) |
| --- | --- |
| 4 JSON-профиля: primary + 6 именованных агентов | 4 sh-профиля: 2 слота `model large` / `model small` (у Crush нет именованных агентов и per-agent моделей) |
| `/profile` — команда плагина, мгновенное применение | CLI `tools/profile.sh` + user-invocable скилл; применение при следующем старте (crushrc исполняется только при загрузке). В сессии — пикер `ctrl+l` |
| Плагин `/profile` в opencode plugin API | Аналога plugin API в Crush нет — вся механика на bash (`crushrc`) |
| Фейловер моделей при лимитах (`plugins/profile/failover.ts`) | Не портируется: нет plugin API / session-retry хуков. Осторожность в Crush даёт `option metrics false`… фейловера нет — см. запись в `docs/debt.md` |
| Агенты `coder/researcher/reviewer/scribe/build` с frontmatter-permissions | Ролевые скиллы `.crush/skills/agent-*/SKILL.md`; субагенты запускаются нативным `agent_dispatch` с `access: read/write`; пермишены субагента задаёт `access`, роль — скилл в промпте |
| `instructions: [philosophy.md, workflows.md]` | `option context-path .crush/tools/philosophy.md` + `workflows.md` |
| MCP `context7`, `gh_grep` | `mcp add context7 --type http …`, `mcp add gh_grep --type http …` |
| Permissions rule-lists на агентов | Глобальные `permissions allow/deny` на инструменты (у Crush нет per-agent permissions) |
| `big-pickle` (провайдер opencode) в двух профилях | Провайдера `opencode` в Crush нет — стоит ближайший аналог `opencode-go/deepseek-v4.1-flash` |
| speckit-команды `.opencode/commands/speckit.*.md` | Не портируются: у Crush нет `.md`-команд; спек-воркфлоу остаётся в `.opencode/commands/` + `.claude/commands/` (или запускается из сессии OpenCode/Claude) |

## Как это работает

1. `crush` находит `./.crushrc` → шим → `source .crush/config.sh`
2. `config.sh` подключает context-файлы, MCP, permissions, затем разрешает
   профиль: `$CRUSH_PROFILE` env > `.crush/active-profile` > ничего
   (стандартные модели)
3. Профиль выполняется: `model large …`, `model small …` — это всё
   model-wiring, больше его нет нигде
4. Скиллы `.crush/skills/` подхватываются автоматически (`.crush/skills`
   входит в дефолтные пути); ролевые скиллы оркестратор указывает субагентам
   через промпт `agent_dispatch`

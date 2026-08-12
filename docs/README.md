# Документация Слова.Проповеди

Папка `docs/` — **первоисточник знаний о проекте** для разработчиков и AI-агентов (opencode, Claude Code, Cursor). Цель — чтобы агент читал `docs/` перед реализацией и не исследовал кодовую базу повторно, экономя токены, и обновлял `docs/` при каждом изменении кода.

Приложение: React Native / Expo, «Слово.Проповеди» (`ru.slovopropovedi`), GPL-3.0-or-later. Стек, архитектура и команды — в [`AGENTS.md`](../AGENTS.md).

## Работа с документацией для агентов (ЖЁСТКИЕ правила)

Эти правила обязательны для любого агента, работающего над проектом.

1. **Перед реализацией фичи/фикса** агент ОБЯЗАН прочитать соответствующие документы:
   - экран → `screens/<экран>.md`;
   - функциональный модуль → `features/<модуль>.md`;
   - внешний протокол/контракт → `contracts/<протокол>.md`;
   - архитектурное решение → `architecture.md`.
   Если документ ещё не создан — прочитать код, затем создать/дополнить документ (см. правило 4).

2. **При изменении кода** агент ОБЯЗАН обновить затронутые документы `docs/` **в том же PR/коммите**. Изменение кода без обновления `docs/` считается неполным.

3. **Каждый срезанный угол** (TODO, hack, отложенное решение) → запись в `docs/debt.md` **в том же PR**. Формат записи:
   `- [ ] <что> — <где (пути файлов)> — <когда вернуться>`. Закрытая запись: `- [x] ...`.

4. **Новые зависимости** — только через запись в `docs/decisions.md` (секция Approved stack) с объяснением «почему». Агент НЕ добавляет зависимости вне этого списка без обсуждения.

5. **Если в `docs/` нет нужной информации** — добавить её, исследовав код, чтобы следующий агент не делал это повторно. Неполная документация — тоже долг: добавь запись в `debt.md`.

## Структура docs/

| Файл | Назначение |
|------|------------|
| [`README.md`](./README.md) | Карта документации и правила для агентов (этот файл) |
| [`architecture.md`](./architecture.md) | Архитектура «почему»: FSD, expo-router, Reatom, платформенные реализации |
| [`conventions.md`](./conventions.md) | Процессные договорённости: git, MR, работа с агентами, DoD |
| [`decisions.md`](./decisions.md) | Стек и решения: approved / rejected / superseded |
| [`debt.md`](./debt.md) | Технический долг, срезанные углы |
| [`features/player.md`](./features/player.md) | Как работает плеер (модель, PlayerService, кэш аудио) |
| [`features/audio-cache.md`](./features/audio-cache.md) | Кэширование аудио и секций (offline) |
| [`features/navigation.md`](./features/navigation.md) | Навигация expo-router: табы, стеки, маршруты |
| [`features/state.md`](./features/state.md) | Reatom: атомы, экшены, `ctx` |
| [`features/theme.md`](./features/theme.md) | Тема, цвета, Material You |
| [`features/offline-and-network.md`](./features/offline-and-network.md) | Сеть, офлайн, баннеры, авто-refresh токенов |
| [`features/updates.md`](./features/updates.md) | Проверка обновлений и уведомления |
| [`features/book-reader.md`](./features/book-reader.md) | Чтение FB2-книг (в разработке) |
| [`screens/listen.md`](./screens/listen.md) | Таб «Слушать» и его экраны |
| [`screens/playlist.md`](./screens/playlist.md) | Экран плейлиста |
| [`screens/playlist-list.md`](./screens/playlist-list.md) | Экран списка плейлистов |
| [`screens/read.md`](./screens/read.md) | Таб «Читать» (заблокирован) |
| [`screens/study.md`](./screens/study.md) | Таб «Учиться» (заглушка) |
| [`screens/more.md`](./screens/more.md) | Таб «Еще» |
| [`screens/settings.md`](./screens/settings.md) | Экран «Настройки» |
| [`screens/about.md`](./screens/about.md) | Экран «О приложении» |
| [`contracts/rest-api.md`](./contracts/rest-api.md) | REST API и сгенерированный клиент (Orval) |
| [`contracts/storage.md`](./contracts/storage.md) | AsyncStorage: ключи, токены, позиция |
| [`contracts/local-db.md`](./contracts/local-db.md) | Встроенная БД `src/shared/api/db/` |

> Файлы, помеченные «в разработке» или ещё не созданные, добавляются по мере работы. Таблица служит картой, а не обязательным списком существующих файлов.

## Соглашения по ведению

- Язык — **русский**; технические термины (атомы, hooks, expo-router, FSD, AsyncStorage) — английским как есть.
- Машино-проверяемые правила уже живут в ESLint + steiger (`check:fsd`) — docs объясняют «почему», а не дублируют правила.
- Ссылки на код — конкретные пути (`src/entities/player/model.ts`), ссылки между документами — относительные.
- Подробнее о процессе ведения: [`conventions.md`](./conventions.md).

## Краткий контекст продукта

Основной сценарий — прослушивание проповедей (секции → плейлист → плеер со скачиванием, кэшем и офлайн-фолбэком) — полностью рабочий, данные берутся с сервера через REST API (`sectionsApi.getSections()` в `src/pages/listen/model.ts`). Чтение книг (FB2), обучение и авторизация — не реализованы. Раздел книг `/read` (таб заблокирован) использует встроенную локальную БД (`src/shared/api/db/`) как временный источник данных. Все тексты интерфейса на русском. Подробности и долги — в [`debt.md`](./debt.md).

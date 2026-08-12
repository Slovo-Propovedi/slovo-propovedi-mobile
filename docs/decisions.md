# Стек и решения (decisions)

Этот документ фиксирует **утверждённый стек** и принятые решения. Изменения вносятся только через обсуждение и редактирование этого файла. Агенты НЕ добавляют зависимости вне секции Approved stack без объяснения «почему» в этом же документе.

## Approved stack

| Area | Package | Why |
|------|---------|-----|
| Платформа | React Native `0.86.2` + Expo SDK `~57.0.12` | Единая кодовая база для iOS/Android/Web; Expo даёт готовые модули и EAS-билды |
| Язык | TypeScript `~6.0.3` | Типобезопасность во всём проекте; типы API генерируются из OpenAPI |
| Навигация | `expo-router` `~57.0.12` | Файловая навигация, один источник истины для маршрутов, типизация путей (см. [`architecture.md`](./architecture.md)) |
| Состояние | `@reatom/core`, `@reatom/framework`, `@reatom/npm-react` | Атомы + асинхронные экшены с `ctx`; единый контекст доступен вне React (см. [`architecture.md`](./architecture.md)) |
| Аудио | `expo-audio` `~57.0.3` | Воспроизведение, экран блокировки, авто-продвижение (native); Web — `HTMLAudioElement` в `.web.ts` |
| HTTP-клиент | `axios` `^1.19.0` | Интерцепторы для токенов/refresh и мониторинга доступности сервера |
| Генерация API | `orval` `8.23.0` + `zod` `^4.4.3` | Клиент, типы и схемы валидации из OpenAPI (`yarn api:generate`) |
| Парсинг FB2 | `xml-js` `^1.6.11` | Разбор FB2-книг в объектную модель (см. [`features/book-reader.md`](./features/book-reader.md)) |
| Хранилище | `@react-native-async-storage/async-storage` `2.2.0` | Токены, позиция, настройки, кэш (см. [`contracts/storage.md`](./contracts/storage.md)) |
| Анимации/жесты | `react-native-reanimated` `4.5.1`, `react-native-gesture-handler`, `react-native-worklets`, `react-native-safe-area-context`, `react-native-screens` | Стандартный набор для анимаций, жестов и навигации |
| Нижняя панель/табы | `@gorhom/bottom-sheet`, `react-native-tab-view` | Плейлист/меню в expandable-player; таб-вью на табе «Учиться» |
| Сеть/офлайн | `@react-native-community/netinfo` `^12.0.1` | Отслеживание подключения, офлайн-баннеры (см. [`features/offline-and-network.md`](./features/offline-and-network.md)) |
| Обновления | `expo-notifications` `~57.0.10`, `expo-task-manager` | Уведомления о новых версиях (см. [`features/updates.md`](./features/updates.md)) |
| UI-базовое | `@expo/vector-icons`, `expo-blur`, `expo-linear-gradient`, `expo-status-bar` | Иконки, blur-таббар, градиенты, статус-бар |
| Тесты | `jest` + `jest-expo` + `@testing-library/react-native` | Юнит/компонентные тесты рядом с кодом |
| Моки API | `msw` `^2.15.0` | Разработка/тесты без живого бэкенда |
| Прочее | `debounce`, `ts-pattern`, `react-native-text-ticker` | Утилиты и паттерн-матчинг |

> ⚠️ **Gluestack UI не используется** — в `package.json` отсутствует. **expo-system-ui отсутствует**; Material You реализован кастомно через `src/shared/ui/theme/materialYou.ts` (Android 12+, API 31) и динамические цвета таббара в `src/widgets/tab-bar/ui/CustomTabBar.tsx` (`Color.android.dynamic.primaryContainer`). Подробности — в [`features/theme.md`](./features/theme.md).

## Rejected (and why)

| Proposal | Verdict | Why |
|----------|---------|-----|
| Zustand | Отклонено | Проект уже использует Reatom; Zustand не дал бы преимуществ, а добавил бы вторую модель состояния. <!-- TODO: уточнить у команды, был ли Zustand реально рассмотрен или выбран сразу Reatom --> |
| Redux Toolkit | Отклонено | Избыточен для текущего размера приложения; Reatom проще (атомы против редьюсеров/селекторов). |
| Навигация через `react-navigation` вручную | Отклонено | Выбран expo-router (файловая навигация) — см. Approved stack. `react-navigation` всё равно лежит в основе expo-router, но конфиг не пишем вручную. |

## Other fixed decisions

- **Архитектура:** Feature-Sliced Design (слои app → pages → widgets → features → entities → shared) — см. [`architecture.md`](./architecture.md).
- **Стиль:** отсутствие точек с запятой; одинарные кавычки; до 130 строк на файл; стрелочные функции.
- **Экспорты:** именованные экспорты в `src/`, `export default` только в `app/` (expo-router).
- **Импорты:** абсолютные по слоям FSD (`entities/player`, `shared/ui/themed`); относительные между слоями запрещены.
- **Barrel:** один barrel `index.ts` на слайс; сегментные barrel-файлы запрещены.
- **Состояние:** Reatom; `ctx` из `src/shared/lib/reatom-ctx/ctx.ts`.
- **Платформы:** iOS, Android, Web; платформенные реализации через `.native.ts`/`.web.ts`.
- **Язык UI:** русский; технические термины — английским.
- **API:** контракт через OpenAPI + Orval; ручные типы под API не пишем.
- **Android build flavors:** Gradle `productFlavors` `dev`/`prod` (dimension `env`). Dev: `applicationIdSuffix ".dev"`, имя «Слово.Проповеди Dev». Prod: базовый `ru.slovopropovedi`. `debuggableVariants = ["devDebug", "prodDebug"]`. Цель — dev-сборка не перезаписывает prod на одном устройстве. См. [`BUILD-LOCAL.md`](./BUILD-LOCAL.md).
- **CI: ограничение памяти Jest.** В `jest.config.ts` добавлен `workerIdleMemoryLimit: '1GB'` (перезапуск воркера при росте RSS), а в `.forgejo/workflows/ci.yml` шаг тестов запускается как `yarn testFinal --maxWorkers=2`. Причина: тяжёлые `jest-expo`/RN UI-сьюты вызывали OOM (SIGKILL от ОС) при параллельном запуске множества воркеров.

## Superseded (отменённые решения)

Секция для устаревших решений. Отменённое решение помечается зачёркиванием с объяснением, **не удаляется**:

~~**Пример:** Redux Toolkit — ранее рассматривался для управления состоянием. Заменён на Reatom (см. выше) — атомы проще и не требуют boilerplate.~~

Сейчас других отменённых решений нет.

## Связанные документы

- [`architecture.md`](./architecture.md) — обоснование ключевых решений.
- [`conventions.md`](./conventions.md) — правила добавления зависимостей и DoD.
- [`contracts/rest-api.md`](./contracts/rest-api.md) — детали API-клиента.

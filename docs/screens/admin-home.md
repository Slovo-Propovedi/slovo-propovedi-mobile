# Экран «Главная админки»

**Маршрут:** `/admin` (файл `app/admin/(tabs)/index.tsx`, «Главная» в таб-баре)
**Файлы:** `app/admin/(tabs)/index.tsx` → реэкспорт `pages/admin-home`
**Статус:** готов

## Что делает

Дашборд интерфейса администратора: приветствие, счётчики контента и быстрые действия.

## Что показывается

`AdminHomeScreen` (`src/pages/admin-home/ui/AdminHomeScreen.tsx`):

- `AdminHomeHeader` — «Интерфейс администратора», имя пользователя (muted) и `IconButton` «Вернуться в приложение» (`log-out-outline` → `/listen`).
- Три карточки `AdminStatCard`: «Разделы», «Плейлисты», «Проповеди» со счётчиками; каждая ведёт в свой таб (`/admin/sections`, `/admin/playlists`, `/admin/sermons`).
- Блок «Быстрые действия» (`AdminQuickActions`): «Загрузить проповедь» → `/admin/sermons/create`, «Источники импорта» → `/admin/invidious` (только для роли admin, `isAdminUser`), «Выйти из аккаунта» (`signOut` → `/listen`).
- Скролл (`ScrollView`) резервирует место под плавающим таб-баром: `paddingBottom: tabBarHeight + INDENTS.low` (`tabBarHeightAtom`) — иначе последняя строка («Выйти из аккаунта») уходит под бар и недоступна (на web `body { overflow: hidden }`, документ не скроллится).
- **Pull-to-refresh:** потягивание вниз перезагружает счётчики (`useAdminStats.reload`, спиннер `isRefreshing`); сбойные поля не затирают прежние значения (`mergeStats`). На web — собственный тач-жест `PullToRefresh` (см. [features/web.md](../features/web.md)).

## Откуда данные

- Пользователь — `authUserAtom` (`entities/auth`).
- Счётчики — `useAdminStats` (`pages/admin-home/lib/useAdminStats.ts`): `sectionControllerFindAll`, `playlistControllerFindAll`, `sermonControllerFindAll` через `shared/api`; запросы независимы (`Promise.allSettled`), сбой одного даёт `—`.
- Выход — `signOut` (`entities/auth`).

## Куда можно перейти

- `/admin/sections`, `/admin/playlists`, `/admin/sermons` — табы админки.
- `/admin/invidious` — быстрое действие «Источники импорта» (только роль admin).
- `/listen` — кнопка «Вернуться в приложение» и выход из аккаунта.

## Состояния

- Загрузка: скелетон-число вместо значения в карточках (`SkeletonBar`).
- Ошибка запроса: счётчик показывает `—`.
- Неаутентифицирован: редирект в `/admin/login` выполняет layout `app/admin/_layout.tsx`.

## Связанные документы

- [admin-login.md](./admin-login.md)
- [../architecture.md](../architecture.md) — зона `/admin`
- [../debt.md](../debt.md) — технический долг админки

# Экран «Главная админки»

**Маршрут:** `/admin` (файл `app/admin/(tabs)/index.tsx`, «Главная» в таб-баре)
**Файлы:** `app/admin/(tabs)/index.tsx` → реэкспорт `pages/admin-home`
**Статус:** готов

## Что делает

Дашборд интерфейса администратора: шапка пользователя, счётчики контента и две группы действий.

## Что показывается

`AdminHomeScreen` (`src/pages/admin-home/ui/AdminHomeScreen.tsx`):

- `AdminHomeHeader` — строка `[arrow-back] [заголовок] [AdminHomeUserMenu] [RefreshButton]`:
  - `IconButton` «Вернуться в приложение» (`arrow-back`) → `router.replace('/listen')` (replace — deep-link-safe);
  - заголовок «Интерфейс администратора» (`flex: 1`, по центру);
  - `AdminHomeUserMenu` — иконка `person-outline` с подписью-именем (muted, только при `user !== null`) и меню из одного пункта «Выйти из аккаунта» (`signOut` → `/listen`);
  - `RefreshButton` (на native рендерит `null`).
- Три карточки `AdminStatCard`: «Разделы», «Плейлисты», «Проповеди» со счётчиками; каждая ведёт в свой таб (`/admin/sections`, `/admin/playlists`, `/admin/sermons`).
- Блок «Быстрые действия» (`AdminQuickActions`, заголовок внутри компонента): «Загрузить проповедь» → `/admin/sermons/create`.
- Блок «Дополнительно» (`AdminMoreActions`, заголовок внутри компонента): «Медиа» → `/admin/media` (виден всем, кто вошёл в админку), «Флаги» → `/admin/flags`, «Источники импорта» → `/admin/invidious`, «Пользователи» → `/admin/users` (последние три — только роль admin по `isAdminUser`). Эти маршруты скрыты из таб-бара (`href: null`) и открываются только строками главной.
- Скролл (`ScrollView`) резервирует место под плавающим таб-баром: `paddingBottom: tabBarHeight + INDENTS.low` (`tabBarHeightAtom`) — иначе последняя строка уходит под бар и недоступна (на web `body { overflow: hidden }`, документ не скроллится).
- **Pull-to-refresh:** потягивание вниз перезагружает счётчики (`useAdminStats.reload`, спиннер `isRefreshing`); сбойные поля не затирают прежние значения (`mergeStats`). На web — собственный тач-жест `PullToRefresh` (см. [features/web.md](../features/web.md)).

## Откуда данные

- Пользователь — `authUserAtom` (`entities/auth`); роль для гейтинга строк «Дополнительно» — `isAdminUser`.
- Счётчики — `useAdminStats` (`pages/admin-home/lib/useAdminStats.ts`): `sectionControllerFindAll`, `playlistControllerFindAll`, `sermonControllerFindAll` через `shared/api`; запросы независимы (`Promise.allSettled`), сбой одного даёт `—`.
- Выход — `signOut` (`entities/auth`), пункт меню `AdminHomeUserMenu`.

## Куда можно перейти

- `/admin/sections`, `/admin/playlists`, `/admin/sermons` — табы админки.
- `/admin/sermons/create` — быстрое действие «Загрузить проповедь».
- `/admin/media`, `/admin/flags`, `/admin/invidious`, `/admin/users` — строки блока «Дополнительно» (последние три — только роль admin).
- `/listen` — кнопка «Вернуться в приложение» и выход из аккаунта.

## Состояния

- Загрузка: скелетон-число вместо значения в карточках (`SkeletonBar`).
- Ошибка запроса: счётчик показывает `—`.
- Неаутентифицирован: редирект в `/admin/login` выполняет layout `app/admin/_layout.tsx`.
- Не-admin: строки «Флаги», «Источники импорта», «Пользователи» не рендерятся (`isAdminUser`).

## Связанные документы

- [admin-login.md](./admin-login.md)
- [../architecture.md](../architecture.md) — зона `/admin`
- [../debt.md](../debt.md) — технический долг админки

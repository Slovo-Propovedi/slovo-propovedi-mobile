# Экран «Пользователи» (админка)

**Маршруты:**

- `/admin/users` — список пользователей (таб `app/admin/(tabs)/users.tsx` → `pages/admin-users`)
- `/admin/users/create` — создание пользователя (`app/admin/users/create.tsx` → `pages/admin-user-form`)
- `/admin/users/[id]` — деталь пользователя (`app/admin/users/[id].tsx` → `pages/admin-user-detail`)
- `/admin/users/[id]/edit` — редактирование пользователя (`app/admin/users/[id]/edit.tsx` → `pages/admin-user-form`)

**Статус:** готов

Пользователь — админ-аккаунт системы. Роли (`APITypes.UserRole`): `admin` — полный доступ (включая домен users), `moderator` — контент без users, `user` — в панель не входит. Домен `/users/*` доступен **только роли admin**: таб «Пользователи» скрыт для не-admin (`app/admin/(tabs)/_layout.tsx`), а каждый экран вызывается через `useRequireAdminRole()` (редирект не-admin на `/admin`). Порт Svelte-экранов `Users/UserDetail/UserCreate/UserEdit` + общей `UserForm`.

## Список

**Файлы:** `src/pages/admin-users/ui/AdminUsersScreen.tsx`, `AdminUsersHeader.tsx`, `AdminUserRow.tsx`, `lib/useAdminUsers.ts`

- **Что показывается:** внутриэкранная шапка «Пользователи» (`AdminUsersHeader`) + «Управление администраторами системы.» + иконка-кнопка создания (`person-add-outline`, `accessibilityLabel='Создать пользователя'`) справа; поле поиска «Имя, email или логин…»; карточки: аватар-инициал, имя, email, бейдж роли (`ROLE_LABELS`) и бейдж логина.
- **Откуда данные:** `usersControllerFindAll` (`GET /users?page&limit=20`) → `AllUsersResponse { users, count }`; пагинация офсетная.
- **Поиск:** у эндпоинта нет серверного `search`, фильтрация **на клиенте** по `name`/`email`/`username` с дебаунсом 300мс (`useDebounce`); фильтр применяется к уже загруженным страницам.
- **Пагинация:** автодозагрузка при достижении конца списка (`onEndReached`, порог 0.5) — следующая страница по `page`/`limit=20`; пока идёт дозагрузка, в футере видна скелетон-строка, при ошибке — тапабельная строка «Повторить загрузку».
- **Навигация:** тап по карточке → `/admin/users/[id]`; иконка «Создать пользователя» в шапке → `/admin/users/create`.
- **Состояния:** загрузка списка — скелетон-строки (`AdminUserRow.Skeleton`, шапка остаётся видимой; дозагрузка — скелетон-строка в футере); пусто — `EmptyState` «Пользователей пока нет»; фильтр без совпадений — «Ничего не найдено»; ошибка — `reportError` + текст в пустом состоянии.
- **Отступ под плавающим таб-баром:** `paddingBottom: tabBarHeight + INDENTS.low` (без `PLAYER_SIZES.miniPlayerHeight` — в админке нет мини-плеера).
- **Pull-to-refresh:** потягивание вниз перезагружает первую страницу (`useAdminUsers.refresh`, спиннер `isRefreshing`); клиентский фильтр применяется к свежим данным. На web — собственный тач-жест `PullToRefresh` (см. [features/web.md](../features/web.md)).

## Деталь

**Файлы:** `src/pages/admin-user-detail/ui/AdminUserDetailScreen.tsx`, `UserStatGrid.tsx`, `PasswordDialog.tsx`, `lib/useAdminUserDetail.ts`

- **Что показывается:** аватар-инициал, имя, email; действие «Сменить пароль»; «Редактировать» и «Удалить» — иконки в шапке (`headerRight`, `useAdminDetailHeader`; «Удалить» скрыто для собственного аккаунта); сетка статистики: Имя, Роль (`ROLE_LABELS`), Username, Email, ID.
- **Откуда данные:** `usersControllerFindOne` (`GET /users/{id}`).
- **Собственный аккаунт:** иконка «Удалить» в шапке рендерится только при `id !== authUser.id` (`authUserAtom` из `entities/auth`) — дублирует серверную защиту self-delete.
- **Удаление:** `ConfirmDialog` «Удалить пользователя?» → `usersControllerRemove` (`DELETE /users/{id}`) → `router.back()`; ошибка — `reportError`.
- **Смена пароля:** `PasswordDialog` (`Modal` + `FormField` с `secureTextEntry`) → `usersControllerChangePassword` (`PATCH /users/{id}/password`, тело `{ password }`). Пустой пароль блокируется на клиенте («Введите новый пароль.»); успех — тост «Пароль изменён» и закрытие модалки.
- **Навигация:** иконка «Редактировать» в шапке → `/admin/users/[id]/edit`.
- **Состояния:** загрузка сущности — `AdminContentSkeleton`; не найдено — `EmptyState` «Пользователь не найден».

## Форма (создание / редактирование)

**Файлы:** `src/pages/admin-user-form/ui/UserForm.tsx` (+ `AdminUserCreateScreen.tsx`, `AdminUserEditScreen.tsx`, `UserFormFields.tsx`, `UserSaveButton.tsx`), `lib/userFormState.ts`, `lib/useUserFormController.ts`, `lib/useAdminUserEntity.ts`, `lib/useUserFormHeader.tsx`, `lib/useUserScreens.tsx`

- **Общая форма** `UserForm` в двух режимах; поля: имя, email (`keyboardType='email-address'`), логин, роль (`SelectField` — `admin`/`moderator`/`user`, по умолчанию `user`), пароль (`secureTextEntry`, **только в режиме create**).
- **Кнопка «Сохранить» — в шапке экрана** (`headerRight`, иконка-галочка `SaveButton`); шапка собирается хуком `useAdminFormHeader` (`widgets/admin-form-header`), опции мемоизированы, обработчик держится в ref. Кнопка **disabled, пока форма не изменена** (`isDirty` от `useUserFormController`: edit — сравнение с исходным снапшотом через `omitEqualFields`; create — pristine-форма disabled).
- **Мутации:** `usersControllerCreate` (`POST /users`) — тело `{ name, email, username, password, role }` (`role` шлётся всегда); `usersControllerUpdate` (`PATCH /users/{id}`) — **только изменённые** поля из `name/email/username/role`, без пароля (пропущенные ключи = «не менять»). Если изменений нет — `router.back()` без запроса.
- **Валидация (create):** имя/email/логин/пароль непустые, иначе inline-ошибка + тост «Заполните все поля.», отправки нет.
- **После успеха:** тост («Пользователь создан»/«Пользователь сохранён») и `router.back()`; ошибка — баннер в форме.
- **Режим edit:** сущность грузится до монтирования формы (`useAdminUserEntity`), пропсы формы стабильны.

## Связанные документы

- [../features/admin.md](../features/admin.md) — интерфейс администратора
- [../contracts/rest-api.md](../contracts/rest-api.md) — карта `/users`-эндпоинтов
- [admin-login.md](./admin-login.md) — аутентификация и роли
- [README.md](./README.md) — индекс screens

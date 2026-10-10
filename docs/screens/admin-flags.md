# Экран «Флаги» (админка)

**Маршруты:**

- `/admin/flags` — список фича-флагов (таб `app/admin/(tabs)/flags.tsx` → `pages/admin-flags`)
- `/admin/flags/create` — создание флага (`app/admin/flags/create.tsx` → `pages/admin-flag-form`)
- `/admin/flags/[id]` — деталь флага (`app/admin/flags/[id].tsx` → `pages/admin-flag-detail`)
- `/admin/flags/[id]/edit` — редактирование флага (`app/admin/flags/[id]/edit.tsx` → `pages/admin-flag-form`)

**Статус:** готов

Управление фича-флагами приложения (см. [features/feature-flags.md](../features/feature-flags.md)). Доступно **только роли admin** (эндпоинты `/feature-flags` — под админ-токеном): таб «Флаги» скрыт для не-admin (`app/admin/(tabs)/_layout.tsx`), а каждый экран вызывается через `useRequireAdminRole()`. Экраны работают с **generated-типами** (`APITypes.FeatureFlag`) напрямую, как остальная админка.

## Список

**Файлы:** `src/pages/admin-flags/ui/AdminFlagsScreen.tsx`, `AdminFlagsHeader.tsx`, `AdminFlagRow.tsx`, `lib/useAdminFlags.ts`

- **Что показывается:** шапка «Флаги» (`AdminFlagsHeader`) + «Управление фича-флагами приложения.» + иконка создания (`add-outline`, `accessibilityLabel='Создать флаг'`); карточки: название (`MovingText`), ключ и бейдж глобального состояния («Включён»/«Выключен»).
- **Откуда данные:** `featureFlagsControllerFindAll` (`GET /feature-flags`) → `FeatureFlagListResponse { flags }`.
- **Пагинации и поиска нет** — флагов мало, список целиком. Данные тихо обновляются при возврате на экран (`useFocusEffect`; скелетон — только до первой успешной загрузки).
- **Навигация:** тап по карточке → `/admin/flags/[id]`; иконка в шапке → `/admin/flags/create`.
- **Состояния:** загрузка — скелетон-строки (`AdminFlagRow.Skeleton`); пусто — `EmptyState` «Флагов пока нет»; ошибка — `reportError` + текст в пустом состоянии; pull-to-refresh перезагружает список.

## Деталь

**Файлы:** `src/pages/admin-flag-detail/ui/AdminFlagDetailScreen.tsx`, `FlagOverridesList.tsx`, `FlagDetailHeader.tsx`, `OverrideUserRow.tsx`, `lib/useAdminFlagDetail.ts`, `lib/useOverrideUsers.ts`

- **Что показывается:** карточка флага (название, ключ, бейдж состояния); «Редактировать» и «Удалить» — иконки в шапке (`useAdminDetailHeader`); блок «Исключения»: подсказка, поиск пользователей и строки пользователей с действиями **«Включить»** (grant), **«Выключить»** (deny), **«Сбросить»** (clear).
- **Откуда данные:** отдельного `GET /feature-flags/{id}` нет — флаг выбирается из общего списка (`featureFlagsControllerFindAll`); список пользователей — `usersControllerFindAll` (`GET /users?page&limit=20`, клиентский поиск с дебаунсом 300мс по загруженным страницам, автодозагрузка по `onEndReached`).
- **Исключения (только запись):** `featureFlagsControllerSetOverride` (`PUT /feature-flags/{id}/overrides/{userId}`, тело `{ value: 'grant' | 'deny' }`) и `featureFlagsControllerDeleteOverride` (`DELETE …`, clear). **Сервер не отдаёт список существующих исключений и не сообщает эффективное состояние флага для конкретного пользователя** — строка показывает только действия, результат подтверждается тостом. Ограничение зафиксировано в [debt.md](../debt.md).
- **Удаление:** `ConfirmDialog` «Удалить флаг?» → `featureFlagsControllerRemove` (`DELETE /feature-flags/{id}`) → `router.back()`; ошибка — `reportError`.
- **Навигация:** иконка «Редактировать» в шапке → `/admin/flags/[id]/edit`.
- **Состояния:** загрузка флага — `AdminContentSkeleton`; не найдено — `EmptyState` «Флаг не найден»; загрузка пользователей — скелетон-строки (`OverrideUserRow.Skeleton`, заимствован у `AdminUserRowSkeleton`); дозагрузка — скелетон-строка в футере, при ошибке — «Повторить загрузку».

## Форма (создание / редактирование)

**Файлы:** `src/pages/admin-flag-form/ui/FlagForm.tsx` (+ `AdminFlagCreateScreen.tsx`, `AdminFlagEditScreen.tsx`, `FlagFormFields.tsx`), `lib/flagFormState.ts`, `lib/useFlagFormController.ts`, `lib/useAdminFlagEntity.ts`, `lib/useFlagScreens.tsx`

- **Общая форма** `FlagForm` в двух режимах; поля: **ключ** (`FormField` только в create — паттерн `^[a-z][a-z0-9-]*$`; в edit ключ read-only), **название** (`FormField`), **«Включён»** (`CheckboxField` — глобальный дефолт).
- **Кнопка «Сохранить» — в шапке экрана** (`headerRight`, `SaveButton`); шапка собирается `useAdminFormHeader`. Кнопка **disabled, пока форма не изменена** (`isDirty`: edit — сравнение с исходным снапшотом через `omitEqualFields`; create — pristine-форма disabled).
- **Мутации:** `featureFlagsControllerCreate` (`POST /feature-flags`, тело `{ key, title }` — сервер создаёт флаг **выключенным**); если тумблер включён, после создания досылается `featureFlagsControllerUpdate` (`PATCH /feature-flags/{id}`, `{ enabled: true }`). `featureFlagsControllerUpdate` в edit шлёт **только изменённые** title/enabled (ключ неизменяем, в тело не попадает).
- **Валидация (create):** ключ и название непустые, ключ — по паттерну, иначе inline-ошибка + тост, отправки нет.
- **После успеха:** тост («Флаг создан»/«Флаг сохранён») и `router.back()`; ошибка — баннер в форме.
- **Режим edit:** сущность грузится до монтирования формы (`useAdminFlagEntity`), пропсы формы стабильны.

## Связанные документы

- [../features/feature-flags.md](../features/feature-flags.md) — фича-флаги (клиентский гейтинг + админ-UI)
- [../features/admin.md](../features/admin.md) — интерфейс администратора
- [../contracts/rest-api.md](../contracts/rest-api.md) — карта `/feature-flags`-эндпоинтов
- [admin-users.md](./admin-users.md) — раздел пользователей (источник списка для исключений)
- [README.md](./README.md) — индекс screens

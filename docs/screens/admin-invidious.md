# Экран «Источники импорта» (админка)

**Маршрут:** `/admin/invidious` (файл `app/admin/invidious.tsx` → реэкспорт `pages/admin-invidious`)
**Файлы:** `src/pages/admin-invidious/ui/AdminInvidiousScreen.tsx` (+ `InvidiousInstanceRow.tsx`, `styles.ts`), `lib/useInvidiousInstancesAdmin.ts`, `lib/instanceUrl.ts`, `lib/useInvidiousScreens.tsx`
**Статус:** готов

## Что делает

Управляет списком Invidious-инстансов, которые приложение предлагает при импорте аудио проповеди из YouTube/Invidious. Список хранится на бэкенде (`invidious-instances`) и отдаётся форме импорта как пресеты-чипсы; правки на экране сохраняются полной заменой (`PUT`).

## Что показывается

`AdminInvidiousScreen`:

- Заголовок «Источники импорта» и подсказка «Invidious-инстансы, которые предлагаются при импорте проповеди.».
- Строка добавления: `TextInput` «Новый инстанс» (плейсхолдер `https://`) + кнопка «Добавить» (submit по Enter).
- Список `InvidiousInstanceRow`: адрес (`MovingText`) и `IconButton` «Удалить» (`trash-outline`).
- Футер с кнопкой «Сохранить» (спиннер во время сохранения, disabled пока список не изменён или идёт сохранение).
- `ConfirmDialog` «Удалить инстанс?» перед удалением (удаление применяется к списку в памяти и уходит на сервер при сохранении).

Экран доступен только роли admin: `useRequireAdminRole()` (не-admin редиректит на `/admin`), а вход на экран — пункт «Источники импорта» в `AdminQuickActions` на главной админки, показанный только при `isAdminUser(user)`. Экран объявлен вне таб-группы в стеке `/admin` (`useInvidiousScreens` в `app/admin/_layout.tsx`), «Назад» — `HeaderBackButton` с фолбэком `/admin`.

## Откуда данные

- `lib/useInvidiousInstancesAdmin.ts` — состояние экрана: загрузка `invidiousInstancesControllerFindAll` (`GET /invidious-instances`), правки в памяти, сохранение `invidiousInstancesControllerReplace` (`PUT /invidious-instances`, тело `{ urls }` — **полная замена**, порядок массива = порядок UI). Оба запроса — под админ-токеном (интерцептор `axiosInstance`).
- `lib/instanceUrl.ts` — `validateInstanceUrl`: адрес обязан начинаться с `https://` (требование бэкенда) и не дублировать уже добавленные; результат `ok | invalid | duplicate`.

## Куда можно перейти

- `/admin` — «Назад» (fallback-маршрут, если истории нет).

## Состояния

- Загрузка: `AdminContentSkeleton` (шапка и поле добавления остаются).
- Пусто: `EmptyState` «Источников пока нет».
- Ошибка загрузки: текст «Не удалось загрузить источники импорта» + `reportError` (глобальный диалог с деталями).
- Ошибка сохранения: `reportError` («Не удалось сохранить источники импорта») — диалог; сохранение не сбрасывает локальные правки.
- Валидация добавления: неверный адрес/дубликат → `showToast` («Адрес должен начинаться с https://» / «Такой инстанс уже добавлен»), запись не добавляется.
- Успех сохранения: тост «Источники импорта сохранены», список синхронизируется с ответом сервера.
- Офлайн: запросы падают в `reportError`; экран остаётся в состоянии ошибки загрузки (кэша нет).

## Связанные документы

- [../features/admin.md](../features/admin.md) — интерфейс администратора, раздел «Источники импорта»
- [../contracts/rest-api.md](../contracts/rest-api.md) — карта `/invidious-instances`-эндпоинтов
- [admin-home.md](./admin-home.md) — быстрое действие «Источники импорта»
- [README.md](./README.md) — индекс screens

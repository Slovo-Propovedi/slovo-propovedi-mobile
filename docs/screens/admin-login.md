# Экран «Вход в интерфейс администратора»

**Маршрут:** `/admin/login`
**Файлы:** `app/admin/login.tsx` → `export { AdminLoginScreen as default }` из `pages/admin-login`
**Статус:** готов

## Что делает

Форма входа в интерфейс администратора: логин/пароль, проверка роли, уведомление об успехе и возврат на «Еще».

## Что показывается

`AdminLoginScreen` (`src/pages/admin-login/ui/AdminLoginScreen.tsx`):

- заголовок «Вход в интерфейс администратора» и подсказка;
- поля `AdminLoginField` (`AdminLoginField.tsx`): «Имя пользователя» и «Пароль» (`secureTextEntry`);
- баннер ошибки (красный текст) при неудачном входе или отсутствии прав;
- кнопка «Войти» (primary-цвет, `ActivityIndicator` во время отправки, неактивна при пустых полях).

## Откуда данные

- Экшены `signIn` и атомы `authStatusAtom`/`authUserAtom` из `entities/auth`.
- Сервер — `authControllerSignIn` (`POST /auth/login`) через `shared/api`.
- Ошибки — текст из `getErrorMessage` (`shared/lib/error-utils`).
- Уведомление об успехе — `showToast('Вход выполнен')` (`shared/model`), глобальный `Toast` (рендерится в `app/_RootLayout.tsx`).

## Куда можно перейти

- Успешный вход (роль admin/moderator) → показывается тост «Вход выполнен», затем `router.replace('/more')`. В `/admin` после входа **не** переходим.
- Роль `user` → вход отклоняется («Нет доступа к интерфейсу администратора»), токены не сохраняются.
- Шапка экрана — кнопка «Назад» (`HeaderBackButton`, фолбэк `/settings`).

## Состояния

- Загрузка: индикатор внутри кнопки, поля остаются доступными. Пока `authStatus === 'loading'` и мы на `/admin/login`, экран входа остаётся смонтированным (спиннер показывается только для неразрешённой сессии на защищённых маршрутах).
- Ошибка: баннер над полями, токены/кэш не записываются.
- Успех: тост + возврат на «Еще».

## Связанные документы

- [admin-home.md](./admin-home.md)
- [../contracts/rest-api.md](../contracts/rest-api.md)
- [../contracts/storage.md](../contracts/storage.md)

---
name: profile
description: Переключение профиля моделей Crush — список профилей, активация, механика применения (профили в .crush/profiles/*.sh). Вызывать, когда пользователь просит переключить или показать профиль моделей.
user-invocable: true
---

# Profile — переключение профилей моделей Crush

Порт механизма `/profile` из OpenCode (`.opencode/plugins/profile`), сведённый
к возможностям Crush: профили — это bash-файлы в `.crush/profiles/*.sh`,
задающие два модельных слота (`model large` / `model small`). Профиль
применяется при старте Crush через `.crushrc` → `.crush/config.sh`.

## Что делать при вызове этой команды

1. Запусти список профилей (не меняя ничего):

   ```sh
   bash .crush/tools/profile.sh
   ```

2. Если пользователь назвал конкретный профиль — переключи его:

   ```sh
   bash .crush/tools/profile.sh <имя>
   ```

3. Если пользователь не назвал профиль — покажи вывод списка и спроси, какой
   включить. Есть и прямые user-invocable команды `project:profile-<имя>`
   (на каждый профиль, как `/profile-<имя>` в OpenCode): см. скиллы
   `profile-go-glm-and-deepseek`, `profile-go-glm-and-free`,
   `profile-zai-and-free`, `profile-zai-and-go-deepseek`.

## Как применяется

- Выбор сохраняется в `.crush/active-profile` и подхватывается **при
  следующем старте** `crush` — crushrc исполняется только при загрузке.
- Разовый запуск без переключения: `CRUSH_PROFILE=<имя> crush`.
- Внутри уже запущенной сессии модели меняются вручную пикером (`ctrl+l`)
  по refs из вывода команды (`provider/model`).
- Обратный переход к стандартным моделям: удали state-файл
  `.crush/active-profile` и перезапусти Crush.

## Профили (эквивалент OpenCode)

| Профиль               | large (primary/оркестратор) | small (исполнители)     |
| --------------------- | --------------------------- | ----------------------- |
| `go_glm_and_deepseek` | `opencode-go/glm-5.3-flash` | `opencode-go/deepseek-v4.1-flash` |
| `go_glm_and_free`     | `opencode-go/glm-5.3-flash` | `opencode-go/deepseek-v4.1-flash` (замена `big-pickle`) |
| `zai_and_free`        | `zai/glm-5.3-flash`         | `opencode-go/deepseek-v4.1-flash` (замена `big-pickle`) |
| `zai_and_go_deepseek` | `zai/glm-5.3-flash`         | `opencode-go/deepseek-v4.1-flash` |

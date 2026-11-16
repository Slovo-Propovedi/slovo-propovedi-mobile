---
name: profile-go-glm-and-deepseek
description: Активировать профиль моделей go_glm_and_deepseek — large opencode-go/glm-5.3-flash (оркестратор), small opencode-go/deepseek-v4.1-flash (исполнители).
user-invocable: true
---

# Profile: go_glm_and_deepseek

Прямая активация профиля моделей (аналог `/profile-go_glm_and_deepseek` в
OpenCode). Модели: large `opencode-go/glm-5.3-flash`, small
`opencode-go/deepseek-v4.1-flash`.

Выполни:

```sh
bash .crush/tools/profile.sh go_glm_and_deepseek
```

Профиль применится при следующем старте `crush`; в текущей сессии модели
переключаются пикером (`ctrl+l`) по refs из вывода команды. Покажи вывод
команды пользователю.

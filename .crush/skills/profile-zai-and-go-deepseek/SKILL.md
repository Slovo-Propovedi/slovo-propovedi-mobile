---
name: profile-zai-and-go-deepseek
description: Активировать профиль моделей zai_and_go_deepseek — large zai/glm-5.3-flash (оркестратор), small opencode-go/deepseek-v4.1-flash (исполнители).
user-invocable: true
---

# Profile: zai_and_go_deepseek

Прямая активация профиля моделей (аналог `/profile-zai_and_go_deepseek` в
OpenCode). Модели: large `zai/glm-5.3-flash`, small
`opencode-go/deepseek-v4.1-flash`.

Выполни:

```sh
bash .crush/tools/profile.sh zai_and_go_deepseek
```

Профиль применится при следующем старте `crush`; в текущей сессии модели
переключаются пикером (`ctrl+l`) по refs из вывода команды. Покажи вывод
команды пользователю.

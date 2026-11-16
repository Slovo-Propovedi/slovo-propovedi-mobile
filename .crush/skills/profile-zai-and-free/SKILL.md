---
name: profile-zai-and-free
description: Активировать профиль моделей zai_and_free — large zai/glm-5.3-flash (оркестратор), small opencode-go/deepseek-v4.1-flash (замена big-pickle).
user-invocable: true
---

# Profile: zai_and_free

Прямая активация профиля моделей (аналог `/profile-zai_and_free` в
OpenCode). Модели: large `zai/glm-5.3-flash`, small
`opencode-go/deepseek-v4.1-flash` (в Crush стоит вместо недоступного
`opencode/big-pickle`).

Выполни:

```sh
bash .crush/tools/profile.sh zai_and_free
```

Профиль применится при следующем старте `crush`; в текущей сессии модели
переключаются пикером (`ctrl+l`) по refs из вывода команды. Покажи вывод
команды пользователю.

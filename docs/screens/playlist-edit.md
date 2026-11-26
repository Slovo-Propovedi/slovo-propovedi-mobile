# Экран редактирования плейлиста

**Маршрут:** `/listen/playlist-edit?playlist=<id плейлиста>`
**Файлы:** `app/(tabs)/listen/playlist-edit.tsx` → `export { PlaylistEditScreen as default }` из `pages/playlist-edit`
**Статус:** готов

## Что делает

Редактирует **локальный (пользовательский) не-избранный** плейлист: переименование и
перестановка порядка проповедей, а также удаление плейлиста. Открывается карандашом в шапке
экрана плейлиста (`PlaylistEditButton` → `router.push('/listen/playlist-edit?playlist=<id>')`).
Заменяет прежнюю модалку `EditLocalPlaylistModal`; сама форма создания плейлиста осталась
модалкой (`CreateLocalPlaylistModal`).

## Что показывается

- Нативная шапка стека «Слушать» с заголовком **«Редактировать плейлист»** и кнопкой «Назад»
  (общий `HeaderBackButton` с фолбэком `/listen`; маршрут зарегистрирован в
  `app/(tabs)/listen/_layout.tsx`).
- **Галочка «Сохранить изменения»** (`IconButton`, `Ionicons 'checkmark'`,
  `accessibilityLabel` «Сохранить изменения») в правой части шапки — основная видимая кнопка
  сохранения. Ставится хуком `usePlaylistEditHeader` через `navigation.setOptions` (паттерн
  `usePlaylistNavigationOptions`), недоступна, пока нет изменений (та же `canSave`, что у нижней
  панели), и очищается на размонтировании.
- Поле «Название» (`FormField`) в шапке списка — предзаполнено текущим названием.
- Заголовок «Проповеди (N)» и drag-список проповедей (`DraggableFlatList`). Каждая строка
  (`PlaylistEditSermonRow`, `ListItemBase` `surface`-варианта) показывает **бегущее однострочное
  название** (`movingTitle` → `MovingText`/`MarqueeText`, как в админ-строках) и подпись
  «проповедник · ссылка на Писание» (`sermonSubtitle` из `entities/sermon`; без ссылки на
  Писание вырождается в одного проповедника) — паритет со строкой админ-плейлиста
  (`PlaylistDetailSermonRow`). Строка несёт **всегда видимую drag-ручку** (`ListItemDragHandle`,
  `accessibilityLabel` «Переместить проповедь»). Перестановка стартует **только с ручки**; тап и
  long-press по телу строки ничего не делают. Добавления/удаления проповедей на этом экране нет.
- Кнопка «Удалить плейлист» (корзина, `COLORS.error`) в футере списка — с подтверждением
  `LocalPlaylistDeleteDialog` (`ConfirmDialog`, «Удалить плейлист?»).
- Закреплённая нижняя панель с кнопкой «Сохранить» (`PressableButton`), недоступной, пока
  название пустое/пробельное и ничего не изменено.
- **Широкая раскладка.** Плавающий верхний остров табов накрывает нативную шапку
  «Редактировать плейлист» (заголовок, «Назад», галочка сохранения) — экран не резервирует
  `topChromeHeight`; известный долг — [../debt.md](../debt.md) → «Navigation».
- Кнопка «?» в шапке (`OnboardingHelpRow`, слева от галочки «Сохранить изменения») —
  онбординг/обзор возможностей (см. [../features/onboarding.md](../features/onboarding.md)).
  Окрашена в `currentTheme.primary` — как галочка рядом.

## Откуда данные

- Параметр маршрута `playlist` — **id плейлиста** (`useLocalSearchParams<{ playlist: string }>`).
  Плейлист берётся из `myPlaylistsAtom` (`entities/playlist`); при необходимости атом
  догидратируется (`loadMyPlaylists`, гейт по `myPlaylistsLoadedAtom`). «Избранные» и
  неизвестный id считаются ненайденными (`EmptyState` «Плейлист не найден») — их нельзя
  редактировать.
- Проповеди для списка собирает `usePlaylistDisplaySermons`
  (`src/pages/playlist-edit/lib/`): у снапшот-плейлиста это его `sermons` как есть, а у
  id-only плейлиста (импорт из ссылки «только по id») id резолвятся по локально доступному
  каталогу теми же примитивами `buildSermonIndex` + `buildLocalPlaylist` из `entities/playlist`,
  что и на экране плейлиста (`usePlaylistById`, tier 0). Поэтому импортированный плейлист
  показывает найденные проповеди, а не пустой список; неизвестные id молча пропускаются, а
  плейлист без резолвимых проповедей остаётся пустым («В плейлисте пока нет проповедей»).
  Сохранение перестановки пишет только порядок `sermonIds` (экшен `reorderLocalPlaylistSermons`
  переставляет id, не материализуя снапшоты) — slim-дизайн импортированного плейлиста
  сохраняется.
- Состояние формы — `usePlaylistEditForm` (`src/pages/playlist-edit/lib/`): локальная копия
  названия и **явный пользовательский порядок** `userOrder: SermonShape[] | null`. Пока
  `userOrder === null`, список показывает живую базу `usePlaylistDisplaySermons` — поэтому
  поздняя гидратация секций на cold start наполняет список и не включает «Сохранить»;
  изменение порядка фиксируется только после drag (`setUserOrder`), а детект изменения идёт
  против текущей отображённой базы. Сохранение вызывает только изменившиеся
  части: переименование `renameLocalPlaylist` и/или перестановку `reorderLocalPlaylistSermons`
  (`entities/playlist`), затем `router.back()`. Та же `save` подключена к галочке в шапке
  (`usePlaylistEditHeader`, `src/pages/playlist-edit/lib/`) и к нижней панели. Перед сохранением
  форма при необходимости гидратирует `myPlaylistsAtom` (`loadMyPlaylists`, гейт по
  `myPlaylistsLoadedAtom`), чтобы read-modify-write не шёл по негидратированному атому. Экшен
  reorder переставляет и снапшоты `sermons`, и `sermonIds`, пишет `myPlaylists` через
  `persistMyPlaylists` и пинит «Избранные» первыми (`withFavoritesFirst`); «Избранные»/неизвестный
  id — no-op.
- Строки drag-списка рендерит стабильный `usePlaylistEditItemRenderer`
  (`src/pages/playlist-edit/ui/usePlaylistEditItemRenderer.tsx`, `useCallback`), поэтому список
  не перерисовывается на каждый символ в поле названия.
- Удаление — `useLocalPlaylistDelete` + `LocalPlaylistDeleteDialog`
  (`features/local-playlist-form`); после удаления — `router.back()`.

## Куда можно перейти

- «Назад» / успешное сохранение / удаление → `router.back()` — возврат на экран плейлиста.

## Состояния

- Загрузка: пока атом не гидратирован, экран ничего не рендерит (плейлист ещё не найден).
- Пусто: «В плейлисте пока нет проповедей» (`EmptyState` в `ListEmptyComponent`).
- Ненайдено: «Плейлист не найден» (неизвестный id или «Избранные»).
- Ошибка: отказ записи в AsyncStorage логируется, но атом уже закоммичен (та же политика
  деградации, что у остальных мутаций плейлистов).

## Связанные документы

- [features/my-playlists.md](../features/my-playlists.md)
- [screens/playlist.md](./playlist.md)
- [screens/my-playlists.md](./my-playlists.md)

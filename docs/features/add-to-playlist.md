# Добавление проповеди в плейлист («Добавить в плейлист»)

Действие в контекст-меню проповеди: открывает модалку мультивыбора локальных
плейлистов. Чекбоксы меняют только черновик, а принадлежность применяется по
кнопке «Сохранить»; «Отмена» и тап по фону правки отбрасывают. Та же модалка
работает в **батч-режиме** — «Добавить все проповеди в плейлист» из меню шапки
плейлиста добавляет/убирает сразу весь исходный список проповедей.

В правом верхнем углу шапки модалки, на одной строке с заголовком, стоит
иконка-кнопка **«Создать плейлист»** (плюс): она разворачивает встроенную форму
создания, и новый пустой плейлист сразу появляется в списке — отметить его и
сохранить можно, не выходя из модалки.

**Файлы:**

- `src/entities/playlist/localPlaylistMembership.ts` — экшен `togglePlaylistSermon`
- `src/entities/playlist/localPlaylistStorage.ts` — приватный `persistMyPlaylists`
- `src/entities/playlist/lib/useCreateLocalPlaylist.ts` — общий хук создания плейлиста
  (см. [my-playlists.md](./my-playlists.md) → «Создание, переименование, удаление»)
- `src/features/add-to-playlist/index.ts` — публичный API (`useAddToPlaylistModal`, тип `AddToPlaylistControls`)
- `src/features/add-to-playlist/lib/addToPlaylistState.ts` — тип состояния (`sermon` | `all`)
- `src/features/add-to-playlist/lib/addToPlaylistControls.ts` — DI-типы (`AddToPlaylistControls` / `AddToPlaylistBindings`)
- `src/features/add-to-playlist/lib/useAddToPlaylistModal.tsx` — экранный хук: состояние + готовый элемент `modal`
- `src/features/add-to-playlist/lib/useMembershipDraftValues.ts` — общий черновик (dirty-гейт) для обоих режимов
- `src/features/add-to-playlist/lib/useAddToPlaylistControls.ts` — отдаёт управление выбором владельцу (DI)
- `src/features/add-to-playlist/lib/useMembershipDraft.ts` — черновик одной проповеди
- `src/features/add-to-playlist/lib/useAllMembershipDraft.ts` — черновик батч-режима
- `src/features/add-to-playlist/lib/applyAllMembership.ts` — применение батч-черновика + тост лимита
- `src/features/add-to-playlist/lib/useSortedPlaylists.ts` — начальная принадлежность + сортировка
- `src/features/add-to-playlist/ui/AddToPlaylistModal.tsx` — модалка (диспетчер режимов)
- `src/features/add-to-playlist/ui/AddSermonToPlaylistContent.tsx` — содержимое режима одной проповеди
- `src/features/add-to-playlist/ui/AddAllToPlaylistContent.tsx` — содержимое батч-режима
- `src/features/add-to-playlist/ui/AddToPlaylistBody.tsx` — тело: шапка (заголовок + иконка создания) и список ↔ встроенная форма
- `src/features/add-to-playlist/ui/CreatePlaylistInlineForm.tsx` — форма создания внутри модалки
- `src/features/add-to-playlist/ui/AddToPlaylistFooter.tsx` — футер «Отмена»/«Сохранить»
- `src/features/add-to-playlist/ui/PlaylistMembershipList.tsx` — ограниченный по высоте список
- `src/features/add-to-playlist/ui/PlaylistMembershipRow.tsx` — строка: название + чекбокс

## Экшен сущности

`togglePlaylistSermon(ctx, playlistId, sermon, contained)` (`entities/playlist`) —
единственный мутирующий путь наполнения локального плейлиста. `sermon` — **полный
снапшот** проповеди (`SermonShape`), а не только id: при добавлении кладётся
санитизированный снапшот, при удалении — фильтрация по `sermon.id`. Вызывается
только при сохранении черновика (см. ниже), по одному разу на изменившийся плейлист.

1. Находит плейлист в `myPlaylistsAtom`; **неизвестный id — no-op** (возвращает
   текущий список).
2. **Идемпотентность:** если `contained` уже совпадает с фактическим состоянием —
   no-op (без записи и без коммита).
3. Строит новый список: `contained` — дописывает санитизированный снапшот
   (`toPersistedLocalSermon`: `artwork ?? null`, `playlists` — лёгкие рефы
   `{ artwork, id, title, sermons: [] }`) в конец `sermons`,
   иначе — фильтрует по `sermon.id`. `sermonIds` обновляется напрямую
   (авторитетный список: id дописывается с дедупликацией при добавлении и
   фильтруется при удалении), а `sermons` получает снапшот — ids не выводятся
   из `sermons`, иначе id-only участники импортированного плейлиста терялись бы.
   «Избранные» обрабатываются тем же кодом, что и любой другой плейлист.
4. **Мгновенный коммит, затем запись:** чтение атома → вычисление
   `nextPlaylists` → `ctx.schedule`, коммитящий `myPlaylistsAtom`, идут без
   `await` между ними, поэтому два быстрых переключения не теряют изменение друг
   друга (lost update); `persistMyPlaylists(nextPlaylists)` (тот же путь, что у
   `reorderMyPlaylists`) выполняется уже после коммита. Отказ хранилища не
   пробрасывается: логируется
   (`console.error('[togglePlaylistSermon] failed to persist membership:', …)`),
   атом остаётся закоммиченным — та же политика деградации, что и при гидратации
   и reorder (см. [my-playlists.md](./my-playlists.md)).

**Закрытие плеера при удалении текущей проповеди.** Если исход — `removed` и
удаляемая проповедь сейчас играет **из этого же** плейлиста
(`currentAudioAtom.id === sermon.id` и `currentPlaylistAtom.id === playlistId`),
экшен вызывает `resetPlaybackAction` (`entities/player` через `@x/playlist`) —
плеер и миниплеер закрываются. Это единая точка сброса для **всех** поверхностей
удаления (меню строки, меню плеера, снятие галочки в модалке), поэтому UI больше
не дублирует сброс у себя — только предупреждает в диалоге. Добавление и удаление
не-текущей/чужой проповеди плеер не трогают.

## Модалка

`AddToPlaylistModal` — «глупый» компонент-диспетчер: `visible`/`onClose` держит
вызывающий экран, `state` — дискриминированный union `AddToPlaylistState`
(`{ kind: 'sermon', sermon }` | `{ kind: 'all', playlist }`). По режиму он рендерит
`AddSermonToPlaylistContent` (одна проповедь) или `AddAllToPlaylistContent`
(батч). Внутри режима одной проповеди `sermon` — полная `SermonData` (для
проверки принадлежности используется `sermon.id`, для добавления сохраняется
снапшот):

- `useSortedPlaylists(sermonIds)` подписан на `myPlaylistsAtom` и возвращает
  `{ isContained, playlist }[]`, отсортированный так: **сначала плейлисты,
  содержащие весь набор, затем остальные** (для одной проповеди набор — один id). Внутри каждой группы сохраняется
  порядок атома, поэтому «Избранные» (запиннены первыми в `myPlaylistsAtom`,
  см. [my-playlists.md](./my-playlists.md)) остаются первыми **и в своей группе**
  независимо от принадлежности. Список — **все** плейлисты атома, включая
  пользовательские: созданные формой (`createLocalPlaylist`) плейлисты — и на экране
  «Мои плейлисты», и встроенной формой в самой модалке — появляются в модалке
  автоматически (живая подписка), отдельного фильтра «только избранное» нет.
  Возвращаемый `isContained` — **снимок** атома: он задаёт начальное значение
  черновика и блокировку заполненных плейлистов, а не отражает ещё не сохранённые
  правки.
- `useMembershipDraft(sermon)` (режим одной проповеди) — **черновик**
  принадлежности: `values` (`Record<playlistId, boolean>`, инициализируется из
  `myPlaylistsAtom` по `sermon.id`, «Избранные» включены), `isDirty`,
  `toggle(playlistId)`, `setChecked(playlistId, checked)` (точечная установка —
  ею пользуется тур) и `save()`. `toggle`/`setChecked` меняют только черновик
  (`myPlaylistsAtom` не трогается); `save` последовательно вызывает
  `togglePlaylistSermon(ctx, id, sermon, value)` **только для изменившихся**
  плейлистов (исход каждого вызова не разбирается — `void`).
- `useAllMembershipDraft(playlist)` (батч-режим) — черновик пачки: чекбокс
  включён, когда целевой плейлист содержит **все** проповеди исходного
  (`target.sermonIds.length > 0 && sourceIds.every(...)`); `save` вызывает
  `applyAllMembership` (см. ниже) по актуальному `myPlaylistsAtom`.
- `PlaylistMembershipList` — `FlatList` с ограничением `maxHeight` (360), чтобы
  длинный набор плейлистов скроллился, а не рос за экран. Рендерит строки из
  **черновика** (`values`), а не из живого атома.
- `PlaylistMembershipRow` — `CheckboxField`: тап по строке вызывает только
  `toggle` черновика и **не** закрывает модалку. Если плейлист заполнен до
  `MAX_CUSTOM_PLAYLIST_SERMONS` (200) и проповеди в нём изначально нет (в
  батч-режиме — не содержит весь набор), строка **отключена** (`disabled`) с
  подсказкой «Достигнут лимит — 200 проповедей» (в одиночном режиме сохранение
  туда недостижимо; в батч-режиме частичное добавление доходит до лимита по
  «Сохранить» и показывает тост — см. ниже). Содержащую проповедь строку
  отключать нельзя — её можно снять.
- `AddToPlaylistFooter` — две кнопки: **«Сохранить»** (primary; недоступна, пока
  черновик не изменён — гейт по `isDirty`; по нажатию `save()` применяет изменения
  и закрывает модалку) и **«Отмена»** (закрывает и отбрасывает черновик). Тап по
  фону равнозначен «Отмене» (проп `onClose`). Пустой набор плейлистов невозможен:
  `myPlaylistsAtom` всегда содержит хотя бы «Избранные».

`useAddToPlaylistModal` открывает модалку **следующим кадром**
(`requestAnimationFrame`): контекст-меню — тоже нативная `Modal`, и она
закрывается своим кадром. Без задержки оба нативных `Modal` монтировались бы в
одном коммите и на Android накладывались бы друг на друга; возвращаемый API хука
не меняется. Тот же дефер применён и к `openAddAllToPlaylist` (меню шапки — тоже
нативная `Modal`).

### Создание плейлиста из модалки

В **обоих режимах** шапку модалки рендерит `AddToPlaylistBody`: заголовок
«Добавить в плейлист» слева и в правом верхнем углу, на той же строке, —
иконка-кнопка **«Создать плейлист»** (`IconButton`, `Ionicons 'add'` цвета
`primary`, `accessibilityLabel` «Создать плейлист»). Пока форма открыта, тот же
угол показывает крестик **«Вернуться к списку плейлистов»** (`Ionicons 'close'`
цвета `text`). Тап по плюсу подменяет **список и футер**
(«Отмена»/«Сохранить») встроенной формой `CreatePlaylistInlineForm`: `FormField`
«Название» (плейсхолдер «Например: Проповеди недели») и две кнопки — «Отмена» и
«Создать». Enter в поле отправляет форму через `FormSubmitContext`.

- «Создать» недоступна, пока обрезанное название пустое или отправка в полёте.
  Создание идёт через `useCreateLocalPlaylist` (`entities/playlist`): при
  необходимости хук гидратирует `myPlaylistsAtom` (`loadMyPlaylists` по
  `myPlaylistsLoadedAtom`), затем вызывает
  `createLocalPlaylist({ title: trimmed, sermonIds: [] })` — плейлист создаётся
  **без проповедей**, повторная отправка заблокирована до завершения текущей.
- Навигации нет: по `onCreated` форма просто возвращается к списку. Крестик в
  углу шапки и «Отмена» в форме делают то же самое и ничего не создают.
- Новый плейлист появляется в списке **сразу** — `useSortedPlaylists` живая
  подписка на `myPlaylistsAtom`, перезапроса нет. `createLocalPlaylist` пинит его
  сразу после «Избранных», поэтому в группе плейлистов, не содержащих набор, он
  оказывается первым.
- Черновик галочек живёт выше формы (в контентных компонентах режима), поэтому и
  создание, и отмена сохраняют уже отмеченные плейлисты. Дальше пользователь сам
  отмечает новый плейлист и жмёт «Сохранить» — принадлежность применяется обычным
  путём (см. выше).

### DI-пропсы (dependency inversion)

Модалка принимает опциональные `AddToPlaylistBindings` (паттерн bind из
`entities/track-list`): `renderRowWrapper(row, playlistId)` оборачивает строку
плейлиста, `renderCreateWrapper(create)` — кнопку-иконку «Создать плейлист»,
`renderSaveWrapper(save)` — кнопку «Сохранить», а
`bindControls({ setPlaylistChecked })` отдаёт владельцу управление выбором
(`null` на анмаунте снимает привязку). `useAddToPlaylistModal` прокидывает их в
модалку как есть. Фича об онбординге не знает — мост живёт на слое страницы:
`useAddToPlaylistTour` (`pages/playlist`) отдаёт обёртки строки «Избранных»,
кнопки-иконки «Создать плейлист» и кнопки «Сохранить» в `OnboardingTarget`
(`playlist.add-modal-favorites` / `playlist.add-modal-create` /
`playlist.add-modal-save`) и регистрирует действие тура
`check-add-modal-favorites`; с самой модалкой эту обвязку связывает
`usePlaylistAddToPlaylist`. Реализация `renderSaveWrapper` обязана сохранить
геометрию кнопки (`flex: 1` на обёртке), иначе `OnboardingTarget`-View сожмёт
«Сохранить» (пример — `useAddToPlaylistTour`). См.
[features/onboarding.md](./onboarding.md).

## Батч-режим «Добавить все проповеди в плейлист»

Пункт меню шапки плейлиста открывает ту же модалку в режиме
`{ kind: 'all', playlist }`. Начальный чекбокс целевого плейлиста включён, только
если он содержит **все** проповеди исходного. Сохранение (`applyAllMembership`):

1. Для каждого **изменившегося** плейлиста берётся снимок `sermonIds` из
   `myPlaylistsAtom` в момент «Сохранить».
2. Включённый плейлист добирает только **отсутствующие** проповеди исходного
   списка (`togglePlaylistSermon(ctx, id, sermon, true)` по снапшотам).
3. На первом исходе `limit-reached` добавление в этот плейлист **останавливается**
   и показывается тост **«В плейлисте максимум 200 проповедей»** (`showToast` из
   `shared/model`); остальные целевые плейлисты обрабатываются как обычно.
4. Выключенный плейлист (был заполнен всем набором) теряет **все** исходные
   проповеди (`togglePlaylistSermon(..., false)` по каждой).

Как и в одиночном режиме, чекбоксы меняют только черновик, «Сохранить» доступно
лишь при изменениях, «Отмена»/фон черновик отбрасывают. Пункт меню рендерится
**только на экране плейлиста** и только для непустого плейлиста (колбэк
`onAddAllToPlaylist` приходит пропом; шторка плеера его не передаёт) — см.
[screens/playlist.md](../screens/playlist.md).

## Интеграция по поверхностям

Правило: поверхности — `pages`/`widgets` — импортируют фичу **через её баррель**
(`useAddToPlaylistModal`), но между собой **не** импортируют фичу: вложенные
компоненты получают готовый колбэк `onAddToPlaylist(sermon)` пропом. Одна модалка
монтируется **на поверхность** (не на строку), поэтому в списке рендерится один
`modal`, а не по одному на строку.

- **Экран плейлиста** (`pages/playlist`): `PlaylistScreen` владеет хуком; колбэк
  уходит в `usePlaylistActions` → `buildHistoryMenuActions`. Модалка — на уровне
  экрана.
- **Страница поиска** (`pages/search` + `features/sermon-search`):
  `ListenScreen` владеет хуком и передаёт `onAddToPlaylist` пропом через
  `SearchScreen` → `SearchResultsList` → `SearchResultsRow` → `SermonSearchRow` →
  `buildHistoryMenuActions`. Кросс-фичевого импорта нет.
- **Полноэкранный плеер и шторка очереди** (`widgets/expandable-player`):
  `ExpandablePlayer` владеет хуком (одна модалка). В полноэкранном плеере модалку
  открывает кнопка **＋** в кластере над заголовком трека (`PlayerFavoriteButtons`;
  колбэк идёт `ContainerView` → `FullscreenContent` → `PlayerControlsSection` →
  `PlayerFavoriteButtons`); пункта «Добавить в плейлист» в поповер-меню `PlayerMenu`
  больше нет, а текущая проповедь передаётся кнопке явно (`audio` из
  `PlayerFavoriteButtons`), т.к. это не строка списка. В шторке очереди колбэк
  по-прежнему идёт через меню строк (`FullscreenSheets` → `PlaylistBottomSheet` →
  … → `useSheetMenuActions` → `buildHistoryMenuActions`).
- **Офлайн** (`pages/offline`): `OfflineScreen` владеет хуком, `OfflineRow`
  строит `MenuItem`-массив c «Добавить в плейлист» и передаёт в `TracksListItem`.
- **История** (`pages/history`): `HistoryScreen` владеет хуком, `HistoryRow`
  передаёт колбэк в `buildHistoryMenuActions`.

Пункт меню — иконка `Ionicons 'add-circle'`, текст «Добавить в плейлист»;
добавляется **первым** в `buildHistoryMenuActions`, только когда колбэк задан
(иначе пункт отсутствует — обратная совместимость с существующими меню).
В полноэкранном плеере ту же роль играет кнопка **＋** (`Ionicons
'add-circle-outline'`, `accessibilityLabel` «Добавить в плейлист»): она
рендерится всегда, а без колбэка тап — no-op.

## Удаление из плейлиста (обратное действие)

На экране локального плейлиста (`pages/playlist`) контекст-меню строки получает
пункт **«Удалить из плейлиста»** (иконка MCI `playlist-remove`, сразу после
«Добавить в плейлист») — только для плейлистов, присутствующих в «Мои
плейлисты» (`myPlaylistsAtom` — «Избранные», созданные вручную и
импортированные, включая uuid-id; видимость даёт хук `useIsLocalPlaylist`). Тап не удаляет сразу: экран
открывает подтверждение (`RemoveSermonFromPlaylistDialog` поверх общего
`ConfirmDialog`), и только кнопка «Удалить» вызывает
`togglePlaylistSermon(ctx, playlist.id, sermon, false)`; «Отмена»/закрытие лишь
скрывают диалог. Если удаляемая проповедь сейчас играет из этого плейлиста
(`currentPlaylistAtom`/`currentAudioAtom`, снапшот в момент запроса), в
сообщение добавляется «Плеер будет закрыт.», однако **сам сброс выполняет
`togglePlaylistSermon`** (см. выше) — UI лишь предупреждает, потому что тот же
путь срабатывает и из меню плеера, и из модалки «Добавить в плейлист» при
снятии галочки. Список обновляется из `myPlaylistsAtom` — строка исчезает.
Пункт строится в `usePlaylistActions` (страничная логика), а **не** в
`buildHistoryMenuActions`, поэтому в других меню (история, поиск, шторка плеера,
офлайн) он не появляется. Полноэкранное меню плеера имеет отдельный пункт
«Удалить из текущего плейлиста и открыть в другом» (с подтверждением; после
удаления открывается выбор «Где продолжить прослушивание?», плеер закрывается
только при отказе/отсутствии кандидатов) — см.
[player.md](./player.md).

## Связанные документы

- [features/my-playlists.md](./my-playlists.md)
- [features/track-list.md](./track-list.md)
- [screens/listen.md](../screens/listen.md)
- [screens/playlist.md](../screens/playlist.md)
- [screens/history.md](../screens/history.md)
- [screens/offline.md](../screens/offline.md)

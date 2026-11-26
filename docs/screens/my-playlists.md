# Экран «Мои плейлисты»

**Маршрут:** `/listen/my-playlists`
**Файлы:** `app/(tabs)/listen/my-playlists.tsx` → `export { MyPlaylistsScreen as default }` из `pages/my-playlists`
**Статус:** готов

## Что делает

Редактирование порядка локальных (пользовательских) плейлистов и настроек оформления секции
«Мои плейлисты». Открывается по тапу на заголовок секции «Мои плейлисты» на главном экране
«Слушать». Секция на «Слушать» осталась **только для чтения** (порядок редактируется здесь), но
её внешний вид берётся из настроек, которые задаются на этом экране.

## Что показывается

- **Обычный режим:** нативная шапка **прозрачна** (как у серверного списка плейлистов,
  `headerTransparent: true`, `title: ''`); большой заголовок «Мои плейлисты» рисует сам список
  первым элементом (схлопывающаяся шапка). `headerRight` — карандаш «Изменить порядок»
  (`Ionicons 'create-outline'`). **В режиме редактирования** шапка снова **непрозрачна** и
  возвращает заголовок «Мои плейлисты», а карандаш **скрывается** — остаётся только «Сохранить»
  (галочка `checkmark`). Опции шапки собирает `useMyPlaylistsHeader`
  (`src/pages/my-playlists/lib/useMyPlaylistsHeader.tsx`), действия рендерит
  `MyPlaylistsHeaderActions` (`src/pages/my-playlists/ui/MyPlaylistsHeaderActions.tsx`).
  **Карандаш виден и активен в обычном режиме**, даже когда редактировать нечего (только
  «Избранные»).
- **Обычный режим** (`MyPlaylistsNormalView`, `src/pages/my-playlists/ui/MyPlaylistsNormalView.tsx`)
  — то же тело списка, что у серверного списка секции: общий виджет `PlaylistList`
  (`src/widgets/playlist-list/`) — схлопывающийся контентный заголовок, карточные строки
  (`ListItemBase` card-вариант, плитка обложки `LIST_ITEM_CARD_ARTWORK_SIZE`) и разделители
  (`PlaylistListSeparator`). Первым элементом списка идёт строка «Избранные» — её обложку
  подменяет маркер-сердце (`MyPlaylistsMarkerAvatar`, `Ionicons 'heart'` цвета
  `currentTheme.primary`); ниже — локальные плейлисты; **завершающей строкой футера списка** —
  «Создать плейлист» (`MyPlaylistsCreateRow`: плюс `Ionicons 'add'`, открывает модалку создания),
  то есть под плейлистами; в просмотровом режиме между списком плейлистов и строкой «Создать
  плейлист» — тот же разделитель, что между строками списка. Нижний отступ резервирует место под плавающий мини-плеер и таб-бар
  (`tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low`, как в `PlaylistTrackList`). Тап по
  строке навигирует.
- Список (`MyPlaylistsDragList`, только в режиме редактирования) резервирует снизу место под
  плавающий мини-плеер и таб-бар — последние строки доскролливаются и не прячутся за плеером.
  Горизонтальный отступ (`contentContainerStyle.paddingHorizontal = INDENTS.medium`) задан на самом
  списке и выравнивает drag-строки с закреплённой строкой «Избранные» по одной вертикали.
  В широкой раскладке `contentContainerStyle.paddingTop = topChromeHeight` (`useScreenChromePadding`)
  уводит первую строку из-под плавающего верхнего острова табов; в компактной раскладке это 0.
- **Высота и скролл (web):** `DraggableFlatList` рендерит собственный контейнер без `flex` — на
  react-native-web он растягивается по контенту, и список не скроллится (низ обрезается
  `body { overflow: hidden }` из `public/index.html`). Поэтому контейнеру задан
  `containerStyle={styles.listContainer}` с `flex: 1` (как у `DraggableFlatList` админки, см.
  [features/admin.md](../features/admin.md)).
- Кнопка «?» в шапке (`OnboardingHelpRow`, рядом с карандашом «Изменить порядок»/«Сохранить») —
  онбординг/обзор возможностей (см. [../features/onboarding.md](../features/onboarding.md)).
  Окрашена в `currentTheme.primary` — как карандаш/галочка рядом.

### Режим редактирования

Двумя состояниями управляет локальный state `localOrderIds` (`null` — обычный режим; массив id —
открытый режим). Представление — **админ-подобная форма** (шапка списка `MyPlaylistsEditHeader`):

- `FormGroupTitle` «Оформление» + `MyPlaylistsAppearanceForm`
  (`src/pages/my-playlists/ui/MyPlaylistsAppearanceForm.tsx`) — те же поля, что у формы раздела в
  админке: `SelectField` ×3 («Размер карточек», «Высота карточек», «Расположение заголовка» —
  `on`/`under`/`bothOnAndUnder`),
  `FormField` «Строк» (`number-pad`, разбор через `parseItemsRows`), `CheckboxField` ×2 («Описание
  на карточке», «Скруглённые углы карточек»). Поля названия нет. «Описание на карточке» по
  умолчанию выключено.
  **Каждое изменение применяется мгновенно в памяти** (`updateSectionSettings`: коммит `sectionSettingsAtom`),
  а запись в хранилище (`persistSectionSettings`) дебаунсится 500 мс и флашится на blur поля «Строк» и
  на размонтирование формы — отдельной кнопки сохранения оформления нет; настройки переживают перезапуск
  и сразу влияют на секцию «Мои плейлисты» на «Слушать».
- `FormGroupTitle` «Плейлисты раздела» + закреплённая строка «Избранные»; ниже — drag-список
  остальных плейлистов (`MyPlaylistsDragList`, drag всегда включён).
- Перестановка стартует **только с drag-ручки** строки (`ListItemDragHandle`, `accessibilityLabel`
  «Переместить плейлист») — как в админ-экранах раздела; long-press по телу строки ничего не делает.
  Тап по строкам (включая «Избранные») **не** навигирует. Перестановка меняет локальную копию
  порядка, `myPlaylistsAtom` не трогается.
- Каждая строка плейлиста в режиме редактирования несёт **кнопку удаления** (корзина,
  `accessibilityLabel` «Удалить плейлист»); подтверждение — `LocalPlaylistDeleteDialog`
  (`ConfirmDialog`), удаление — `deleteLocalPlaylist`, после которого id убирается из локальной
  копии порядка. «Избранные» удалить нельзя — кнопки у строки нет.
- «Сохранить» один раз коммитит порядок через `reorderMyPlaylists` (полный порядок: `favorites` +
  локальный порядок; сущность пинит «Избранные» первыми) и выходит из режима. Карандаша в режиме
  редактирования нет — выйти без сохранения можно только уходом с экрана (`useFocusEffect` cleanup),
  который локальную копию **порядка** отбрасывает; настройки оформления при этом сохраняются.
- Даже когда локальных плейлистов нет, в режиме редактирования форма оформления доступна: drag-список
  рендерится всегда, его `listHeader` несёт форму и «Избранные», `listEmpty` — `EmptyState`.

Пока идёт редактирование, порядок строк строится `sortByLocalOrder`
(`src/pages/my-playlists/lib/sortByLocalOrder.ts`): id вне локального порядка (конкурентно
добавленный плейлист) уезжают в конец.

## Откуда данные

- `myPlaylistsAtom` (`entities/playlist`); гидратация `loadMyPlaylists` при монтировании.
- `sectionSettingsAtom` (`entities/playlist`); гидратация `loadSectionSettings` при монтировании,
  изменение — `updateSectionSettings` + дебаунс-запись `persistSectionSettings`
  (см. [features/my-playlists.md](../features/my-playlists.md) → «Настройки оформления секции»).
- `reorderMyPlaylists` — обёртка `useReorderMyPlaylists` (`src/pages/my-playlists/lib/useReorderMyPlaylists.ts`)
  с no-op, если порядок не изменился (`hasOrderChanged`).
- Навигация строк — `useMyPlaylistsNavigation` (`src/pages/my-playlists/lib/useMyPlaylistsNavigation.ts`):
  общий `useNavigationGuard` (гасит двойной тап) + no-op в режиме редактирования.
- Порядок и настройки оформления локальны и переживают перезапуск через AsyncStorage
  (см. [contracts/storage.md](../contracts/storage.md)).

## Куда можно перейти

- Тап по строке (обычный режим) → `/listen/playlist?playlist=<id>`.
- Тап по строке «Избранные» (обычный режим) → `/listen/playlist?playlist=favorites`.
- Тап по строке «Создать плейлист» (обычный режим) → модалка создания; после отправки —
  `/listen/playlist?playlist=<новый id>`.

## Состояния

- Пусто: в обычном режиме список всегда несёт строку «Избранные» (первым элементом), поэтому
  пустого сообщения обычно нет; сообщение виджета «Нет плейлистов» показывается только когда в
  списке нет ни одной строки (нет даже «Избранных»). Строка «Создать плейлист» остаётся футером,
  карандаш — в шапке; в режиме редактирования доступна форма оформления, а его пустое состояние —
  `EmptyState` «Своих плейлистов пока нет».
- Офлайн: список и настройки полностью локальные, работают без сети.

## Связанные документы

- [screens/listen.md](./listen.md)
- [screens/playlist.md](./playlist.md)
- [features/my-playlists.md](../features/my-playlists.md)
- [contracts/storage.md](../contracts/storage.md)

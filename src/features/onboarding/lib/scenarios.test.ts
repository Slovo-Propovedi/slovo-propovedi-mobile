import { resolveStepRoute } from './resolveStepRoute'
import { resolveTourStart } from './resolveTourStart'
import * as whatsNewScenarioData from './scenarioData/whatsNew'
import { scenarios, scenariosById } from './scenarios'
import { buildTourDeck, resolveDeckProgress } from './tourDeck'

const FIRST_ROW_TARGET_ID = 'playlist.first-row'
const ROW_MENU_ADD_TARGET_ID = 'playlist.row-menu-add'
const OFFLINE_ITEM_TARGET_ID = 'more.offline-item'

describe('onboarding scenario data', () => {
  test('welcome runs eight steps and ends on the tours setting', () => {
    const welcome = scenariosById.welcome

    expect(welcome.steps).toHaveLength(8)
    expect(welcome.steps[1].targetId).toBe('app.help-button')
    expect(welcome.steps[7].targetId).toBe('settings.tours')
  })

  test('welcome wires tap hints for the tab and the settings row', () => {
    const welcome = scenariosById.welcome

    expect(welcome.steps[5].tapTargetId).toBe('tab.more')
    expect(welcome.steps[6].tapTargetId).toBe('more.settings-item')
  })

  test('player scenario belongs to the listen screen picker', () => {
    expect(scenariosById.player.screens).toEqual(['/listen'])
  })

  test('player scenario waits for the user to select a sermon and pause', () => {
    const player = scenariosById.player

    expect(player.steps).toHaveLength(4)
    expect(player.steps[0].waitFor).toBe('sermonSelected')
    expect(player.steps[0].tapTargetId).toBe('tab.listen')
    expect(player.steps[1].targetId).toBe('player.mini')
    expect(player.steps[2].targetId).toBe('player.mini-play-pause')
    expect(player.steps[2].waitFor).toBe('paused')
  })

  test('player scenario ends by expanding the mini player to fullscreen itself', () => {
    const expandStep = scenariosById.player.steps[3]

    expect(expandStep.targetId).toBe('player.mini')
    expect(expandStep.tapTargetId).toBe('player.mini')
    expect(expandStep.tapActionId).toBe('expand-player')
  })

  test('whats-new scenario data exports no manual content version', () => {
    expect(Object.keys(whatsNewScenarioData)).toEqual(['whatsNewScenario'])
  })

  test('whats-new opens with a plain card and spotlights the offline rows next', () => {
    const [intro, rows] = scenariosById.whatsNew.steps

    expect(intro.targetId).toBeUndefined()
    expect(intro.route).toBeUndefined()
    expect(intro.tapTargetId).toBeUndefined()
    expect(rows.route).toBe('/offline')
    expect(rows.targetId).toBe('offline.rows')
  })

  test('share scenario falls back globally and leads from «Ещё» into the QR code, copy button and link contents', () => {
    const share = scenariosById.share

    expect(share.screens).toEqual(['/more', '/share'])
    expect(share.globalFallback).toBe(true)
    expect(share.steps).toHaveLength(7)
    expect(share.steps[0].targetId).toBeUndefined()
    expect(share.steps[0].tapTargetId).toBeUndefined()
    // The «Ещё» tab is an entry transition (blink + navigation), not a spotlight card.
    expect(share.steps[1].route).toBe('/more')
    expect(share.steps[1].tapTargetId).toBe('tab.more')
    expect(share.steps[1].targetId).toBeUndefined()
    // Screen-local intro: a same-screen start from «Ещё» lands here.
    expect(share.steps[2].route).toBeUndefined()
    expect(share.steps[2].targetId).toBeUndefined()
    expect(share.steps[2].tapTargetId).toBeUndefined()
    expect(share.steps[3].route).toBe('/share')
    expect(share.steps[3].tapTargetId).toBe('more.share-item')
    expect(share.steps[3].targetId).toBeUndefined()
    expect(share.steps[4].route).toBe('/share')
    expect(share.steps[4].targetId).toBe('share.qr')
    expect(share.steps[5].targetId).toBe('share.copy')
  })

  test('share folds its tab and share-item lead-up into entry transitions', () => {
    const share = scenariosById.share
    const deck = buildTourDeck(share.steps)

    expect(deck).toHaveLength(5)
    expect(deck.map(entry => entry.cardIndex)).toEqual([0, 2, 4, 5, 6])
    expect(deck[1].entryStepIndexes).toEqual([1])
    expect(deck[2].entryStepIndexes).toEqual([3])
    expect(deck.filter(entry => entry.entryStepIndexes.length > 0)).toHaveLength(2)
  })

  test('whatsNew shows both steps as cards', () => {
    const whatsNewDeck = buildTourDeck(scenariosById.whatsNew.steps)

    expect(whatsNewDeck.map(entry => entry.cardIndex)).toEqual([0, 1])
  })

  test('each scenario wires the tab or row it taps when navigating', () => {
    expect(scenariosById.listen.steps[0].tapTargetId).toBe('tab.listen')
    expect(scenariosById.playlists.steps[1].tapTargetId).toBe('listen.my-playlists-title')
    expect(scenariosById.history.steps[1].tapTargetId).toBe('tab.more')
    expect(scenariosById.history.steps[2].tapTargetId).toBe('more.history-item')
    expect(scenariosById.offline.steps[0].tapTargetId).toBe(OFFLINE_ITEM_TARGET_ID)
    expect(scenariosById.offline.steps[1].tapTargetId).toBe(OFFLINE_ITEM_TARGET_ID)
    expect(scenariosById.settings.steps[0].tapTargetId).toBe('more.settings-item')
    expect(scenariosById.settings.steps[1].tapTargetId).toBe('more.settings-item')
    expect(scenariosById.read.steps[0].tapTargetId).toBe('tab.read')
    expect(scenariosById.study.steps[0].tapTargetId).toBe('tab.study')
  })

  test('settings tour follows the visual order of the settings rows', () => {
    const settingsTargets = scenariosById.settings.steps.slice(1).map(step => step.targetId)

    expect(settingsTargets).toEqual([
      'settings.theme',
      'settings.dynamic-colors',
      'settings.haptics',
      'settings.tours',
      'settings.backup',
      'settings.server',
    ])
  })

  test('settings merges the intro into the lead-up card and splits the theme step', () => {
    const settings = scenariosById.settings

    expect(settings.steps).toHaveLength(7)
    expect(settings.steps[0]).toEqual({
      route: '/more',
      tapTargetId: 'more.settings-item',
      targetId: 'more.settings-item',
      text: 'Чтобы открыть настройки, тапните по пункту «Настройки». Нажмите «Далее».',
      title: 'Настройки',
    })
    expect(settings.steps[1].targetId).toBe('settings.theme')
    expect(settings.steps[1].text).toBe('Светлая и тёмная темы.')
    expect(settings.steps[2].targetId).toBe('settings.dynamic-colors')
    expect(settings.steps[2].skipIfMissing).toBe(true)
  })

  test('backup scenario falls back globally and opens the path into the backup section', () => {
    const backup = scenariosById.backup

    expect(backup.screens).toEqual(['/more', '/settings'])
    expect(backup.globalFallback).toBe(true)
    expect(backup.steps).toHaveLength(9)
    // The opening description card is routeless, so the tour always starts with it.
    expect(backup.steps[0].route).toBeUndefined()
    expect(backup.steps[0].targetId).toBeUndefined()
    // The «Ещё» tab is an entry transition (blink + navigation), not a spotlight card.
    expect(backup.steps[1].route).toBe('/more')
    expect(backup.steps[1].tapTargetId).toBe('tab.more')
    expect(backup.steps[1].targetId).toBeUndefined()
    // The screen-local intro card is routeless and inherits «/more», so a same-screen
    // start from «Ещё» lands on it instead of the bare spotlight card below.
    expect(backup.steps[2].route).toBeUndefined()
    expect(backup.steps[2].targetId).toBeUndefined()
    expect(backup.steps[2].text).toMatch(/^Резервная копия сохраняет/)
    expect(backup.steps[3].route).toBe('/more')
    expect(backup.steps[3].tapTargetId).toBe('more.settings-item')
    expect(backup.steps[3].targetId).toBe('more.settings-item')
    expect(backup.steps[4].route).toBe('/settings')
    expect(backup.steps[4].tapTargetId).toBe('more.settings-item')
    expect(backup.steps[4].targetId).toBe('settings.backup')
  })

  test('backup folds the More tab blink into the entry transition of the screen-local intro card', () => {
    const backup = scenariosById.backup
    const deck = buildTourDeck(backup.steps)

    expect(deck).toHaveLength(8)
    expect(deck.map(entry => entry.cardIndex)).toEqual([0, 2, 3, 4, 5, 6, 7, 8])
    expect(deck[1].entryStepIndexes).toEqual([1])
    expect(deck.filter(entry => entry.entryStepIndexes.length > 0)).toHaveLength(1)
  })

  test('backup scenario walks the section, folder, export, import and autosync', () => {
    const backup = scenariosById.backup

    expect(backup.steps[5].targetId).toBe('settings.backup-folder')
    expect(backup.steps[5].skipIfMissing).toBe(true)
    expect(backup.steps[6].targetId).toBe('settings.backup-export')
    expect(backup.steps[7].targetId).toBe('settings.backup-import')
    expect(backup.steps[8].targetId).toBe('settings.backup-autosync')
    expect(backup.steps[8].skipIfMissing).toBe(true)
  })

  test('offline caching-switch waits for the list to load before the spotlight lands', () => {
    const switchStep = scenariosById.offline.steps[1]

    expect(switchStep.targetId).toBe('offline.caching-switch')
    expect(switchStep.waitFor).toBe('offlineLoaded')
  })

  test('offline merges the intro with the entry card into four steps', () => {
    const offline = scenariosById.offline

    expect(offline.steps).toHaveLength(4)
    expect(offline.steps[0].route).toBe('/more')
    expect(offline.steps[0].tapTargetId).toBe(OFFLINE_ITEM_TARGET_ID)
    expect(offline.steps[0].targetId).toBe(OFFLINE_ITEM_TARGET_ID)
    expect(offline.steps[0].text).toBe(
      'Чтобы перейти на экран офлайна, тапните по пункту «Офлайн». Нажмите «Далее».',
    )
    expect(offline.steps[1].targetId).toBe('offline.caching-switch')
    expect(offline.steps[2].targetId).toBe('offline.rows')
    expect(offline.steps[3].targetId).toBe('offline.header-menu')
  })

  test('the tab tap lives in the intro and the item cards just open the section', () => {
    expect(scenariosById.history.steps[0].text).toBe(
      'Сейчас перейдём на экран «Ещё» — тапнем по нему — и откроем историю прослушивания. Нажмите «Далее».',
    )
    expect(scenariosById.history.steps[1].text).toBe('Открываем историю прослушивания.')
  })

  test('the tab-navigation intro cards name the tab tap and the destination', () => {
    expect(scenariosById.search.steps[0].text).toBe(
      'Сейчас перейдём на экран «Слушать» — тапнем по нему — и откроем поиск. Нажмите «Далее».',
    )
    expect(scenariosById.share.steps[0].text).toBe(
      'Сейчас перейдём на экран «Ещё» — тапнем по нему — и откроем страницу «Поделиться приложением». Нажмите «Далее».',
    )
    expect(scenariosById.share.steps[2].text).toBe(
      'Откроем страницу «Поделиться приложением»: тапнем по одноимённому пункту в этом списке. Нажмите «Далее».',
    )
  })

  test('every scenario starts with a card and action steps directly follow one', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    scenarios.forEach(scenario => {
      // No leading action step: the tour always starts on a card.
      expect(scenario.steps[0].tapActionId).toBeUndefined()

      // Every deck entry has a card, and the build never drops a leading action.
      const deck = buildTourDeck(scenario.steps)
      expect(deck.length).toBeGreaterThan(0)
      deck.forEach(entry => {
        expect(scenario.steps[entry.cardIndex].tapActionId).toBeUndefined()
      })
    })

    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  test('player-scope scenarios are scoped to the player and never route-bound', () => {
    const playerScenarioIds = [
      'player-intro',
      'player-description',
      'player-speed',
      'player-sound',
      'player-actions',
    ] as const

    playerScenarioIds.forEach(id => {
      const scenario = scenariosById[id]

      expect(scenario.scope).toBe('player')
      expect(scenario.screens).toBeUndefined()
    })
  })

  test('player-intro walks edges, controls, repeat, playlist and menu', () => {
    const intro = scenariosById['player-intro']

    expect(intro.steps).toHaveLength(5)
    expect(intro.steps[0].targetId).toBeUndefined()
    expect(intro.steps[1].targetId).toBe('player-fullscreen.controls')
    expect(intro.steps[2].targetId).toBe('player-fullscreen.repeat')
    expect(intro.steps[3].targetId).toBe('player-fullscreen.playlist')
    expect(intro.steps[4].targetId).toBe('player-fullscreen.menu')
  })

  test('player-intro makes the edge zones a highlighted area step', () => {
    const intro = scenariosById['player-intro']

    expect(intro.steps[0].targetId).toBeUndefined()
    expect(intro.steps[0].areaTargetIds).toEqual([
      'player-fullscreen.edge-back',
      'player-fullscreen.edge-forward',
    ])
  })

  test('menu-driven player scenarios open the player menu first', () => {
    const menuTargetId = 'player-fullscreen.menu'

    expect(scenariosById['player-description'].steps[1].targetId).toBe(menuTargetId)
    expect(scenariosById['player-speed'].steps[1].targetId).toBe(menuTargetId)
    expect(scenariosById['player-sound'].steps[1].targetId).toBe(menuTargetId)
  })

  test('player-description performs the menu and details actions itself', () => {
    const description = scenariosById['player-description']

    expect(description.steps).toHaveLength(4)
    expect(description.steps[0].title).toBe('Подробнее и таймкоды')
    expect(description.steps[1].tapTargetId).toBe('player-fullscreen.menu')
    expect(description.steps[1].tapActionId).toBe('open-player-menu')
    expect(description.steps[2].targetId).toBe('player-fullscreen.menu-details')
    expect(description.steps[2].tapTargetId).toBe('player-fullscreen.menu-details')
    expect(description.steps[2].tapActionId).toBe('show-player-details')
    expect(description.steps[3].targetId).toBe('player-fullscreen.details')
    expect(description.steps[3].tapActionId).toBeUndefined()
  })

  test('player-speed performs the menu and speed-menu actions itself', () => {
    const speed = scenariosById['player-speed']

    expect(speed.steps).toHaveLength(4)
    expect(speed.steps[0].title).toBe('Скорость прослушивания')
    expect(speed.steps[1].tapActionId).toBe('open-player-menu')
    expect(speed.steps[2].targetId).toBe('player-fullscreen.menu-speed')
    expect(speed.steps[2].tapTargetId).toBe('player-fullscreen.menu-speed')
    expect(speed.steps[2].tapActionId).toBe('open-player-speed-menu')
    expect(speed.steps[3].targetId).toBe('player-fullscreen.speed-menu')
    expect(speed.steps[3].tapActionId).toBeUndefined()
  })

  test('player-sound performs the menu and sound-settings actions itself', () => {
    const sound = scenariosById['player-sound']

    expect(sound.steps).toHaveLength(4)
    expect(sound.steps[0].title).toBe('Настройка звука')
    expect(sound.steps[1].tapActionId).toBe('open-player-menu')
    expect(sound.steps[2].targetId).toBe('player-fullscreen.menu-sound')
    expect(sound.steps[2].tapActionId).toBe('open-player-sound-settings')
    expect(sound.steps[3].targetId).toBe('player-fullscreen.sound-sheet')
    expect(sound.steps[3].tapActionId).toBeUndefined()
  })

  test('search scenario leads from «Ещё» into the search results', () => {
    const search = scenariosById.search

    expect(search.screens).toEqual(['/listen'])
    expect(search.globalFallback).toBe(true)
    expect(search.steps).toHaveLength(10)
    expect(search.steps[0].targetId).toBeUndefined()
    // The «Слушать» tab is an entry transition (blink + navigation), not a spotlight
    // card, and it navigates on its own — no separate pure-navigation return, which
    // would reach «Слушать» first and make the tab entry skip without ever blinking.
    expect(search.steps[1].route).toBe('/listen')
    expect(search.steps[1].tapTargetId).toBe('tab.listen')
    expect(search.steps[1].targetId).toBeUndefined()
    // The search button opens the overlay; the next exit types the demo query into it.
    expect(search.steps[2].title).toBe('Кнопка поиска')
    expect(search.steps[3].tapTargetId).toBe('listen.search-toggle')
    expect(search.steps[3].tapActionId).toBe('open-listen-search')
    // The typing card floats over the live UI (interactive, no target) and types the
    // query on enter; it is a card, not an exit, so it advances only on «Далее».
    expect(search.steps[4].title).toBe('Вводим запрос')
    expect(search.steps[4].text).toBe('Вводим запрос, например «лицемерие»…')
    expect(search.steps[4].interactive).toBe(true)
    expect(search.steps[4].actionOnEnterId).toBe('type-search-query')
    expect(search.steps[4].tapTargetId).toBeUndefined()
    expect(search.steps[4].targetId).toBeUndefined()
    expect(search.steps[4].tapActionId).toBeUndefined()
    expect(search.steps[5].targetId).toBe('search-results.group-sermons')
    expect(search.steps[6].title).toBe('Включить проповедь')
    expect(search.steps[7].tapTargetId).toBe('search-results.first-sermon')
    expect(search.steps[7].targetId).toBeUndefined()
    expect(search.steps[7].tapActionId).toBe('press-first-sermon')
    // The picker card spotlights above the SermonPlaylistPicker modal (presentOnTop)
    // and highlights the picker window itself (areaTargetIds); the sermon-menu card
    // closes the picker on enter and spotlights the row's ⋯ trigger.
    expect(search.steps[8].presentOnTop).toBe(true)
    expect(search.steps[8].cardPosition).toBe('bottom')
    expect(search.steps[8].areaTargetIds).toEqual(['search.picker-modal'])
    expect(search.steps[8].interactive).toBeUndefined()
    expect(search.steps[9].actionOnEnterId).toBe('close-sermon-playlist-picker')
    expect(search.steps[9].targetId).toBe('search-results.first-sermon-menu')
  })

  test('search folds its tab into the entry transitions of the results card', () => {
    const search = scenariosById.search
    const deck = buildTourDeck(search.steps)

    expect(deck).toHaveLength(7)
    expect(deck.map(entry => entry.cardIndex)).toEqual([0, 2, 4, 5, 6, 8, 9])
    // The tab entry leads into the «Кнопка поиска» card, which now owns only the
    // search-open exit: the typing step is its own interactive card (deck index 2),
    // not an exit. The «Включить проповедь» card owns the first-sermon exit.
    expect(deck[0].exitStepIndexes).toEqual([])
    expect(deck[1].entryStepIndexes).toEqual([1])
    expect(deck[1].exitStepIndexes).toEqual([3])
    expect(deck[4].exitStepIndexes).toEqual([7])
  })

  test('playlist-menu walks the header menu and ends on the interactive sermon menu', () => {
    const playlistMenu = scenariosById['playlist-menu']

    expect(playlistMenu.title).toBe('Экран плейлиста')
    expect(playlistMenu.screens).toEqual(['/listen/playlist'])
    expect(playlistMenu.steps).toHaveLength(11)
    expect(playlistMenu.steps[0].targetId).toBe('playlist.playback')
    expect(playlistMenu.steps[1].targetId).toBe('playlist.menu')
    expect(playlistMenu.steps[1].tapTargetId).toBe('playlist.menu')
    expect(playlistMenu.steps[1].tapActionId).toBe('open-playlist-menu')
    // Steps 2..9 are the header menu items; step 10 is the pass-through card
    // anchored to the first sermon row.
    expect(playlistMenu.steps.slice(2, 10).map(step => step.targetId)).toEqual([
      'playlist.menu-share',
      'playlist.menu-add-all',
      'playlist.menu-publish',
      'playlist.menu-offline-add',
      'playlist.menu-offline-remove',
      'playlist.menu-history-mark',
      'playlist.menu-clear',
      'playlist.menu-delete',
    ])
    const offlineRemoveIndex = playlistMenu.steps.findIndex(
      step => step.targetId === 'playlist.menu-offline-remove',
    )
    expect(playlistMenu.steps[offlineRemoveIndex].skipIfMissing).toBe(true)
    expect(playlistMenu.steps[offlineRemoveIndex - 1].targetId).toBe('playlist.menu-offline-add')
    // Every menu item may be absent (admin/local-only/feature-gated): the tour
    // drops its step instead of spotlighting a hidden row.
    expect(playlistMenu.steps.slice(2, 10).every(step => step.skipIfMissing === true)).toBe(true)
    expect(playlistMenu.steps[10].interactive).toBe(true)
    expect(playlistMenu.steps[10].targetId).toBe(FIRST_ROW_TARGET_ID)
    expect(playlistMenu.steps[10].areaTargetIds).toEqual([FIRST_ROW_TARGET_ID])
    expect(playlistMenu.steps[10].actionOnEnterId).toBe('close-playlist-menu')
  })

  test('favorites tour explains the row heart and where the playlist lives', () => {
    const favorites = scenariosById.favorites

    expect(favorites.title).toBe('Избранное')
    expect(favorites.screens).toEqual(['/listen/playlist'])
    expect(favorites.steps).toHaveLength(3)
    // The opening card describes the tour, so it carries no target.
    expect(favorites.steps[0].targetId).toBeUndefined()
    expect(favorites.steps[0].tapActionId).toBeUndefined()
    expect(favorites.steps[1].targetId).toBe('playlist.row-favorite')
    expect(favorites.steps[1].skipIfMissing).toBe(true)
    expect(favorites.steps[1].tapActionId).toBeUndefined()
    expect(favorites.steps[2].targetId).toBeUndefined()
  })

  test('player-actions spotlights the favorite and playlist buttons in the fullscreen player', () => {
    const actions = scenariosById['player-actions']

    expect(actions.scope).toBe('player')
    expect(actions.screens).toBeUndefined()
    expect(actions.steps).toHaveLength(3)
    // The opening card describes the tour, so it carries no target.
    expect(actions.steps[0].title).toBe('Избранное и плейлисты')
    expect(actions.steps[0].targetId).toBeUndefined()
    expect(actions.steps[0].tapActionId).toBeUndefined()
    expect(actions.steps[1].targetId).toBe('player-fullscreen.favorite')
    expect(actions.steps[1].tapActionId).toBeUndefined()
    expect(actions.steps[2].targetId).toBe('player-fullscreen.add-to-playlist')
    expect(actions.steps[2].tapActionId).toBeUndefined()
  })

  test('playlist-add walks the row menu and ends on the playlist picker', () => {
    const playlistAdd = scenariosById['playlist-add']

    expect(playlistAdd.title).toBe('Добавление в плейлист')
    expect(playlistAdd.screens).toEqual(['/listen/playlist'])
    expect(playlistAdd.steps).toHaveLength(7)
    expect(playlistAdd.steps[0].targetId).toBeUndefined()
    expect(playlistAdd.steps[0].tapActionId).toBeUndefined()
    expect(playlistAdd.steps[0].tapTargetId).toBeUndefined()
    expect(playlistAdd.steps[0].interactive).toBeUndefined()
    expect(playlistAdd.steps[1].targetId).toBe(FIRST_ROW_TARGET_ID)
    expect(playlistAdd.steps[1].tapActionId).toBe('open-playlist-row-menu')
    expect(playlistAdd.steps[1].tapTargetId).toBe(FIRST_ROW_TARGET_ID)
    expect(playlistAdd.steps[2].targetId).toBe(ROW_MENU_ADD_TARGET_ID)
    expect(playlistAdd.steps[3].targetId).toBe(ROW_MENU_ADD_TARGET_ID)
    expect(playlistAdd.steps[3].tapTargetId).toBe(ROW_MENU_ADD_TARGET_ID)
    expect(playlistAdd.steps[3].tapActionId).toBe('press-row-menu-add')
    expect(playlistAdd.steps[4].targetId).toBe('playlist.add-modal-favorites')
    expect(playlistAdd.steps[4].actionOnEnterId).toBe('check-add-modal-favorites')
    expect(playlistAdd.steps[4].interactive).toBeUndefined()
    expect(playlistAdd.steps[4].presentOnTop).toBe(true)
    // The create step and the save step both live inside the AddToPlaylist modal:
    // they are spotlight steps (not pass-through) that re-present the tour window
    // above the app modal.
    expect(playlistAdd.steps[5].targetId).toBe('playlist.add-modal-create')
    expect(playlistAdd.steps[5].interactive).toBeUndefined()
    expect(playlistAdd.steps[5].presentOnTop).toBe(true)
    expect(playlistAdd.steps[6].targetId).toBe('playlist.add-modal-save')
    expect(playlistAdd.steps[6].interactive).toBeUndefined()
    expect(playlistAdd.steps[6].presentOnTop).toBe(true)
  })

  test('playlist-offline walks the playlist cache menus and ends on the offline section', () => {
    const playlistOffline = scenariosById['playlist-offline']

    expect(playlistOffline.title).toBe('Прослушивание без интернета')
    expect(playlistOffline.screens).toEqual(['/listen/playlist'])
    expect(playlistOffline.steps).toHaveLength(9)
    expect(playlistOffline.steps[0].targetId).toBeUndefined()
    expect(playlistOffline.steps[0].tapActionId).toBeUndefined()
    expect(playlistOffline.steps[1].tapTargetId).toBe('playlist.menu')
    expect(playlistOffline.steps[1].tapActionId).toBe('open-playlist-menu')
    expect(playlistOffline.steps[2].targetId).toBe('playlist.menu-offline-add')
    expect(playlistOffline.steps[3].targetId).toBe('playlist.menu-offline-remove')
    // The row-menu exit closes the header menu opened at step 2, then blinks and
    // opens the row menu itself.
    expect(playlistOffline.steps[4].actionOnEnterId).toBe('close-playlist-menu')
    expect(playlistOffline.steps[4].tapTargetId).toBe(FIRST_ROW_TARGET_ID)
    expect(playlistOffline.steps[4].tapActionId).toBe('open-playlist-row-menu')
    // The row cache item is a toggle: the add card names the swap to «Удалить из
    // офлайна», and a separate removal card follows it.
    expect(playlistOffline.steps[5].targetId).toBe('playlist.row-menu-offline-add')
    expect(playlistOffline.steps[5].skipIfMissing).toBe(true)
    expect(playlistOffline.steps[5].text).toContain('Удалить из офлайна')
    expect(playlistOffline.steps[6].targetId).toBe('playlist.row-menu-offline-remove')
    expect(playlistOffline.steps[6].skipIfMissing).toBe(true)
    expect(playlistOffline.steps[6].title).toBe('Убрать из офлайна')
    // The tour stays on the playlist screen (its tab bar is visible) and only blinks
    // the «Ещё» tab before navigating: an entry transition, no /listen return.
    expect(playlistOffline.steps[7].route).toBe('/more')
    expect(playlistOffline.steps[7].tapTargetId).toBe('tab.more')
    expect(playlistOffline.steps[7].targetId).toBeUndefined()
    expect(playlistOffline.steps[8].targetId).toBe('more.offline-item')
  })

  test('playlist-offline folds its exits and entry into six cards', () => {
    const deck = buildTourDeck(scenariosById['playlist-offline'].steps)

    expect(deck).toHaveLength(6)
    expect(deck.map(entry => entry.cardIndex)).toEqual([0, 2, 3, 5, 6, 8])
    expect(deck[0].exitStepIndexes).toEqual([1])
    expect(deck[2].exitStepIndexes).toEqual([4])
    expect(deck[5].entryStepIndexes).toEqual([7])
  })

  test('playlist-share walks the header menu into the share modal and ends on «Готово»', () => {
    const playlistShare = scenariosById['playlist-share']

    expect(playlistShare.title).toBe('Поделиться плейлистом')
    expect(playlistShare.screens).toEqual(['/listen/playlist'])
    expect(playlistShare.steps).toHaveLength(8)
    expect(playlistShare.steps[0].targetId).toBeUndefined()
    expect(playlistShare.steps[0].tapTargetId).toBeUndefined()
    // The intro card's exit visualization opens the header menu itself.
    expect(playlistShare.steps[1].targetId).toBe('playlist.menu')
    expect(playlistShare.steps[1].tapTargetId).toBe('playlist.menu')
    expect(playlistShare.steps[1].tapActionId).toBe('open-playlist-menu')
    // The «Поделиться» row may be absent: the tour drops its card instead of
    // spotlighting a hidden item. Its exit visualization opens the share modal.
    expect(playlistShare.steps[2].targetId).toBe('playlist.menu-share')
    expect(playlistShare.steps[2].skipIfMissing).toBe(true)
    expect(playlistShare.steps[3].targetId).toBe('playlist.menu-share')
    expect(playlistShare.steps[3].tapTargetId).toBe('playlist.menu-share')
    expect(playlistShare.steps[3].tapActionId).toBe('open-playlist-share')
    // The three modal cards re-present the tour window above the app modal.
    expect(playlistShare.steps[4].targetId).toBe('playlist.share-modal-qr')
    expect(playlistShare.steps[4].presentOnTop).toBe(true)
    expect(playlistShare.steps[4].skipIfMissing).toBe(true)
    expect(playlistShare.steps[5].targetId).toBe('playlist.share-modal-copy')
    expect(playlistShare.steps[5].presentOnTop).toBe(true)
    expect(playlistShare.steps[5].skipIfMissing).toBe(true)
    expect(playlistShare.steps[6].targetId).toBe('playlist.share-modal-send')
    expect(playlistShare.steps[6].presentOnTop).toBe(true)
    expect(playlistShare.steps[6].skipIfMissing).toBe(true)
    // The final targetless card re-presents on top and closes the menu on enter.
    expect(playlistShare.steps[7].targetId).toBeUndefined()
    expect(playlistShare.steps[7].presentOnTop).toBe(true)
    expect(playlistShare.steps[7].actionOnEnterId).toBe('close-playlist-menu')
  })

  test('playlist-share folds its two exit visualizations into six cards', () => {
    const deck = buildTourDeck(scenariosById['playlist-share'].steps)

    expect(deck).toHaveLength(6)
    expect(deck.map(entry => entry.cardIndex)).toEqual([0, 2, 4, 5, 6, 7])
    expect(deck[0].exitStepIndexes).toEqual([1])
    expect(deck[1].exitStepIndexes).toEqual([3])
  })

  test('the playlist screen offers five local tours', () => {
    const localIds = scenarios
      .filter(scenario => scenario.screens?.includes('/listen/playlist') ?? false)
      .map(scenario => scenario.id)

    expect(localIds).toEqual([
      'playlist-menu',
      'playlist-add',
      'favorites',
      'playlist-offline',
      'playlist-share',
    ])
  })

  test('playlists scenario no longer claims the single-playlist screen', () => {
    expect(scenariosById.playlists.screens).toEqual([
      '/listen',
      '/listen/my-playlists',
      '/listen/playlist-list',
    ])
  })

  test('playlists scenario taps the section title to open the full list', () => {
    const playlists = scenariosById.playlists
    const deck = buildTourDeck(playlists.steps)

    expect(playlists.title).toBe('Мои плейлисты')
    expect(playlists.steps).toHaveLength(4)
    // The first card spotlights the section on /listen; the tap on its title is a
    // leading entry transition into the create card on the full-list screen.
    expect(playlists.steps[0].route).toBe('/listen')
    expect(playlists.steps[0].targetId).toBe('listen.my-playlists')
    expect(playlists.steps[0].title).toBe('Мои плейлисты')
    expect(playlists.steps[1].route).toBe('/listen/my-playlists')
    expect(playlists.steps[1].tapTargetId).toBe('listen.my-playlists-title')
    expect(playlists.steps[1].targetId).toBeUndefined()
    expect(playlists.steps[1].title).toBeUndefined()
    expect(deck).toHaveLength(3)
    expect(deck[1].cardIndex).toBe(2)
    expect(deck[1].entryStepIndexes).toEqual([1])
    expect(playlists.steps[2].targetId).toBe('playlists.create')

    const fromListen = resolveTourStart(playlists, deck, '/listen')
    expect(fromListen.deckIndex).toBe(0)
    expect(fromListen.skippedDeckIndexes).toEqual([])

    const fromMyPlaylists = resolveTourStart(playlists, deck, '/listen/my-playlists')
    expect(fromMyPlaylists.deckIndex).toBe(1)
    expect(fromMyPlaylists.skippedDeckIndexes).toEqual([0])
  })
})

describe('resolveStepRoute', () => {
  test('returns the step route when the step declares one', () => {
    expect(resolveStepRoute(scenariosById.settings, 2)).toBe('/settings')
  })

  test('inherits the nearest previous route for a routeless step', () => {
    // playlists step 3 («Добавить проповедь») has no route of its own.
    expect(resolveStepRoute(scenariosById.playlists, 3)).toBe('/listen/my-playlists')
  })

  test('returns undefined when no preceding step declares a route', () => {
    expect(
      resolveStepRoute({ ...scenariosById.whatsNew, steps: [{ text: '', title: '' }] }, 0),
    ).toBe(undefined)
  })
})

describe('share scenario resume', () => {
  const deck = buildTourDeck(scenariosById.share.steps)

  test('plays the full lead-up from a foreign screen', () => {
    expect(resolveTourStart(scenariosById.share, deck, '/listen')).toEqual({
      deckIndex: 0,
      skippedDeckIndexes: [],
    })
  })

  test('skips the foreign intro and the tab entry and starts on the screen-local intro from «Ещё»', () => {
    expect(resolveTourStart(scenariosById.share, deck, '/more')).toEqual({
      deckIndex: 1,
      skippedDeckIndexes: [0],
    })
  })

  test('skips the lead-up and starts on the QR card from «Поделиться приложением»', () => {
    expect(resolveTourStart(scenariosById.share, deck, '/share')).toEqual({
      deckIndex: 2,
      skippedDeckIndexes: [0, 1],
    })
  })

  test('counts only the remaining cards from the QR card', () => {
    const fromShare = resolveDeckProgress(deck, [0, 1], 2)

    expect(fromShare.displayIndex).toBe(0)
    expect(fromShare.displayTotal).toBe(3)
  })
})

describe('search scenario resume', () => {
  const deck = buildTourDeck(scenariosById.search.steps)

  test('skips the intro and the tab entry and starts on the search button from «Слушать»', () => {
    expect(resolveTourStart(scenariosById.search, deck, '/listen')).toEqual({
      deckIndex: 1,
      skippedDeckIndexes: [0],
    })
  })

  test('plays the full lead-up from «Ещё», where no card routes yet', () => {
    expect(resolveTourStart(scenariosById.search, deck, '/more')).toEqual({
      deckIndex: 0,
      skippedDeckIndexes: [],
    })
  })

  test('counts only the remaining cards from the search button', () => {
    const fromListen = resolveDeckProgress(deck, [0], 1)

    expect(fromListen.displayIndex).toBe(0)
    expect(fromListen.displayTotal).toBe(6)
  })

  test('counts every card when the lead-up is not skipped', () => {
    const progress = resolveDeckProgress(deck, [], 0)

    expect(progress.displayIndex).toBe(0)
    expect(progress.displayTotal).toBe(7)
  })
})

describe('backup scenario resume', () => {
  const deck = buildTourDeck(scenariosById.backup.steps)

  test('plays the full tour from «Слушать», where no card routes', () => {
    expect(resolveTourStart(scenariosById.backup, deck, '/listen')).toEqual({
      deckIndex: 0,
      skippedDeckIndexes: [],
    })
  })

  test('plays the full tour with the intro from a foreign «История» screen', () => {
    expect(resolveTourStart(scenariosById.backup, deck, '/history')).toEqual({
      deckIndex: 0,
      skippedDeckIndexes: [],
    })
  })

  test('skips the foreign intro and opens the «Ещё»-screen intro card from «Ещё»', () => {
    expect(resolveTourStart(scenariosById.backup, deck, '/more')).toEqual({
      deckIndex: 1,
      skippedDeckIndexes: [0],
    })
    expect(deck[1].cardIndex).toBe(2)
  })

  test('resumes on the backup section from «Настройки»', () => {
    expect(resolveTourStart(scenariosById.backup, deck, '/settings')).toEqual({
      deckIndex: 3,
      skippedDeckIndexes: [0, 1, 2],
    })
  })

  test('counts all eight cards from the intro', () => {
    const progress = resolveDeckProgress(deck, [], 0)

    expect(progress.displayIndex).toBe(0)
    expect(progress.displayTotal).toBe(8)
  })
})

import { type Ionicons } from '@expo/vector-icons'
import { type Href } from 'expo-router'
import { backupScenario } from './scenarioData/backup'
import { favoritesScenario } from './scenarioData/favorites'
import { historyScenario } from './scenarioData/history'
import { listenScenario } from './scenarioData/listen'
import { offlineScenario } from './scenarioData/offline'
import { playerScenario } from './scenarioData/player'
import { playerActionsScenario } from './scenarioData/player-actions'
import { playerDescriptionScenario } from './scenarioData/player-description'
import { playerIntroScenario } from './scenarioData/player-intro'
import { playerSoundScenario } from './scenarioData/player-sound'
import { playerSpeedScenario } from './scenarioData/player-speed'
import { playlistAddScenario } from './scenarioData/playlist-add'
import { playlistMenuScenario } from './scenarioData/playlist-menu'
import { playlistOfflineScenario } from './scenarioData/playlist-offline'
import { playlistShareScenario } from './scenarioData/playlist-share'
import { playlistsScenario } from './scenarioData/playlists'
import { readScenario } from './scenarioData/read'
import { searchScenario } from './scenarioData/search'
import { settingsScenario } from './scenarioData/settings'
import { shareScenario } from './scenarioData/share'
import { welcomeScenario } from './scenarioData/welcome'
import { whatsNewScenario } from './scenarioData/whatsNew'
import { type OnboardingScenarioId } from './scenarioId'

export interface OnboardingScenario {
  description: string
  featureFlag?: 'read'
  // A screen-bound scenario still offered in the «Глобальные» group on the screens it
  // does not name (its lead-up starts on one of its own screens). Without it, a
  // scenario with `screens` is hidden on every foreign screen.
  globalFallback?: boolean
  icon: keyof typeof Ionicons.glyphMap
  id: OnboardingScenarioId
  scope?: ScenarioScope
  // Exact routes the scenario belongs to; `undefined` = global (offered everywhere).
  screens?: Href[]
  sinceVersion?: string
  steps: OnboardingStep[]
  title: string
}

// Which picker offers the scenario: `default` = screen pickers, `player` = fullscreen only.
export type ScenarioScope = 'default' | 'player'

export const resolveScenarioScope = (scenario: OnboardingScenario): ScenarioScope =>
  scenario.scope ?? 'default'

export interface OnboardingStep {
  // Registered action performed once on activation, no blink/auto-advance (lib/tourActions.ts).
  actionOnEnterId?: string
  // Highlighted target rects (background dimmed, zones stay bright) — see ui/TourWaitLayer.tsx.
  areaTargetIds?: string[]
  // Bottom-anchored card for a `presentOnTop` step: the card sits at the screen bottom
  // instead of next to the target, so it covers no more than the lower half of the
  // app modal it spotlights (the highlighted rows stay visible above it).
  cardPosition?: 'bottom'
  // Pass-through card over the live UI, no spotlight modal.
  interactive?: boolean
  // Re-present the tour window (fresh native Modal keyed by step) above app modals.
  presentOnTop?: boolean
  route?: Href
  // Target may be absent (admin/local/flag row): skip the step when its rect never registers.
  skipIfMissing?: boolean
  // Registered action the tour performs itself, then auto-advances (lib/tourActions.ts).
  tapActionId?: string
  tapTargetId?: string
  targetId?: string
  // Card content. Entry transitions navigate without rendering a card, so they carry neither.
  text?: string
  title?: string
  waitFor?: 'offlineLoaded' | 'paused' | 'sermonSelected'
}

export const scenarios: OnboardingScenario[] = [
  listenScenario,
  playerScenario,
  playerIntroScenario,
  playerDescriptionScenario,
  playerSpeedScenario,
  playerSoundScenario,
  playerActionsScenario,
  playlistsScenario,
  searchScenario,
  playlistMenuScenario,
  playlistAddScenario,
  favoritesScenario,
  playlistOfflineScenario,
  playlistShareScenario,
  historyScenario,
  offlineScenario,
  settingsScenario,
  backupScenario,
  readScenario,
  shareScenario,
  welcomeScenario,
  whatsNewScenario,
]

export const scenariosById: Record<OnboardingScenarioId, OnboardingScenario> = {
  backup: backupScenario,
  favorites: favoritesScenario,
  history: historyScenario,
  listen: listenScenario,
  offline: offlineScenario,
  player: playerScenario,
  'player-actions': playerActionsScenario,
  'player-description': playerDescriptionScenario,
  'player-intro': playerIntroScenario,
  'player-sound': playerSoundScenario,
  'player-speed': playerSpeedScenario,
  'playlist-add': playlistAddScenario,
  'playlist-menu': playlistMenuScenario,
  'playlist-offline': playlistOfflineScenario,
  'playlist-share': playlistShareScenario,
  playlists: playlistsScenario,
  read: readScenario,
  search: searchScenario,
  settings: settingsScenario,
  share: shareScenario,
  welcome: welcomeScenario,
  whatsNew: whatsNewScenario,
}

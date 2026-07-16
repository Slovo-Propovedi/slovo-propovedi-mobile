import { createCtx, type Ctx } from '@reatom/framework'
import type { currentThemeAtom as CurrentThemeAtom } from './model'
import { DarkTheme, LightTheme } from './constants'

const TRACK_MAX_INIT = 'rgba(128, 128, 128, 0.4)'
const TRACK_MAX_UPDATE = 'rgba(128, 128, 128, 0.6)'
const TRACK_MIN_INIT = 'rgba(128, 128, 128, 0.6)'
const TRACK_MIN_UPDATE = 'rgba(128, 128, 128, 0.4)'

// Mutable slots that are NOT in STATIC_COLORS — these start undefined
const UNINITIALIZED_SLOTS = [
  'backdrop',
  'background',
  'card',
  'icon',
  'maximumTrackTintColor',
  'minimumTrackTintColor',
  'surface',
  'text',
  'textMuted',
] as const

const STATIC_ENTRIES: Record<string, string> = {
  black: '#000',
  black70: '#000000b3',
  blue: 'blue',
  disabled: '#d3d3d3',
  error: '#ff3b30',
  gray: '#808080',
  onPrimary: '#fff',
  primary: '#f16031',
  skeleton: '#333333',
  tabBarActive: '#f16031',
  tabBarBackground: 'rgba(0, 0, 0, 0.8)',
  tabBarInactive: '#9ca3af',
  white: '#fff',
}

describe('colors', () => {
  let ctx: Ctx
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- COLORS is a dynamic record used for testing
  let COLORS: Record<string, any>
  let currentThemeAtomLocal: typeof CurrentThemeAtom
  let initializeCOLORS: (ctx: Ctx) => void
  let updateCOLORS: (ctx: Ctx) => void

  beforeEach(() => {
    ctx = createCtx()

    // Must isolateModules so colors.ts gets a fresh COLORS singleton,
    // and import currentThemeAtomLocal from the same isolated module tree
    jest.isolateModules(async () => {
      const model = await import('./model')
      const colors = await import('./colors')
      COLORS = colors.COLORS
      currentThemeAtomLocal = model.currentThemeAtom
      initializeCOLORS = colors.initializeCOLORS
      updateCOLORS = colors.updateCOLORS
    })
  })

  describe('COLORS initial state', () => {
    test('contains all static color values', () => {
      Object.entries(STATIC_ENTRIES).forEach(([key, value]) => {
        expect(COLORS[key]).toBe(value)
      })
    })

    test('mutable-only slots are undefined before initialization', () => {
      UNINITIALIZED_SLOTS.forEach(slot => {
        expect(COLORS[slot]).toBeUndefined()
      })
    })
  })

  describe('initializeCOLORS', () => {
    test('sets theme properties from currentThemeAtomLocal', () => {
      currentThemeAtomLocal(ctx, LightTheme)
      initializeCOLORS(ctx)

      expect(COLORS.background).toBe(LightTheme.background)
      expect(COLORS.card).toBe(LightTheme.card)
      expect(COLORS.surface).toBe(LightTheme.surface)
      expect(COLORS.text).toBe(LightTheme.text)
      expect(COLORS.textMuted).toBe(LightTheme.textMuted)
      expect(COLORS.skeleton).toBe(LightTheme.skeleton)
      expect(COLORS.primary).toBe(LightTheme.primary)
      expect(COLORS.backdrop).toBe(LightTheme.backdrop)
    })

    test('sets icon to theme.text value (not theme.icon)', () => {
      currentThemeAtomLocal(ctx, DarkTheme)
      initializeCOLORS(ctx)

      expect(COLORS.icon).toBe(DarkTheme.text)
    })

    test('sets maximumTrackTintColor to 0.4 opacity', () => {
      currentThemeAtomLocal(ctx, DarkTheme)
      initializeCOLORS(ctx)

      expect(COLORS.maximumTrackTintColor).toBe(TRACK_MAX_INIT)
    })

    test('sets minimumTrackTintColor to 0.6 opacity', () => {
      currentThemeAtomLocal(ctx, DarkTheme)
      initializeCOLORS(ctx)

      expect(COLORS.minimumTrackTintColor).toBe(TRACK_MIN_INIT)
    })

    test('does NOT set tabBarActive from theme — stays static', () => {
      currentThemeAtomLocal(ctx, DarkTheme)
      initializeCOLORS(ctx)

      expect(COLORS.tabBarActive).toBe('#f16031')
    })

    test('preserves static color values after initialization', () => {
      currentThemeAtomLocal(ctx, DarkTheme)
      initializeCOLORS(ctx)

      expect(COLORS.black).toBe('#000')
      expect(COLORS.white).toBe('#fff')
      expect(COLORS.error).toBe('#ff3b30')
      expect(COLORS.tabBarBackground).toBe('rgba(0, 0, 0, 0.8)')
    })
  })

  describe('updateCOLORS', () => {
    test('sets theme properties from currentThemeAtomLocal', () => {
      currentThemeAtomLocal(ctx, DarkTheme)
      updateCOLORS(ctx)

      expect(COLORS.background).toBe(DarkTheme.background)
      expect(COLORS.card).toBe(DarkTheme.card)
      expect(COLORS.surface).toBe(DarkTheme.surface)
      expect(COLORS.text).toBe(DarkTheme.text)
      expect(COLORS.textMuted).toBe(DarkTheme.textMuted)
      expect(COLORS.skeleton).toBe(DarkTheme.skeleton)
      expect(COLORS.primary).toBe(DarkTheme.primary)
      expect(COLORS.backdrop).toBe(DarkTheme.backdrop)
    })

    test('sets icon to theme.text', () => {
      currentThemeAtomLocal(ctx, DarkTheme)
      updateCOLORS(ctx)

      expect(COLORS.icon).toBe(DarkTheme.text)
    })

    test('sets maximumTrackTintColor to 0.6 opacity (swapped vs initialize)', () => {
      currentThemeAtomLocal(ctx, DarkTheme)
      updateCOLORS(ctx)

      expect(COLORS.maximumTrackTintColor).toBe(TRACK_MAX_UPDATE)
    })

    test('sets minimumTrackTintColor to 0.4 opacity (swapped vs initialize)', () => {
      currentThemeAtomLocal(ctx, DarkTheme)
      updateCOLORS(ctx)

      expect(COLORS.minimumTrackTintColor).toBe(TRACK_MIN_UPDATE)
    })

    test('sets tabBarActive to theme.primary', () => {
      currentThemeAtomLocal(ctx, DarkTheme)
      updateCOLORS(ctx)

      expect(COLORS.tabBarActive).toBe(DarkTheme.primary)
    })
  })

  describe('difference between initialize and update', () => {
    test('update sets tabBarActive to theme.primary; initialize does not', () => {
      currentThemeAtomLocal(ctx, DarkTheme)
      initializeCOLORS(ctx)

      expect(COLORS.tabBarActive).toBe('#f16031')

      updateCOLORS(ctx)

      expect(COLORS.tabBarActive).toBe(DarkTheme.primary)
    })

    test('update swaps track tint values vs initialize', () => {
      currentThemeAtomLocal(ctx, DarkTheme)
      initializeCOLORS(ctx)

      const maxAfterInit = COLORS.maximumTrackTintColor
      const minAfterInit = COLORS.minimumTrackTintColor

      updateCOLORS(ctx)

      expect(COLORS.maximumTrackTintColor).not.toBe(maxAfterInit)
      expect(COLORS.minimumTrackTintColor).not.toBe(minAfterInit)
      expect(COLORS.maximumTrackTintColor).toBe(TRACK_MAX_UPDATE)
      expect(COLORS.minimumTrackTintColor).toBe(TRACK_MIN_UPDATE)
    })
  })
})

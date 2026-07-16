import { createCtx, type Ctx } from '@reatom/framework'
import { COLORS, initializeCOLORS, updateCOLORS } from './colors'
import { DarkTheme, LightTheme } from './constants'
import { currentThemeAtom } from './model'

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

const STATIC_KEYS = new Set(Object.keys(STATIC_ENTRIES))

/**
 * Reset COLORS to its initial module-level state:
 * static keys restored to defaults, mutable keys deleted.
 */
const resetCOLORS = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- COLORS is a dynamic record used for testing
  const ref = COLORS as Record<string, any>
  for (const key of Object.keys(ref))
    if (STATIC_KEYS.has(key)) ref[key] = STATIC_ENTRIES[key]
    else delete ref[key]
}

describe('colors', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
    resetCOLORS()
  })

  describe('COLORS initial state', () => {
    test('contains all static color values', () => {
      Object.entries(STATIC_ENTRIES).forEach(([key, value]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic key access on COLORS record
        expect((COLORS as Record<string, any>)[key]).toBe(value)
      })
    })

    test('mutable-only slots are undefined before initialization', () => {
      UNINITIALIZED_SLOTS.forEach(slot => {
        expect(COLORS[slot]).toBeUndefined()
      })
    })
  })

  describe('initializeCOLORS', () => {
    test('sets theme properties from currentThemeAtom', () => {
      currentThemeAtom(ctx, LightTheme)
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
      currentThemeAtom(ctx, DarkTheme)
      initializeCOLORS(ctx)

      expect(COLORS.icon).toBe(DarkTheme.text)
    })

    test('sets maximumTrackTintColor to 0.4 opacity', () => {
      currentThemeAtom(ctx, DarkTheme)
      initializeCOLORS(ctx)

      expect(COLORS.maximumTrackTintColor).toBe(TRACK_MAX_INIT)
    })

    test('sets minimumTrackTintColor to 0.6 opacity', () => {
      currentThemeAtom(ctx, DarkTheme)
      initializeCOLORS(ctx)

      expect(COLORS.minimumTrackTintColor).toBe(TRACK_MIN_INIT)
    })

    test('does NOT set tabBarActive from theme — stays static', () => {
      currentThemeAtom(ctx, DarkTheme)
      initializeCOLORS(ctx)

      expect(COLORS.tabBarActive).toBe('#f16031')
    })

    test('preserves static color values after initialization', () => {
      currentThemeAtom(ctx, DarkTheme)
      initializeCOLORS(ctx)

      expect(COLORS.black).toBe('#000')
      expect(COLORS.white).toBe('#fff')
      expect(COLORS.error).toBe('#ff3b30')
      expect(COLORS.tabBarBackground).toBe('rgba(0, 0, 0, 0.8)')
    })
  })

  describe('updateCOLORS', () => {
    test('sets theme properties from currentThemeAtom', () => {
      currentThemeAtom(ctx, DarkTheme)
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
      currentThemeAtom(ctx, DarkTheme)
      updateCOLORS(ctx)

      expect(COLORS.icon).toBe(DarkTheme.text)
    })

    test('sets maximumTrackTintColor to 0.6 opacity (swapped vs initialize)', () => {
      currentThemeAtom(ctx, DarkTheme)
      updateCOLORS(ctx)

      expect(COLORS.maximumTrackTintColor).toBe(TRACK_MAX_UPDATE)
    })

    test('sets minimumTrackTintColor to 0.4 opacity (swapped vs initialize)', () => {
      currentThemeAtom(ctx, DarkTheme)
      updateCOLORS(ctx)

      expect(COLORS.minimumTrackTintColor).toBe(TRACK_MIN_UPDATE)
    })

    test('sets tabBarActive to theme.primary', () => {
      currentThemeAtom(ctx, DarkTheme)
      updateCOLORS(ctx)

      expect(COLORS.tabBarActive).toBe(DarkTheme.primary)
    })
  })

  describe('difference between initialize and update', () => {
    test('update sets tabBarActive to theme.primary; initialize does not', () => {
      currentThemeAtom(ctx, DarkTheme)
      initializeCOLORS(ctx)

      expect(COLORS.tabBarActive).toBe('#f16031')

      updateCOLORS(ctx)

      expect(COLORS.tabBarActive).toBe(DarkTheme.primary)
    })

    test('update swaps track tint values vs initialize', () => {
      currentThemeAtom(ctx, DarkTheme)
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

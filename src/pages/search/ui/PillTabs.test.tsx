import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { GLASS } from 'shared/ui'
import {
  COLORS,
  DarkTheme,
  FONT_SIZES,
  INDENTS,
  LightTheme,
  RADIUSES,
  useTheme,
  withAlpha,
} from 'shared/ui/theme'
import { PillTabs } from './PillTabs'

jest.mock('shared/ui/theme', () => {
  const actual = jest.requireActual('shared/ui/theme')

  return { ...actual, useTheme: jest.fn() }
})

const mockUseTheme = jest.mocked(useTheme)
const DARK_CONTEXT = { currentTheme: DarkTheme, isLight: false, themeMode: 'dark' } as const
const LIGHT_CONTEXT = { currentTheme: LightTheme, isLight: true, themeMode: 'light' } as const

const ITEMS = [
  { key: 'sermons', label: 'Проповеди' },
  { key: 'playlists', label: 'Плейлисты' },
  { key: 'preachers', label: 'Проповедники' },
]

const SCOPE_ITEMS = [
  { key: 'listen', label: 'Слушать' },
  { disabled: true, key: 'read', label: 'Читать' },
]

const TRACK_ID = 'pill-tabs-track'
const SCROLL_ID = 'pill-tabs-scroll'
const STRETCH_ROW_ID = 'pill-tabs-stretch-row'
const SHADOW_BODY_ID = 'pill-tabs-shadow-body'
const SHADOW_BLUR_ID = 'pill-tabs-shadow-blur'
const TRACK_HEIGHT = 48
const SEGMENT_HEIGHT = 42
// Shadow body: the pill's shape shifted down so it peeks out under the track.
const SHADOW_OFFSET_Y = 18
// The backdrop blur frame is larger than the body on every side, which is what
// feathers the body's edges.
const SHADOW_FEATHER = 20
const SHADOW_FILL = 'rgba(0, 0, 0, 0.09)'
// The row itself only keeps a small shape-breathing gap under the pill.
const SMALL_GAP = INDENTS.low
// Theme-aware selection: subtle gray on the white track, clearly lighter on the
// pure-black one. The theme is mocked so both branches are deterministic.
const SELECTED_FILL = () => withAlpha(DarkTheme.text, 0.18)

const trackStyle = () => StyleSheet.flatten(screen.getByTestId(TRACK_ID).props.style)

const segmentStyle = (label: string) =>
  StyleSheet.flatten(screen.getByRole('button', { name: label }).props.style)

describe('<PillTabs>', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue(DARK_CONTEXT)
  })

  test('renders every pill label', async () => {
    await renderWithProviders(<PillTabs items={ITEMS} value='sermons' onChange={jest.fn()} />)

    for (const item of ITEMS) expect(screen.getByText(item.label)).toBeTruthy()

    expect(screen.getByText(ITEMS[0].label)).toHaveStyle({ fontSize: FONT_SIZES.base })
  })

  test('renders the segments inside one raised, pill-shaped track', async () => {
    await renderWithProviders(<PillTabs items={ITEMS} value='sermons' onChange={jest.fn()} />)

    expect(screen.getByTestId(TRACK_ID)).toHaveStyle({
      borderRadius: RADIUSES.round,
      flexDirection: 'row',
      height: TRACK_HEIGHT,
    })
    // Pure themed surface, not the off-white/dark-gray card token.
    const fill = trackStyle().backgroundColor
    expect(fill).not.toBe(DarkTheme.card)
    expect(fill).toBe(COLORS.black)
    // Android draws boxShadow as a background drawable clipped to the view, so
    // an outset shadow degrades into an inner rim — the halo layer replaces it.
    expect(trackStyle().boxShadow).toBeUndefined()
    expect(trackStyle().elevation).toBeUndefined()
  })

  test('casts the scope shadow as a pill-shaped body feathered by a backdrop blur', async () => {
    await renderWithProviders(<PillTabs items={ITEMS} value='sermons' onChange={jest.fn()} />)

    const body = screen.getByTestId(SHADOW_BODY_ID)
    const bodyStyle = StyleSheet.flatten(body.props.style)

    expect(body).toHaveStyle({
      backgroundColor: SHADOW_FILL,
      borderRadius: RADIUSES.round,
      height: TRACK_HEIGHT,
      pointerEvents: 'none',
      position: 'absolute',
    })
    // Same shape as the pill, shifted down so it peeks out under the track.
    expect(bodyStyle.left).toBe(0)
    expect(bodyStyle.right).toBe(0)
    expect(bodyStyle.top).toBe(SHADOW_OFFSET_Y)
    expect(Number(bodyStyle.top)).toBeGreaterThan(0)
    expect(Number(bodyStyle.top)).toBeLessThan(TRACK_HEIGHT)
    // RN 0.88 filter blur (RenderEffect on Android 12+) feathers the body's
    // edges in every direction, which BlurView alone cannot do without a target.
    expect(bodyStyle.filter).toEqual([{ blur: 10 }])

    const blur = screen.getByTestId(SHADOW_BLUR_ID)
    const blurStyle = StyleSheet.flatten(blur.props.style)

    expect(blur.props.intensity).toBe(GLASS.blur.intensity)
    // A decorative feather layer has no blur target to capture, so it must ask
    // for `none` explicitly: a dimezis method without `blurTarget` makes
    // expo-blur warn and fall back anyway.
    expect(blur.props.blurMethod).toBe('none')
    expect(blur.props.blurTarget).toBeUndefined()
    expect(['dark', 'light']).toContain(blur.props.tint)
    expect(blur).toHaveStyle({ pointerEvents: 'none' })
    // Larger frame than the body on every side — this is what feathers it.
    expect(blurStyle.left).toBe(-SHADOW_FEATHER)
    expect(blurStyle.right).toBe(-SHADOW_FEATHER)
    expect(blurStyle.top).toBe(SHADOW_OFFSET_Y - SHADOW_FEATHER)
    expect(blurStyle.bottom).toBe(-(SHADOW_OFFSET_Y + SHADOW_FEATHER))
  })

  test('marks only the active pill as selected (radio semantics)', async () => {
    await renderWithProviders(<PillTabs items={ITEMS} value='playlists' onChange={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Плейлисты' })).toBeSelected()
    expect(screen.getByRole('button', { name: 'Проповеди' })).not.toBeSelected()
    expect(screen.getByRole('button', { name: 'Проповедники' })).not.toBeSelected()
  })

  test('uses a subtle gray selection on a light track', async () => {
    mockUseTheme.mockReturnValue(LIGHT_CONTEXT)
    await renderWithProviders(<PillTabs items={ITEMS} value='playlists' onChange={jest.fn()} />)

    expect(trackStyle().backgroundColor).toBe(COLORS.white)
    expect(segmentStyle('Плейлисты').backgroundColor).toBe(withAlpha(LightTheme.text, 0.1))
  })

  test('strengthens the scope selection fill on a dark track', async () => {
    mockUseTheme.mockReturnValue(DARK_CONTEXT)
    await renderWithProviders(<PillTabs items={ITEMS} value='playlists' onChange={jest.fn()} />)

    expect(trackStyle().backgroundColor).toBe(COLORS.black)
    expect(segmentStyle('Плейлисты').backgroundColor).toBe(SELECTED_FILL())
  })

  test('highlights the selected segment with a flat gray pill', async () => {
    await renderWithProviders(<PillTabs items={ITEMS} value='playlists' onChange={jest.fn()} />)

    const selected = segmentStyle('Плейлисты')

    expect(selected.backgroundColor).toBe(SELECTED_FILL())
    expect(selected.borderRadius).toBe(RADIUSES.round)
    expect(selected.boxShadow).toBeUndefined()
    expect(selected.elevation).toBeUndefined()
    expect(screen.getByText('Плейлисты')).toHaveStyle({ fontWeight: '600' })
  })

  test('leaves unselected segments visually bare', async () => {
    await renderWithProviders(<PillTabs items={ITEMS} value='sermons' onChange={jest.fn()} />)

    const unselected = segmentStyle('Плейлисты')

    expect(unselected.backgroundColor).toBe('transparent')
    expect(unselected.borderWidth).toBeUndefined()
    expect(unselected.boxShadow).toBeUndefined()
    expect(unselected.elevation).toBeUndefined()
  })

  test('keeps only a small gap in the scroll row so the halo can overflow it', async () => {
    await renderWithProviders(<PillTabs items={ITEMS} value='sermons' onChange={jest.fn()} />)

    const scroll = screen.getByTestId(SCROLL_ID)
    const content = StyleSheet.flatten(scroll.props.contentContainerStyle)
    const viewport = StyleSheet.flatten(scroll.props.style)

    expect(content.paddingBottom).toBe(SMALL_GAP)
    expect(content.overflow).not.toBe('hidden')
    // Negative margins would shift content under the halo.
    expect(viewport.marginBottom).toBeUndefined()
    expect(viewport.marginHorizontal).toBeUndefined()
    expect(viewport.overflow).not.toBe('hidden')
  })

  test('keeps only a small gap below the full-width track so the halo can overflow it', async () => {
    await renderWithProviders(
      <PillTabs stretch value='listen' items={SCOPE_ITEMS} onChange={jest.fn()} />,
    )

    const row = StyleSheet.flatten(screen.getByTestId(STRETCH_ROW_ID).props.style)

    expect(row.paddingBottom).toBe(SMALL_GAP)
    expect(row.marginBottom).toBeUndefined()
    expect(row.marginHorizontal).toBeUndefined()
    expect(row.overflow).not.toBe('hidden')
    expect(trackStyle().overflow).not.toBe('hidden')
  })

  test('results variant is a trackless row of standalone items', async () => {
    await renderWithProviders(
      <PillTabs items={ITEMS} variant='results' value='playlists' onChange={jest.fn()} />,
    )

    expect(screen.queryByTestId(TRACK_ID)).toBeNull()
    expect(screen.queryByTestId(SHADOW_BODY_ID)).toBeNull()
    expect(screen.queryByTestId(SHADOW_BLUR_ID)).toBeNull()

    const row = StyleSheet.flatten(screen.getByTestId(SCROLL_ID).props.contentContainerStyle)
    expect(row.backgroundColor).toBeUndefined()
    expect(row.borderRadius).toBeUndefined()
    // No shadow means no reserved shadow room either.
    expect(row.paddingBottom).toBeUndefined()

    expect(segmentStyle('Плейлисты')).toMatchObject({
      backgroundColor: DarkTheme.primary,
      borderRadius: RADIUSES.round,
    })
    expect(screen.getByText('Плейлисты')).toHaveStyle({
      color: DarkTheme.onPrimary,
      fontWeight: '400',
    })

    // Unselected items are plain but bold labels: no fill, no border, no shadow.
    const unselected = segmentStyle('Проповеди')
    expect(unselected.backgroundColor).toBeUndefined()
    expect(unselected.borderWidth).toBeUndefined()
    expect(unselected.boxShadow).toBeUndefined()
    expect(unselected.elevation).toBeUndefined()
    expect(unselected.margin).toBeUndefined()
    expect(screen.getByText('Проповеди')).toHaveStyle({ fontWeight: '700' })

    // Results labels are a step larger than the scope track labels.
    expect(screen.getByText('Проповеди')).toHaveStyle({ fontSize: FONT_SIZES.md })
  })

  test('results pills are their own tap target (button bounds = pill bounds)', async () => {
    await renderWithProviders(
      <PillTabs items={ITEMS} variant='results' value='playlists' onChange={jest.fn()} />,
    )

    // The PressableButton carries the pill's own box (height + horizontal
    // padding) — there is no inner wrapper shrinking the hit area, so taps on
    // the pill's padding register too.
    const selected = segmentStyle('Плейлисты')
    expect(selected).toMatchObject({ height: 36, paddingHorizontal: INDENTS.medium })
    expect(selected.margin).toBeUndefined()
    expect(selected.width).toBeUndefined()
    expect(selected.flex).toBeUndefined()

    const unselected = segmentStyle('Проповеди')
    expect(unselected).toMatchObject({ height: 36, paddingHorizontal: INDENTS.low })
    expect(unselected.margin).toBeUndefined()
    expect(unselected.width).toBeUndefined()
    expect(unselected.flex).toBeUndefined()
  })

  test('makes the whole highlighted half of the track the tap target', async () => {
    await renderWithProviders(
      <PillTabs stretch value='listen' items={SCOPE_ITEMS} onChange={jest.fn()} />,
    )

    for (const label of ['Слушать', 'Читать']) {
      const segment = segmentStyle(label)

      // The button IS the highlight: the Pressable node itself carries a
      // definite numeric height (track inner height) and fills half the track
      // width with flex, so empty parts of the cell respond to taps.
      expect(segment.flex).toBe(1)
      expect(segment.height).toBe(SEGMENT_HEIGHT)
      expect(segment.alignSelf).toBeUndefined()
      expect(segment.margin).toBeUndefined()
    }
  })

  test('stretches the track and splits it equally between the scope segments', async () => {
    await renderWithProviders(
      <PillTabs stretch value='listen' items={SCOPE_ITEMS} onChange={jest.fn()} />,
    )

    expect(trackStyle().flexGrow).toBe(1)
    expect(segmentStyle('Слушать').flex).toBe(1)
    expect(segmentStyle('Читать').flex).toBe(1)
  })

  test('reports the pressed pill key', async () => {
    const onChange = jest.fn()
    await renderWithProviders(<PillTabs items={ITEMS} value='sermons' onChange={onChange} />)

    await fireEvent.press(screen.getByRole('button', { name: 'Плейлисты' }))

    expect(onChange).toHaveBeenCalledWith('playlists')
  })

  test('routes a disabled pill press to onDisabledPress instead of onChange', async () => {
    const onChange = jest.fn()
    const onDisabledPress = jest.fn()
    await renderWithProviders(
      <PillTabs
        value='listen'
        onChange={onChange}
        items={SCOPE_ITEMS}
        onDisabledPress={onDisabledPress}
      />,
    )

    const readPill = screen.getByRole('button', { name: 'Читать' })
    expect(readPill).toBeDisabled()
    expect(screen.getByText('Читать')).toHaveStyle({ color: DarkTheme.textMuted })

    await fireEvent.press(readPill)

    expect(onDisabledPress).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
  })
})

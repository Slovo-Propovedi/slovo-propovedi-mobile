import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES, withAlpha } from 'shared/ui/theme'
import { PillTabs } from './PillTabs'

jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native')

  return { LinearGradient: (props: Record<string, unknown>) => <View {...props} /> }
})

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
const SHADOW_ID = 'pill-tabs-shadow'
const TRACK_HEIGHT = 48
// The halo is a cast shadow: it overflows the row (88dp below the track and
// 16dp to each side) and tints the content underneath instead of reserving room.
const HALO_DEPTH = 88
// The row itself only keeps a small shape-breathing gap under the pill.
const SMALL_GAP = INDENTS.low
// The active theme is resolved by ThemeProvider (light or dark), so expected
// colors come from the same COLORS the component reads through `useTheme`.
const SELECTED_FILL = () => withAlpha(COLORS.text, 0.1)

const trackStyle = () => StyleSheet.flatten(screen.getByTestId(TRACK_ID).props.style)

const segmentStyle = (label: string) =>
  StyleSheet.flatten(screen.getByRole('button', { name: label }).props.style)

describe('<PillTabs>', () => {
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
    expect(fill).not.toBe(COLORS.card)
    expect([COLORS.white, COLORS.black]).toContain(fill)
    // Android draws boxShadow as a background drawable clipped to the view, so
    // an outset shadow degrades into an inner rim — the halo layer replaces it.
    expect(trackStyle().boxShadow).toBeUndefined()
    expect(trackStyle().elevation).toBeUndefined()
  })

  test('draws a wide, soft scope halo strictly outside the track', async () => {
    await renderWithProviders(<PillTabs items={ITEMS} value='sermons' onChange={jest.fn()} />)

    const halo = screen.getByTestId(SHADOW_ID)

    expect(StyleSheet.flatten(halo.props.style)).toMatchObject({
      borderRadius: RADIUSES.round,
      bottom: -HALO_DEPTH,
      left: -16,
      position: 'absolute',
      right: -16,
      top: -4,
    })
    // It now overflows onto interactive content, so it must never swallow taps.
    expect(halo).toHaveStyle({ pointerEvents: 'none' })
    expect(halo.props.colors).toEqual([
      'rgba(0, 0, 0, 0)',
      'rgba(0, 0, 0, 0.06)',
      'rgba(0, 0, 0, 0.035)',
      'rgba(0, 0, 0, 0)',
    ])
    expect(halo.props.locations).toEqual([0, 0.32, 0.72, 1])
  })

  test('marks only the active pill as selected (radio semantics)', async () => {
    await renderWithProviders(<PillTabs items={ITEMS} value='playlists' onChange={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Плейлисты' })).toBeSelected()
    expect(screen.getByRole('button', { name: 'Проповеди' })).not.toBeSelected()
    expect(screen.getByRole('button', { name: 'Проповедники' })).not.toBeSelected()
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
    expect(screen.queryByTestId(SHADOW_ID)).toBeNull()

    const row = StyleSheet.flatten(screen.getByTestId(SCROLL_ID).props.contentContainerStyle)
    expect(row.backgroundColor).toBeUndefined()
    expect(row.borderRadius).toBeUndefined()
    // No shadow means no reserved shadow room either.
    expect(row.paddingBottom).toBeUndefined()

    expect(segmentStyle('Плейлисты')).toMatchObject({
      backgroundColor: COLORS.primary,
      borderRadius: RADIUSES.round,
    })
    expect(screen.getByText('Плейлисты')).toHaveStyle({
      color: COLORS.onPrimary,
      fontWeight: '400',
    })

    // Unselected items are plain but bold labels: no fill, no border, no shadow.
    const unselected = segmentStyle('Проповеди')
    expect(unselected.backgroundColor).toBeUndefined()
    expect(unselected.borderWidth).toBeUndefined()
    expect(unselected.boxShadow).toBeUndefined()
    expect(unselected.elevation).toBeUndefined()
    expect(screen.getByText('Проповеди')).toHaveStyle({ fontWeight: '700' })

    // Results labels are a step larger than the scope track labels.
    expect(screen.getByText('Проповеди')).toHaveStyle({ fontSize: FONT_SIZES.md })
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
    expect(screen.getByText('Читать')).toHaveStyle({ color: COLORS.textMuted })

    await fireEvent.press(readPill)

    expect(onDisabledPress).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
  })
})

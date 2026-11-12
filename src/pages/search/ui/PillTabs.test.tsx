import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { COLORS, RADIUSES, withAlpha } from 'shared/ui/theme'
import { PillTabs } from './PillTabs'

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
const TRACK_HEIGHT = 48
// The track shadow reaches ~35dp below the track (offsetY 16 + blur 38/2); the
// wrappers must keep that room or the shadow is cut into a rim at the pill edge.
const MIN_SHADOW_ROOM = 35
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
  })

  test('renders the segments inside one raised, pill-shaped track', async () => {
    await renderWithProviders(<PillTabs items={ITEMS} value='sermons' onChange={jest.fn()} />)

    expect(screen.getByTestId(TRACK_ID)).toHaveStyle({
      backgroundColor: COLORS.card,
      borderRadius: RADIUSES.round,
      boxShadow: '0px 16px 38px rgba(0, 0, 0, 0.06)',
      flexDirection: 'row',
      height: TRACK_HEIGHT,
    })
    // Android elevation draws a tight outline ring around the track — the soft
    // shadow must come from boxShadow alone.
    expect(trackStyle().elevation).toBeUndefined()
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

  test('keeps shadow room inside the scroll viewport so the shadow is not clipped', async () => {
    await renderWithProviders(<PillTabs items={ITEMS} value='sermons' onChange={jest.fn()} />)

    const scroll = screen.getByTestId(SCROLL_ID)
    const content = StyleSheet.flatten(scroll.props.contentContainerStyle)
    const viewport = StyleSheet.flatten(scroll.props.style)

    expect(content.paddingBottom).toBeGreaterThanOrEqual(MIN_SHADOW_ROOM)
    expect(content.overflow).not.toBe('hidden')
    // The added room is compensated so the on-screen spacing does not grow.
    expect(viewport.marginBottom).toBeLessThan(0)
    expect(viewport.overflow).not.toBe('hidden')
  })

  test('keeps shadow room around the full-width track', async () => {
    await renderWithProviders(
      <PillTabs stretch value='listen' items={SCOPE_ITEMS} onChange={jest.fn()} />,
    )

    const row = StyleSheet.flatten(screen.getByTestId(STRETCH_ROW_ID).props.style)

    expect(row.paddingBottom).toBeGreaterThanOrEqual(MIN_SHADOW_ROOM)
    expect(row.marginBottom).toBeLessThan(0)
    expect(row.overflow).not.toBe('hidden')
    expect(trackStyle().overflow).not.toBe('hidden')
  })

  test('results variant highlights the selection with the accent color and no track shadow', async () => {
    await renderWithProviders(
      <PillTabs items={ITEMS} variant='results' value='playlists' onChange={jest.fn()} />,
    )

    expect(segmentStyle('Плейлисты')).toMatchObject({
      backgroundColor: COLORS.primary,
      borderRadius: RADIUSES.round,
    })
    expect(screen.getByText('Плейлисты')).toHaveStyle({
      color: COLORS.onPrimary,
      fontWeight: '600',
    })
    expect(trackStyle().boxShadow).toBeUndefined()
    expect(trackStyle().elevation).toBeUndefined()
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

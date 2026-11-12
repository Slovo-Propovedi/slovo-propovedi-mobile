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
const TRACK_HEIGHT = 48
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

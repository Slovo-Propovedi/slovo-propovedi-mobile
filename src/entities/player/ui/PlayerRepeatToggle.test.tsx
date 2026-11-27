import { renderWithProviders } from 'shared/mocks'
import { PlayerRepeatToggle } from './PlayerRepeatToggle'

const mockRepeatIconSpy = jest.fn()

jest.mock('../lib/PlayerService', () => ({
  playerService: { setRepeatMode: jest.fn() },
}))

jest.mock('@expo/vector-icons', () => {
  const Actual = jest.requireActual('@expo/vector-icons')
  return {
    ...Actual,
    MaterialCommunityIcons: (props: Record<string, unknown>) => {
      mockRepeatIconSpy(props)
      return <Actual.MaterialCommunityIcons {...props} />
    },
  }
})

const OFF_LABEL = 'Повтор: выключен'
// The toggle's own gray; the wide mini-player overrides it with the theme color.
const DEFAULT_INACTIVE_COLOR = '#9ca3af'
const EXPLICIT_INACTIVE_COLOR = '#123456'
const WIDE_ICON_SIZE = 18

describe('<PlayerRepeatToggle>', () => {
  beforeEach(() => {
    mockRepeatIconSpy.mockClear()
  })

  test('the off glyph falls back to the built-in gray instead of the theme accent', async () => {
    const { getByRole } = await renderWithProviders(<PlayerRepeatToggle />)

    expect(getByRole('button', { name: OFF_LABEL })).toBeTruthy()
    expect(mockRepeatIconSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ color: DEFAULT_INACTIVE_COLOR, name: 'repeat-off' }),
    )
  })

  test('an explicit inactiveColor overrides the default gray', async () => {
    await renderWithProviders(<PlayerRepeatToggle inactiveColor={EXPLICIT_INACTIVE_COLOR} />)

    expect(mockRepeatIconSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ color: EXPLICIT_INACTIVE_COLOR }),
    )
  })

  test('an explicit size overrides the fullscreen glyph size', async () => {
    await renderWithProviders(<PlayerRepeatToggle size={WIDE_ICON_SIZE} />)

    expect(mockRepeatIconSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ size: WIDE_ICON_SIZE }),
    )
  })
})

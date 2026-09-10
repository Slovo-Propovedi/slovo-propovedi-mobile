import { fireEvent, render } from '@testing-library/react-native'
import { router } from 'expo-router'
import { HeaderBackButton } from './HeaderBackButton'

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(),
    replace: jest.fn(),
  },
}))

const mockRouter = router as jest.Mocked<typeof router>

const mockIoniconsSpy = jest.fn()

jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    __esModule: true,
    default: (props: { color?: string; name: string }) => {
      mockIoniconsSpy(props)

      return <Text>{props.name}</Text>
    },
  }
})

describe('<HeaderBackButton>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders a button with the accessible name "Назад"', async () => {
    const { getByRole } = await render(<HeaderBackButton />)

    expect(getByRole('button', { name: 'Назад' })).toBeTruthy()
  })

  test('renders the chevron-back icon', async () => {
    await render(<HeaderBackButton />)

    expect(mockIoniconsSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'chevron-back' }))
  })

  test('goes back when there is navigation history', async () => {
    mockRouter.canGoBack.mockReturnValue(true)
    const { getByRole } = await render(<HeaderBackButton />)

    await fireEvent.press(getByRole('button', { name: 'Назад' }))

    expect(mockRouter.back).toHaveBeenCalledTimes(1)
    expect(mockRouter.replace).not.toHaveBeenCalled()
  })

  test('replaces with the default fallback route when there is no history', async () => {
    mockRouter.canGoBack.mockReturnValue(false)
    const { getByRole } = await render(<HeaderBackButton />)

    await fireEvent.press(getByRole('button', { name: 'Назад' }))

    expect(mockRouter.replace).toHaveBeenCalledWith('/more')
    expect(mockRouter.back).not.toHaveBeenCalled()
  })

  test('replaces with a custom fallback route when there is no history', async () => {
    mockRouter.canGoBack.mockReturnValue(false)
    const { getByRole } = await render(<HeaderBackButton fallbackRoute='/settings' />)

    await fireEvent.press(getByRole('button', { name: 'Назад' }))

    expect(mockRouter.replace).toHaveBeenCalledWith('/settings')
  })

  test('passes tintColor through to the icon', async () => {
    await render(<HeaderBackButton tintColor='#f16031' />)

    expect(mockIoniconsSpy).toHaveBeenCalledWith(expect.objectContaining({ color: '#f16031' }))
  })
})

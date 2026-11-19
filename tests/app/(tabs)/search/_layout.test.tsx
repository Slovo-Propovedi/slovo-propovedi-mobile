import { fireEvent } from '@testing-library/react-native'
import { router } from 'expo-router'
import { type PropsWithChildren, type ReactNode } from 'react'
import { renderWithProviders } from 'shared/mocks'
import Layout from '../../../../app/(tabs)/search/_layout'

const mockTheme = { background: '#101010', text: '#efefef' }

let mockScreenOptions: Record<string, unknown> = {}
let mockScreens: Record<string, Record<string, unknown> | undefined> = {}

jest.mock('shared/ui/theme', () => {
  const actual = jest.requireActual('shared/ui/theme')

  return {
    ...actual,
    useTheme: () => ({ currentTheme: mockTheme, isLight: false, themeMode: 'dark' }),
  }
})

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native')

  const Screen = ({ name, options }: { name: string; options?: Record<string, unknown> }) => {
    mockScreens[name] = options

    return <Text>{name}</Text>
  }
  const Stack = ({
    children,
    screenOptions,
  }: PropsWithChildren<{ screenOptions?: Record<string, unknown> }>) => {
    mockScreenOptions = screenOptions ?? {}

    return <>{children}</>
  }

  return {
    router: { back: jest.fn(), canGoBack: jest.fn(() => false), replace: jest.fn() },
    Stack: Object.assign(Stack, { Screen }),
  }
})

const mockRouter = router as jest.Mocked<typeof router>
const mockCanGoBack = mockRouter.canGoBack as jest.MockedFunction<typeof router.canGoBack>

const renderHeaderLeft = async () => {
  const headerLeft = mockScreenOptions.headerLeft as (props: { tintColor?: string }) => ReactNode
  const element = headerLeft({ tintColor: mockTheme.text })

  return renderWithProviders(<>{element}</>)
}

describe('(tabs)/search layout', () => {
  beforeEach(() => {
    mockScreenOptions = {}
    mockScreens = {}
    jest.clearAllMocks()
    mockCanGoBack.mockReturnValue(false)
  })

  test('keeps the results screen headerless and shows the native header on details', async () => {
    await renderWithProviders(<Layout />)

    expect(mockScreens.index).toEqual({ headerShown: false })
    expect(mockScreens.playlist?.headerShown).not.toBe(false)
    expect(mockScreens.preacher?.headerShown).not.toBe(false)
    expect(mockScreenOptions.headerShown).not.toBe(false)
  })

  test('mounted stack provides a themed back button that falls back to /search', async () => {
    await renderWithProviders(<Layout />)

    expect(mockScreenOptions.headerTintColor).toBe(mockTheme.text)
    expect(mockScreenOptions.headerTitleStyle).toEqual({ color: mockTheme.text })
    expect(mockScreenOptions.headerStyle).toEqual({ backgroundColor: mockTheme.background })

    const { getByRole } = await renderHeaderLeft()
    await fireEvent.press(getByRole('button', { name: 'Назад' }))

    expect(mockRouter.replace).toHaveBeenCalledWith('/search')
  })

  test('detail screens keep the transparent playlist header and empty titles', async () => {
    await renderWithProviders(<Layout />)

    expect(mockScreens.playlist).toEqual({
      headerStyle: { backgroundColor: 'transparent' },
      headerTransparent: true,
      title: '',
    })
    expect(mockScreens.preacher).toEqual({ title: '' })
  })
})

import { act, renderHook } from '@testing-library/react-native'
import { useNavigation } from 'expo-router'
import { useHeaderTitle } from './useHeaderTitle'

jest.mock('expo-router', () => ({
  useNavigation: jest.fn(() => ({ setOptions: jest.fn() })),
}))

const mockedUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>

describe('useHeaderTitle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseNavigation.mockReturnValue({ setOptions: jest.fn() })
  })

  test('calls setOptions with the title while mounted', async () => {
    const setOptions = jest.fn()
    mockedUseNavigation.mockReturnValue({ setOptions })

    const { result } = await renderHook(() => useHeaderTitle())

    act(() => {
      result.current('Заголовок')
    })

    expect(setOptions).toHaveBeenCalledWith({ headerTitle: 'Заголовок' })
  })

  test('no-ops when the callback executes after unmount', async () => {
    const setOptions = jest.fn()
    mockedUseNavigation.mockReturnValue({ setOptions })

    const { result, unmount } = await renderHook(() => useHeaderTitle())

    let setHeaderTitle: ((title: string) => void) | null = null
    await act(async () => {
      setHeaderTitle = result.current
    })

    await unmount()

    act(() => {
      setHeaderTitle?.('Заголовок')
    })

    expect(setOptions).not.toHaveBeenCalled()
  })
})

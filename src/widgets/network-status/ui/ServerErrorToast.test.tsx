import { createCtx } from '@reatom/framework'
import { withTiming } from 'react-native-reanimated'
import { renderWithProviders } from 'shared/mocks'
import { isOnlineAtom, serverUnreachableAtom } from 'shared/model'
import { ServerErrorToast } from './ServerErrorToast'

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')
  return {
    Ionicons: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

const TOAST_TEXT = 'Сервер недоступен'

describe('<ServerErrorToast>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders the server error text', async () => {
    const ctx = createCtx()
    isOnlineAtom(ctx, true)
    serverUnreachableAtom(ctx, true)

    const { getByText } = await renderWithProviders(<ServerErrorToast />, { ctx })

    expect(getByText(TOAST_TEXT)).toBeTruthy()
    expect(jest.mocked(withTiming)).toHaveBeenCalledWith(1, { duration: 300 })
  })

  test('always renders even when offline', async () => {
    const ctx = createCtx()
    isOnlineAtom(ctx, false)
    serverUnreachableAtom(ctx, true)

    const { getByText } = await renderWithProviders(<ServerErrorToast />, { ctx })

    expect(getByText(TOAST_TEXT)).toBeTruthy()
    expect(jest.mocked(withTiming)).toHaveBeenCalledWith(0, { duration: 300 })
  })

  test('always renders even when server is reachable', async () => {
    const ctx = createCtx()
    isOnlineAtom(ctx, true)
    serverUnreachableAtom(ctx, false)

    const { getByText } = await renderWithProviders(<ServerErrorToast />, { ctx })

    expect(getByText(TOAST_TEXT)).toBeTruthy()
  })

  test('container has pointerEvents set to none', async () => {
    const ctx = createCtx()
    isOnlineAtom(ctx, true)
    serverUnreachableAtom(ctx, true)

    const { getByText } = await renderWithProviders(<ServerErrorToast />, { ctx })

    // Animated.View with pointerEvents='none' is the grandparent of the text
    const container = getByText(TOAST_TEXT).parent?.parent
    expect(container?.props.pointerEvents).toBe('none')
  })

  test('has absolute positioning style on container', async () => {
    const ctx = createCtx()
    isOnlineAtom(ctx, true)
    serverUnreachableAtom(ctx, true)

    const { getByText } = await renderWithProviders(<ServerErrorToast />, { ctx })

    const container = getByText(TOAST_TEXT).parent?.parent
    const rawStyle = container?.props.style
    const flatStyle = Array.isArray(rawStyle)
      ? Object.assign({}, ...rawStyle.filter(Boolean))
      : rawStyle
    expect(flatStyle.position).toBe('absolute')
    expect(flatStyle.zIndex).toBe(100)
  })

  test('shows the alert-circle icon name', async () => {
    const ctx = createCtx()
    isOnlineAtom(ctx, true)
    serverUnreachableAtom(ctx, true)

    const { getByText } = await renderWithProviders(<ServerErrorToast />, { ctx })

    // Ionicons mock renders the icon name as text
    expect(getByText('alert-circle')).toBeTruthy()
  })
})

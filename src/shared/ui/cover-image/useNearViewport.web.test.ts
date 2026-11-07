import { act, renderHook } from '@testing-library/react-native'
import { type useNearViewport as useNearViewportWeb } from './useNearViewport.web'

// jest-expo resolves the native hook first; the web implementation is under test.
const { useNearViewport } = jest.requireActual<{ useNearViewport: typeof useNearViewportWeb }>(
  './useNearViewport.web.ts',
)

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void

let observerCallback: ObserverCallback = () => {}
const disconnect = jest.fn()

beforeEach(() => {
  disconnect.mockClear()
  global.IntersectionObserver = jest.fn((callback: ObserverCallback) => {
    observerCallback = callback
    return { disconnect, observe: jest.fn() }
  }) as unknown as typeof IntersectionObserver
  global.Element = class {} as unknown as typeof Element
})

const renderWithNode = async (enabled: boolean) =>
  await renderHook(() => {
    const viewport = useNearViewport(enabled)
    // Stand-in for the DOM node react-native-web attaches to a View ref.
    Object.assign(viewport.ref, { current: new global.Element() })
    return viewport
  })

describe('useNearViewport (web)', () => {
  test('stays false until the cover comes near the viewport', async () => {
    const { result } = await renderWithNode(true)
    await act(async () => {})
    expect(result.current.isNear).toBe(false)

    await act(async () => observerCallback([{ isIntersecting: true }]))

    expect(result.current.isNear).toBe(true)
    expect(disconnect).toHaveBeenCalled()
  })

  test('is near at once for eager covers', async () => {
    const { result } = await renderWithNode(false)

    expect(result.current.isNear).toBe(true)
    expect(global.IntersectionObserver).not.toHaveBeenCalled()
  })
})

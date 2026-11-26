import { act, renderHook } from '@testing-library/react-native'
import { type TextInputInstance } from 'react-native'
import { useExternalFocusRequest } from './useExternalFocusRequest'

const createFieldRef = () => ({
  current: { focus: jest.fn() } as unknown as TextInputInstance,
})

const getFocus = (fieldRef: ReturnType<typeof createFieldRef>) =>
  fieldRef.current.focus as jest.Mock

const renderFocus = async (initialEnabled: boolean) => {
  const fieldRef = createFieldRef()
  const { rerender } = await renderHook(
    ({ enabled, request }: { enabled: boolean; request: number }) =>
      useExternalFocusRequest(request, fieldRef, enabled),
    { initialProps: { enabled: initialEnabled, request: 0 } },
  )

  return { focus: getFocus(fieldRef), rerender }
}

describe('useExternalFocusRequest', () => {
  test('never focuses a disabled field', async () => {
    const { focus, rerender } = await renderFocus(false)

    await act(async () => {
      rerender({ enabled: false, request: 1 })
    })

    expect(focus).not.toHaveBeenCalled()
  })

  test('focuses an enabled field once per request', async () => {
    const { focus, rerender } = await renderFocus(true)

    await act(async () => {
      rerender({ enabled: true, request: 1 })
    })

    expect(focus).toHaveBeenCalledTimes(1)
  })

  test('does not replay a request consumed while the field was disabled', async () => {
    const { focus, rerender } = await renderFocus(false)

    await act(async () => {
      rerender({ enabled: false, request: 1 })
    })
    await act(async () => {
      rerender({ enabled: true, request: 1 })
    })

    expect(focus).not.toHaveBeenCalled()

    await act(async () => {
      rerender({ enabled: true, request: 2 })
    })

    expect(focus).toHaveBeenCalledTimes(1)
  })
})

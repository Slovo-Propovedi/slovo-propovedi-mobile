import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from '../../mocks'
import { useFormTouched } from './useFormTouched'

describe('useFormTouched', () => {
  test('marks a field as touched', async () => {
    const { result } = await renderHookWithProviders(() => useFormTouched<'title'>())

    await act(async () => result.current.markTouched('title'))

    expect(result.current.touched.title).toBe(true)
  })

  test('markAllTouched marks every key', async () => {
    const { result } = await renderHookWithProviders(() => useFormTouched<'email' | 'name'>())

    await act(async () => result.current.markAllTouched(['email', 'name']))

    expect(result.current.touched).toEqual({ email: true, name: true })
  })

  test('keeps prior keys when marking again', async () => {
    const { result } = await renderHookWithProviders(() => useFormTouched<'email' | 'name'>())

    await act(async () => {
      result.current.markTouched('name')
      result.current.markTouched('email')
    })

    expect(result.current.touched).toEqual({ email: true, name: true })
  })
})

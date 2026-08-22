import { act, renderHook } from '@testing-library/react-native'
import { getErrorDetail, getErrorMessage } from '../../lib/error-utils'
import { useErrorDialog } from './useErrorDialog'

describe('getErrorMessage', () => {
  test('returns error.message for an Error instance', () => {
    expect(getErrorMessage(new Error('something broke'))).toBe('something broke')
  })

  test('returns the string itself for a string input', () => {
    expect(getErrorMessage('custom error')).toBe('custom error')
  })

  test('returns fallback for a number', () => {
    expect(getErrorMessage(42)).toBe('Неизвестная ошибка')
  })

  test('returns fallback for null', () => {
    expect(getErrorMessage(null)).toBe('Неизвестная ошибка')
  })

  test('returns fallback for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Неизвестная ошибка')
  })

  test('returns fallback for a plain object', () => {
    expect(getErrorMessage({ a: 1 })).toBe('Неизвестная ошибка')
  })

  test('returns fallback for an array', () => {
    expect(getErrorMessage([1, 2])).toBe('Неизвестная ошибка')
  })
})

describe('getErrorDetail', () => {
  test('returns error.stack for an Error with a stack', () => {
    const err = new Error('boom')
    expect(getErrorDetail(err)).toBe(err.stack)
  })

  test('returns error.message when stack is undefined', () => {
    const err = new Error('no stack')
    err.stack = undefined
    expect(getErrorDetail(err)).toBe('no stack')
  })

  test('returns the string itself for a string input', () => {
    expect(getErrorDetail('detail text')).toBe('detail text')
  })

  test('returns pretty-printed JSON for a plain object', () => {
    const obj = { a: 1 }
    const result = getErrorDetail(obj)

    expect(JSON.parse(result)).toEqual(obj)
    expect(result).toBe(JSON.stringify(obj, null, 2))
  })

  test('returns fallback for null', () => {
    expect(getErrorDetail(null)).toBe('Нет деталей')
  })

  test('returns fallback for undefined', () => {
    expect(getErrorDetail(undefined)).toBe('Нет деталей')
  })

  test('returns fallback for a number', () => {
    expect(getErrorDetail(42)).toBe('Нет деталей')
  })
})

describe('useErrorDialog', () => {
  test('initial state: errorMessage is null, errorDetail is empty', async () => {
    const { result } = await renderHook(() => useErrorDialog())

    expect(result.current.errorMessage).toBeNull()
    expect(result.current.errorDetail).toBe('')
  })

  test('showError with an Error sets message and detail', async () => {
    const { result } = await renderHook(() => useErrorDialog())

    const error = new Error('network failure')
    await act(async () => {
      result.current.showError(error)
    })

    expect(result.current.errorMessage).toBe('network failure')
    expect(result.current.errorDetail).toBe(error.stack)
  })

  test('showError with customMessage overrides the error message', async () => {
    const { result } = await renderHook(() => useErrorDialog())

    await act(async () => {
      result.current.showError(new Error('raw'), 'User-friendly msg')
    })

    expect(result.current.errorMessage).toBe('User-friendly msg')
  })

  test('showErrorWithMessage sets both message and detail directly', async () => {
    const { result } = await renderHook(() => useErrorDialog())

    await act(async () => {
      result.current.showErrorWithMessage('title', 'body')
    })

    expect(result.current.errorMessage).toBe('title')
    expect(result.current.errorDetail).toBe('body')
  })

  test('dismissError resets state to initial', async () => {
    const { result } = await renderHook(() => useErrorDialog())

    await act(async () => {
      result.current.showError(new Error('oops'))
    })

    await act(async () => {
      result.current.dismissError()
    })

    expect(result.current.errorMessage).toBeNull()
    expect(result.current.errorDetail).toBe('')
  })

  test('showError then dismissError transitions state correctly', async () => {
    const { result } = await renderHook(() => useErrorDialog())

    // initial
    expect(result.current.errorMessage).toBeNull()

    // show
    await act(async () => {
      result.current.showError(new Error('fail'))
    })
    expect(result.current.errorMessage).toBe('fail')
    expect(result.current.errorDetail).not.toBe('')

    // dismiss
    await act(async () => {
      result.current.dismissError()
    })
    expect(result.current.errorMessage).toBeNull()
    expect(result.current.errorDetail).toBe('')
  })
})

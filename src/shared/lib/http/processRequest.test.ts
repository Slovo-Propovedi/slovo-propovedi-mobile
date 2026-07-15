import { processRequest } from './processRequest'

describe('processRequest', () => {
  describe('successful request', () => {
    test('returns data and null error for resolved promise', async () => {
      const result = await processRequest(Promise.resolve('hello'))

      expect(result).toEqual({ data: 'hello', error: null })
    })

    test('returns structured data from resolved promise', async () => {
      const payload = { id: 1, name: 'test' }
      const result = await processRequest(Promise.resolve(payload))

      expect(result.data).toEqual(payload)
      expect(result.error).toBeNull()
    })

    test('handles null resolved value', async () => {
      const result = await processRequest(Promise.resolve(null))

      expect(result).toEqual({ data: null, error: null })
    })

    test('handles complex nested data', async () => {
      const nested = { a: { b: [1, 2, 3] } }
      const result = await processRequest(Promise.resolve(nested))

      expect(result.data).toEqual(nested)
    })
  })

  describe('failed request', () => {
    let errorSpy: jest.SpyInstance

    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation()
    })

    afterEach(() => {
      errorSpy.mockRestore()
    })

    test('returns null data and error for rejected promise', async () => {
      const error = new Error('network failure')
      const result = await processRequest(Promise.reject(error))

      expect(result.data).toBeNull()
      expect(result.error).toBe(error)
    })

    test('logs default error message on failure', async () => {
      await processRequest(Promise.reject(new Error('fail')))

      expect(errorSpy).toHaveBeenCalledWith('Ошибка запроса: ', expect.any(Error))
    })

    test('logs custom error message on failure', async () => {
      await processRequest(Promise.reject(new Error('fail')), 'Custom error')

      expect(errorSpy).toHaveBeenCalledWith('Custom error: ', expect.any(Error))
    })

    test('captures non-Error thrown values', async () => {
      const result = await processRequest(Promise.reject('string error'))

      expect(result.data).toBeNull()
      expect(result.error).toBe('string error')
    })

    test('captures Error with custom message', async () => {
      const error = new Error('specific message')
      const result = await processRequest(Promise.reject(error))

      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe('specific message')
    })
  })

  describe('return value shape', () => {
    test('success result has data property and no error key mismatch', async () => {
      const result = await processRequest(Promise.resolve(42))

      expect(result).toHaveProperty('data', 42)
      expect(result).toHaveProperty('error', null)
    })

    test('error result has error property and null data', async () => {
      const result = await processRequest(Promise.reject(new Error('oops')))

      expect(result).toHaveProperty('data', null)
      expect(result).toHaveProperty('error')
      expect(result.error).not.toBeNull()
    })
  })

  describe('async behavior', () => {
    test('returns a promise', () => {
      const result = processRequest(Promise.resolve(1))

      expect(result).toBeInstanceOf(Promise)
    })

    test('awaits delayed resolution', async () => {
      const delayed = new Promise<string>(resolve => {
        setTimeout(() => resolve('delayed'), 10)
      })

      const result = await processRequest(delayed)

      expect(result).toEqual({ data: 'delayed', error: null })
    })

    test('awaits delayed rejection', async () => {
      const delayed = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('slow fail')), 10)
      })

      const result = await processRequest(delayed)

      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
    })
  })
})

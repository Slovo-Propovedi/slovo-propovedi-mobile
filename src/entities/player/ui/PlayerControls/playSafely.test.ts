import { playSafely } from './playSafely'

const APP_STATE_ERROR = new Error('activity is no longer available')

describe('playSafely', () => {
  test('swallows the AppState "activity is no longer available" error', async () => {
    const play = jest.fn().mockRejectedValue(APP_STATE_ERROR)

    await expect(playSafely(play)).resolves.toBeUndefined()
  })

  test('rethrows a generic error', async () => {
    const genericError = new Error('boom')
    const play = jest.fn().mockRejectedValue(genericError)

    await expect(playSafely(play)).rejects.toBe(genericError)
  })
})

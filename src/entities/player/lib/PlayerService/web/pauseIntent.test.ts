import { markInterruptedWhilePlaying, markUserPause, wasPlaying } from './pauseIntent'

beforeEach(() => {
  markUserPause()
})

describe('pauseIntent', () => {
  test('starts idle', () => {
    expect(wasPlaying()).toBe(false)
  })

  test('markInterruptedWhilePlaying arms the intent', () => {
    markInterruptedWhilePlaying()

    expect(wasPlaying()).toBe(true)
  })

  test('markUserPause clears the intent', () => {
    markInterruptedWhilePlaying()

    markUserPause()

    expect(wasPlaying()).toBe(false)
  })
})

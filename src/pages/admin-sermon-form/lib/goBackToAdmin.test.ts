const mockBack = jest.fn()
const mockCanGoBack = jest.fn()
const mockReplace = jest.fn()

jest.mock('expo-router', () => ({
  router: {
    back: () => mockBack(),
    canGoBack: () => mockCanGoBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}))

import { goBackToAdmin } from './goBackToAdmin'

describe('goBackToAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('goes back when there is admin-internal history', () => {
    mockCanGoBack.mockReturnValue(true)

    goBackToAdmin()

    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockReplace).not.toHaveBeenCalled()
  })

  test('falls back to the sermons list without history', () => {
    mockCanGoBack.mockReturnValue(false)

    goBackToAdmin()

    expect(mockReplace).toHaveBeenCalledWith('/admin/sermons')
    expect(mockBack).not.toHaveBeenCalled()
  })
})

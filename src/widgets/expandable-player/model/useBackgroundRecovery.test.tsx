import '@testing-library/jest-native/extend-expect'
import { act, screen } from '@testing-library/react-native'
import { AppState, type AppStateStatus, Text } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { useBackgroundRecovery } from './useBackgroundRecovery'

let mockListeners: Array<(state: AppStateStatus) => void> = []
let mockedDateNow: jest.SpyInstance

beforeEach(() => {
  mockListeners = []
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event: string, listener: (state: AppStateStatus) => void) => {
      mockListeners.push(listener)
      return { remove: jest.fn() }
    })
  mockedDateNow = jest.spyOn(Date, 'now').mockReturnValue(1000000)
})

afterEach(() => {
  jest.restoreAllMocks()
})

const emitState = (state: AppStateStatus) => {
  for (const listener of mockListeners) listener(state)
}

const Harness = () => {
  const key = useBackgroundRecovery()
  return <Text>{String(key)}</Text>
}

describe('useBackgroundRecovery', () => {
  test('short background (< 5 min) keeps key at 0', async () => {
    mockedDateNow.mockReturnValue(1000000)

    await renderWithProviders(<Harness />)

    await act(async () => {
      emitState('background')
    })

    mockedDateNow.mockReturnValue(1000000 + 4 * 60 * 1000)

    await act(async () => {
      emitState('active')
    })

    expect(screen.getByText('0')).toBeTruthy()
  })

  test('long background (> 5 min) increments key to 1', async () => {
    mockedDateNow.mockReturnValue(1000000)

    await renderWithProviders(<Harness />)

    await act(async () => {
      emitState('background')
    })

    mockedDateNow.mockReturnValue(1000000 + 5 * 60 * 1000 + 1)

    await act(async () => {
      emitState('active')
    })

    expect(screen.getByText('1')).toBeTruthy()
  })

  test('multiple long backgrounds accumulate', async () => {
    mockedDateNow.mockReturnValue(1000000)

    await renderWithProviders(<Harness />)

    await act(async () => {
      emitState('background')
    })
    mockedDateNow.mockReturnValue(1000000 + 6 * 60 * 1000)
    await act(async () => {
      emitState('active')
    })
    expect(screen.getByText('1')).toBeTruthy()

    await act(async () => {
      emitState('background')
    })
    mockedDateNow.mockReturnValue(1000000 + 12 * 60 * 1000)
    await act(async () => {
      emitState('active')
    })
    expect(screen.getByText('2')).toBeTruthy()
  })

  test('inactive→background does not reset the timer', async () => {
    mockedDateNow.mockReturnValue(1000000)

    await renderWithProviders(<Harness />)

    await act(async () => {
      emitState('inactive')
    })

    mockedDateNow.mockReturnValue(1000000 + 2 * 60 * 1000)

    await act(async () => {
      emitState('background')
    })

    mockedDateNow.mockReturnValue(1000000 + 5 * 60 * 1000 + 1)

    await act(async () => {
      emitState('active')
    })

    expect(screen.getByText('1')).toBeTruthy()
  })

  test('exact boundary (5 min exactly) keeps key at 0', async () => {
    mockedDateNow.mockReturnValue(1000000)

    await renderWithProviders(<Harness />)

    await act(async () => {
      emitState('background')
    })

    mockedDateNow.mockReturnValue(1000000 + 5 * 60 * 1000)

    await act(async () => {
      emitState('active')
    })

    expect(screen.getByText('0')).toBeTruthy()
  })

  test('fresh mount with active-only transition keeps key at 0', async () => {
    mockedDateNow.mockReturnValue(1000000)

    await renderWithProviders(<Harness />)

    await act(async () => {
      emitState('active')
    })

    expect(screen.getByText('0')).toBeTruthy()
  })
})

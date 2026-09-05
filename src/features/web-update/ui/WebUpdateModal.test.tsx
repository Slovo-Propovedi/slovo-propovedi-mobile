import { fireEvent } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { Platform } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { useWebUpdateWatcher } from '../lib/useWebUpdateWatcher'
import { WebUpdateModal } from './WebUpdateModal'

jest.mock('../lib/useWebUpdateWatcher', () => ({
  useWebUpdateWatcher: jest.fn(),
}))

const mockedUseWebUpdateWatcher = useWebUpdateWatcher as jest.MockedFunction<
  typeof useWebUpdateWatcher
>

const buildHookReturn = (overrides?: Partial<ReturnType<typeof useWebUpdateWatcher>>) => ({
  apply: jest.fn(),
  applying: false,
  dismiss: jest.fn(),
  status: 'idle' as const,
  ...overrides,
})

describe('<WebUpdateModal>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.replaceProperty(Platform, 'OS', 'web')
    mockedUseWebUpdateWatcher.mockReturnValue(buildHookReturn())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders nothing when idle', async () => {
    const { queryByText } = await renderWithProviders(<WebUpdateModal />)

    expect(queryByText('Доступна новая версия')).toBeNull()
  })

  test('shows the downloading message and disables the update button while installing', async () => {
    mockedUseWebUpdateWatcher.mockReturnValue(buildHookReturn({ status: 'installing' }))

    const { getByRole, getByText } = await renderWithProviders(<WebUpdateModal />)

    expect(getByText('Доступна новая версия')).toBeTruthy()
    expect(getByText(/скачивается в фоне/)).toBeTruthy()
    expect(getByRole('button', { disabled: true, name: 'Обновить' })).toBeTruthy()
    expect(getByRole('button', { name: 'Позже' })).toBeTruthy()
  })

  test('enables the update button when ready and applies on press', async () => {
    const apply = jest.fn()
    mockedUseWebUpdateWatcher.mockReturnValue(buildHookReturn({ apply, status: 'ready' }))

    const { getByRole } = await renderWithProviders(<WebUpdateModal />)

    fireEvent.press(getByRole('button', { name: 'Обновить' }))

    expect(apply).toHaveBeenCalledTimes(1)
  })

  test('calls dismiss when the later button is pressed', async () => {
    const dismiss = jest.fn()
    mockedUseWebUpdateWatcher.mockReturnValue(buildHookReturn({ dismiss, status: 'ready' }))

    const { getByRole } = await renderWithProviders(<WebUpdateModal />)

    fireEvent.press(getByRole('button', { name: 'Позже' }))

    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  test('disables both buttons while applying', async () => {
    mockedUseWebUpdateWatcher.mockReturnValue(buildHookReturn({ applying: true, status: 'ready' }))

    const { getByRole } = await renderWithProviders(<WebUpdateModal />)

    expect(getByRole('button', { disabled: true, name: 'Обновить' })).toBeTruthy()
    expect(getByRole('button', { disabled: true, name: 'Позже' })).toBeTruthy()
  })
})

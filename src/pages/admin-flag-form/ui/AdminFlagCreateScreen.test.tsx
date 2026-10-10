import { featureFlagsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminFlagCreateScreen } from './AdminFlagCreateScreen'

const mockCreate = jest.fn()

jest.mock('shared/api', () => ({
  featureFlagsApi: {
    getFeatureFlags: () => ({ featureFlagsControllerCreate: mockCreate }),
  },
}))

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ back: jest.fn() }),
}))

jest.mock('entities/auth', () => ({ useRequireAdminRole: () => undefined }))

describe('<AdminFlagCreateScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreate.mockResolvedValue(featureFlagsMocks.getFeatureFlagsControllerCreateResponseMock())
  })

  test('renders the key, title and enabled fields', async () => {
    const { findByText, getByLabelText, getByText } = await renderWithProviders(
      <AdminFlagCreateScreen />,
    )

    expect(await findByText('Новый флаг')).toBeTruthy()
    expect(getByLabelText('Ключ')).toBeTruthy()
    expect(getByLabelText('Название')).toBeTruthy()
    expect(getByText('Включён')).toBeTruthy()
  })
})

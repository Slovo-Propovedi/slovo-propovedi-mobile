import { usersMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminUserCreateScreen } from './AdminUserCreateScreen'

const mockCreate = jest.fn()

jest.mock('shared/api', () => ({
  usersApi: {
    getUsers: () => ({ usersControllerCreate: mockCreate }),
  },
}))

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ back: jest.fn() }),
}))

jest.mock('entities/auth', () => ({
  ROLE_LABELS: {
    admin: 'Администратор',
    moderator: 'Модератор',
    user: 'Пользователь',
  },
  useRequireAdminRole: () => undefined,
}))

describe('<AdminUserCreateScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreate.mockResolvedValue(usersMocks.getUsersControllerCreateResponseMock())
  })

  test('renders the fields with the password field in create mode', async () => {
    const { findByText, getByLabelText, getByText } = await renderWithProviders(
      <AdminUserCreateScreen />,
    )

    expect(await findByText('Новый пользователь')).toBeTruthy()
    expect(getByLabelText('Имя')).toBeTruthy()
    expect(getByLabelText('Email')).toBeTruthy()
    expect(getByLabelText('Логин')).toBeTruthy()
    expect(getByLabelText('Пароль')).toBeTruthy()
    expect(getByText('Пользователь')).toBeTruthy()
  })
})

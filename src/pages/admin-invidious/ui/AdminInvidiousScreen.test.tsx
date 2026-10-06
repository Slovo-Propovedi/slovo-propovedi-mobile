import { fireEvent, waitFor } from '@testing-library/react-native'
import { invidiousMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { toastAtom } from 'shared/model'
import { AdminInvidiousScreen } from './AdminInvidiousScreen'

// MarqueeText renders the title twice (visible + measurer), so a single-Text
// stub keeps text queries unambiguous in list-row tests.
jest.mock('shared/ui/marquee-text/marquee-text', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    MarqueeText: ({ testID, text }: { testID?: string; text: string }) => (
      <Text testID={testID}>{text}</Text>
    ),
  }
})

const INSTANCE_A = 'https://a.example'
const INSTANCE_B = 'https://b.example'
const INSTANCE_C = 'https://c.example'
const INPUT_LABEL = 'Новый инстанс'
const ADD_LABEL = 'Добавить'
const SAVE_LABEL = 'Сохранить'
const REMOVE_LABEL = 'Удалить'
const INVALID_MESSAGE = 'Адрес должен начинаться с https://'

const mockFindAll = jest.fn()
const mockReplace = jest.fn()

jest.mock('shared/api', () => ({
  invidiousApi: {
    getInvidious: () => ({
      invidiousInstancesControllerFindAll: mockFindAll,
      invidiousInstancesControllerReplace: mockReplace,
    }),
  },
}))

jest.mock('entities/auth', () => ({
  useRequireAdminRole: () => undefined,
}))

// Ответ сервера строится из сгенерированной фабрики: типы фиксированы, а url
// переопределяем, чтобы тест не зависел от случайных значений faker.
const createInstances = (urls: string[]) => {
  const template = invidiousMocks.getInvidiousInstancesControllerFindAllResponseMock()[0]

  return urls.map((url, index) => ({ ...template, id: index + 1, url }))
}

describe('<AdminInvidiousScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindAll.mockResolvedValue(createInstances([INSTANCE_A, INSTANCE_B]))
    mockReplace.mockImplementation(({ urls }: { urls: string[] }) =>
      Promise.resolve(createInstances(urls)),
    )
  })

  test('renders the instances returned by the backend', async () => {
    const { findByText } = await renderWithProviders(<AdminInvidiousScreen />)

    expect(await findByText(INSTANCE_A)).toBeTruthy()
    expect(await findByText(INSTANCE_B)).toBeTruthy()
  })

  test('adds a url and saves the full list through PUT', async () => {
    const { findByText, getByLabelText, getByRole, getByText } = await renderWithProviders(
      <AdminInvidiousScreen />,
    )
    await findByText(INSTANCE_A)

    fireEvent.changeText(getByLabelText(INPUT_LABEL), INSTANCE_C)
    await waitFor(() => expect(getByLabelText(INPUT_LABEL).props.value).toBe(INSTANCE_C))
    fireEvent.press(getByText(ADD_LABEL))
    await waitFor(() => expect(getByRole('button', { name: SAVE_LABEL })).not.toBeDisabled())
    fireEvent.press(getByRole('button', { name: SAVE_LABEL }))

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ urls: [INSTANCE_A, INSTANCE_B, INSTANCE_C] }),
    )
  })

  test('removes a url after confirmation and saves without it', async () => {
    const { findAllByLabelText, findByText, getAllByText, getByRole, queryByText } =
      await renderWithProviders(<AdminInvidiousScreen />)
    await findByText(INSTANCE_A)

    fireEvent.press((await findAllByLabelText(REMOVE_LABEL))[0])
    expect(await findByText('Удалить инстанс?')).toBeTruthy()

    const confirmButtons = getAllByText(REMOVE_LABEL, { includeHiddenElements: true })
    fireEvent.press(confirmButtons[confirmButtons.length - 1])
    await waitFor(() => expect(queryByText(INSTANCE_A)).toBeNull())
    fireEvent.press(getByRole('button', { name: SAVE_LABEL }))

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ urls: [INSTANCE_B] }))
  })

  test('rejects a non-https url without adding it', async () => {
    const { ctx, findByText, getByLabelText, getByText } = await renderWithProviders(
      <AdminInvidiousScreen />,
    )
    await findByText(INSTANCE_A)

    fireEvent.changeText(getByLabelText(INPUT_LABEL), 'http://a.example')
    await waitFor(() => expect(getByLabelText(INPUT_LABEL).props.value).toBe('http://a.example'))
    fireEvent.press(getByText(ADD_LABEL))

    await waitFor(() => expect(ctx.get(toastAtom)).toBe(INVALID_MESSAGE))
    expect(mockReplace).not.toHaveBeenCalled()
  })
})

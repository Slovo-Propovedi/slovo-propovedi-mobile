import { fireEvent, waitFor } from '@testing-library/react-native'
import { invidiousMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { toastAtom } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
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

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

const INSTANCE_A = 'https://a.example'
const INSTANCE_B = 'https://b.example'
const INSTANCE_C = 'https://c.example'
const INPUT_LABEL = 'Новый инстанс'
const ADD_LABEL = 'Добавить'
const SAVE_LABEL = 'Сохранить'
const REMOVE_LABEL = 'Удалить'
const INVALID_MESSAGE = 'Адрес должен начинаться с https://'
const ANTIBOT_MESSAGE = 'Инстанс закрыт антиботом — API недоступен'
const PROBE_ERROR_MESSAGE = 'Не удалось проверить доступ по API к инстансу'

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

const AUDIO_FIXTURE = {
  adaptiveFormats: [
    {
      bitrate: '133546',
      itag: '140',
      type: 'audio/mp4; codecs="mp4a.40.2"',
      url: 'https://a.example/videoplayback?audio=140',
    },
  ],
  title: 'Test video',
}

const jsonResponse = (payload: unknown, status = 200) =>
  ({
    headers: { get: () => 'application/json' },
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
  }) as unknown as Response

const htmlResponse = () =>
  ({
    headers: { get: () => 'text/html; charset=utf-8' },
    ok: true,
    status: 200,
    text: async () => '<!DOCTYPE html><html><body>Anubis</body></html>',
  }) as unknown as Response

// Ответ сервера строится из сгенерированной фабрики: типы фиксированы, а url
// переопределяем, чтобы тест не зависел от случайных значений faker.
const createInstances = (urls: string[]) => {
  const template = invidiousMocks.getInvidiousInstancesControllerFindAllResponseMock()[0]

  return urls.map((url, index) => ({ ...template, id: index + 1, url }))
}

const mockReportError = reportError as jest.MockedFunction<typeof reportError>

describe('<AdminInvidiousScreen>', () => {
  let fetchMock: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockFindAll.mockResolvedValue(createInstances([INSTANCE_A, INSTANCE_B]))
    mockReplace.mockImplementation(({ urls }: { urls: string[] }) =>
      Promise.resolve(createInstances(urls)),
    )
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(AUDIO_FIXTURE))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders the instances returned by the backend', async () => {
    const { findByText } = await renderWithProviders(<AdminInvidiousScreen />)

    expect(await findByText(INSTANCE_A)).toBeTruthy()
    expect(await findByText(INSTANCE_B)).toBeTruthy()
  })

  test('adds a url after a successful probe and saves the full list through PUT', async () => {
    const { findByText, getByLabelText, getByText } = await renderWithProviders(
      <AdminInvidiousScreen />,
    )
    await findByText(INSTANCE_A)

    fireEvent.changeText(getByLabelText(INPUT_LABEL), INSTANCE_C)
    await waitFor(() => expect(getByLabelText(INPUT_LABEL).props.value).toBe(INSTANCE_C))
    fireEvent.press(getByText(ADD_LABEL))

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ urls: [INSTANCE_A, INSTANCE_B, INSTANCE_C] }),
    )
    expect(await findByText(INSTANCE_C)).toBeTruthy()
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

  test('rejects a non-https url without probing or adding it', async () => {
    const { ctx, findByText, getByLabelText, getByText } = await renderWithProviders(
      <AdminInvidiousScreen />,
    )
    await findByText(INSTANCE_A)

    fireEvent.changeText(getByLabelText(INPUT_LABEL), 'http://a.example')
    await waitFor(() => expect(getByLabelText(INPUT_LABEL).props.value).toBe('http://a.example'))
    fireEvent.press(getByText(ADD_LABEL))

    await waitFor(() => expect(ctx.get(toastAtom)).toBe(INVALID_MESSAGE))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  test('shows the reason and does not add when the probe reports anti-bot', async () => {
    fetchMock.mockResolvedValue(htmlResponse())
    const { ctx, findByText, getByLabelText, getByText } = await renderWithProviders(
      <AdminInvidiousScreen />,
    )
    await findByText(INSTANCE_A)

    fireEvent.changeText(getByLabelText(INPUT_LABEL), INSTANCE_C)
    await waitFor(() => expect(getByLabelText(INPUT_LABEL).props.value).toBe(INSTANCE_C))
    fireEvent.press(getByText(ADD_LABEL))

    await waitFor(() => expect(ctx.get(toastAtom)).toBe(ANTIBOT_MESSAGE))
    await waitFor(() => expect(getByText(ADD_LABEL)).toBeTruthy())
    expect(mockReplace).not.toHaveBeenCalled()
  })

  test('reports an unknown probe failure and does not add the instance', async () => {
    fetchMock.mockRejectedValue(new Error('Network request failed'))
    const { findByText, getByLabelText, getByText } = await renderWithProviders(
      <AdminInvidiousScreen />,
    )
    await findByText(INSTANCE_A)

    fireEvent.changeText(getByLabelText(INPUT_LABEL), INSTANCE_C)
    await waitFor(() => expect(getByLabelText(INPUT_LABEL).props.value).toBe(INSTANCE_C))
    fireEvent.press(getByText(ADD_LABEL))

    await waitFor(() =>
      expect(mockReportError).toHaveBeenCalledWith(expect.any(Error), PROBE_ERROR_MESSAGE),
    )
    await waitFor(() => expect(getByText(ADD_LABEL)).toBeTruthy())
    expect(mockReplace).not.toHaveBeenCalled()
  })
})

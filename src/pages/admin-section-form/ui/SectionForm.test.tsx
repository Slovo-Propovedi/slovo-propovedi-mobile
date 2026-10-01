import { fireEvent, waitFor } from '@testing-library/react-native'
import { playlistsMocks, sectionsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { SectionForm } from './SectionForm'

const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockPlaylistFindAll = jest.fn()

const SAVE_LABEL = 'Сохранить'
const ENTER_TITLE = 'Раздел с Enter'

jest.mock('shared/api', () => ({
  playlistsApi: {
    getPlaylists: () => ({ playlistControllerFindAll: mockPlaylistFindAll }),
  },
  sectionsApi: {
    getSections: () => ({
      sectionControllerCreate: mockCreate,
      sectionControllerUpdate: mockUpdate,
    }),
  },
}))

jest.mock('expo-router', () => {
  const React = jest.requireActual('react') as {
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => unknown
    Fragment: unknown
  }

  return {
    // Save now lives in the header (headerRight). Render it so the test can press it.
    Stack: {
      Screen: ({ options }: { options?: { headerRight?: () => unknown } }) =>
        options?.headerRight
          ? React.createElement(React.Fragment, null, options.headerRight())
          : null,
    },
    useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  }
})

describe('<SectionForm>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreate.mockResolvedValue({})
    mockUpdate.mockResolvedValue({})
    mockPlaylistFindAll.mockResolvedValue(playlistsMocks.getPlaylistControllerFindAllResponseMock())
  })

  test('renders the main and appearance fields', async () => {
    const { getByLabelText, getByText } = await renderWithProviders(<SectionForm mode='create' />)

    expect(getByLabelText('Название')).toBeTruthy()
    expect(getByLabelText('Описание')).toBeTruthy()
    expect(getByText('Размер карточек')).toBeTruthy()
    expect(getByText('Высота карточек')).toBeTruthy()
    expect(getByText('Расположение заголовка')).toBeTruthy()
    expect(getByText('Строк')).toBeTruthy()
    expect(getByText('Крупный заголовок описания на слайде')).toBeTruthy()
    expect(getByText('Скруглённые углы карточек')).toBeTruthy()
  })

  test('create submits the built dto', async () => {
    const { getByLabelText, getByRole } = await renderWithProviders(<SectionForm mode='create' />)

    fireEvent.changeText(getByLabelText('Название'), '  Новый раздел  ')
    await waitFor(() => expect(getByLabelText('Название').props.value).toBe('  Новый раздел  '))
    fireEvent.press(getByRole('button', { name: SAVE_LABEL }))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ description: null, title: 'Новый раздел' }),
    )
  })

  test('create submits when Enter is pressed in a single-line field', async () => {
    const { getByLabelText } = await renderWithProviders(<SectionForm mode='create' />)

    fireEvent.changeText(getByLabelText('Название'), ENTER_TITLE)
    await waitFor(() => expect(getByLabelText('Название').props.value).toBe(ENTER_TITLE))
    fireEvent(getByLabelText('Название'), 'submitEditing')

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ title: ENTER_TITLE }))
  })

  test('does not submit when Enter is pressed in the multiline description', async () => {
    const { getByLabelText } = await renderWithProviders(<SectionForm mode='create' />)

    fireEvent.changeText(getByLabelText('Описание'), 'Описание')
    await waitFor(() => expect(getByLabelText('Описание').props.value).toBe('Описание'))
    fireEvent(getByLabelText('Описание'), 'submitEditing')

    expect(mockCreate).not.toHaveBeenCalled()
  })

  test('disables the save button until the form is dirty', async () => {
    const { getByLabelText, getByRole } = await renderWithProviders(<SectionForm mode='create' />)

    const saveButton = await waitFor(() => getByRole('button', { name: SAVE_LABEL }))
    expect(saveButton).toBeDisabled()

    fireEvent.changeText(getByLabelText('Название'), 'Новый раздел')

    await waitFor(() => expect(getByRole('button', { name: SAVE_LABEL })).toBeEnabled())
  })

  test('keeps the save button disabled for a pristine edit form', async () => {
    const initial = sectionsMocks.getSectionControllerFindOneResponseMock({ title: 'Раздел' })

    const { getByRole } = await renderWithProviders(
      <SectionForm mode='edit' id='section-1' initial={initial} />,
    )

    const saveButton = await waitFor(() => getByRole('button', { name: SAVE_LABEL }))
    expect(saveButton).toBeDisabled()
  })

  test('edit submits playlistsIds from the initial section', async () => {
    const initial = sectionsMocks.getSectionControllerFindOneResponseMock({ title: 'Раздел' })
    const playlistIds = initial.playlists.map(playlist => playlist.id)

    const { getByLabelText, getByRole } = await renderWithProviders(
      <SectionForm mode='edit' id='section-1' initial={initial} />,
    )

    fireEvent.changeText(getByLabelText('Название'), 'Раздел обновлён')
    await waitFor(() => expect(getByLabelText('Название').props.value).toBe('Раздел обновлён'))

    fireEvent.press(await waitFor(() => getByRole('button', { name: SAVE_LABEL })))

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(mockUpdate).toHaveBeenCalledWith(
      'section-1',
      expect.objectContaining({ playlistsIds: playlistIds }),
    )
  })

  test('does not submit an empty title', async () => {
    const { getByLabelText, getByRole } = await renderWithProviders(<SectionForm mode='create' />)

    fireEvent.changeText(getByLabelText('Описание'), 'Описание')
    await waitFor(() => expect(getByLabelText('Описание').props.value).toBe('Описание'))

    fireEvent.press(await waitFor(() => getByRole('button', { name: SAVE_LABEL })))

    expect(mockCreate).not.toHaveBeenCalled()
  })
})

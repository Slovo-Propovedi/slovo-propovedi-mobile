import { CoverPicker, FileUploadField } from 'widgets/admin-form-pickers'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { EditableUrlField } from 'shared/ui/form'
import { type SermonFormValues } from '../lib/sermonFormInitialValues'
import { SermonMediaFields } from './SermonMediaFields'

jest.mock('widgets/admin-form-pickers', () => ({
  CoverPicker: jest.fn(() => null),
  FileUploadField: jest.fn(() => null),
}))

jest.mock('shared/ui/form', () => ({ EditableUrlField: jest.fn(() => null) }))

const mockedCoverPicker = CoverPicker as jest.MockedFunction<typeof CoverPicker>
const mockedFileUploadField = FileUploadField as jest.MockedFunction<typeof FileUploadField>
const mockedEditableUrlField = EditableUrlField as jest.MockedFunction<typeof EditableUrlField>

const VALUES: SermonFormValues = {
  artist: '',
  artwork: '',
  audioUrl: '',
  book: '',
  chapterEnd: '',
  chapterStart: '',
  description: '',
  selectedPlaylistIds: [],
  textFileUrl: '',
  title: '',
  verseEnd: '',
  verseStart: '',
  verseText: '',
  youtubeUrl: '',
}

const IDLE_STATUS = { currentFileName: null, error: null, isUploading: false, progress: 0 }
const COVER_URL = 'https://cdn.test/cover.png'
const AUDIO_URL = 'https://cdn.test/a.m4a'
const TEXT_URL = 'https://cdn.test/a.pdf'
const YOUTUBE_URL = 'https://youtu.be/abc'

const renderFields = (values: SermonFormValues, onChange = jest.fn()) =>
  renderWithProviders(
    <SermonMediaFields values={values} onChange={onChange} status={IDLE_STATUS} />,
  )

const fileFieldProps = (kind: 'audio' | 'text') =>
  mockedFileUploadField.mock.calls.find(([props]) => props.kind === kind)?.[0]

describe('<SermonMediaFields>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders the cover, youtube, audio and text fields with the form values', async () => {
    const values = {
      ...VALUES,
      artwork: COVER_URL,
      audioUrl: AUDIO_URL,
      textFileUrl: TEXT_URL,
      youtubeUrl: YOUTUBE_URL,
    }
    await renderFields(values)

    expect(mockedCoverPicker.mock.calls[0][0].value).toBe(values.artwork)
    expect(fileFieldProps('audio')?.value).toBe(values.audioUrl)
    expect(fileFieldProps('text')?.value).toBe(values.textFileUrl)
    expect(mockedEditableUrlField.mock.calls[0][0].value).toBe(values.youtubeUrl)
  })

  test('routes cover, audio, text and youtube changes into their form fields', async () => {
    const onChange = jest.fn()
    await renderFields(VALUES, onChange)

    mockedCoverPicker.mock.calls[0][0].onChange(COVER_URL)
    fileFieldProps('audio')?.onChange(AUDIO_URL)
    fileFieldProps('text')?.onChange(TEXT_URL)
    mockedEditableUrlField.mock.calls[0][0].onChangeText(YOUTUBE_URL)

    expect(onChange).toHaveBeenCalledWith('artwork', COVER_URL)
    expect(onChange).toHaveBeenCalledWith('audioUrl', AUDIO_URL)
    expect(onChange).toHaveBeenCalledWith('textFileUrl', TEXT_URL)
    expect(onChange).toHaveBeenCalledWith('youtubeUrl', YOUTUBE_URL)
  })
})

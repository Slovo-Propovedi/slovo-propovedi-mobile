import { ImportFromYoutube } from 'features/sermon-audio-import'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { type SermonFormValues } from '../lib/sermonFormInitialValues'
import { SermonMediaFields } from './SermonMediaFields'

jest.mock('widgets/admin-form-pickers', () => ({
  CoverPicker: () => null,
  FileUploadField: () => null,
}))

jest.mock('features/sermon-audio-import', () => ({
  ImportFromYoutube: jest.fn(() => null),
}))

jest.mock('shared/ui/form', () => ({ EditableUrlField: () => null }))

const mockedImportFromYoutube = ImportFromYoutube as jest.MockedFunction<typeof ImportFromYoutube>

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

const renderFields = (values: SermonFormValues, onChange = jest.fn()) =>
  renderWithProviders(<SermonMediaFields values={values} onChange={onChange} />)

const lastImportProps = () => mockedImportFromYoutube.mock.calls[0][0]

describe('<SermonMediaFields>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('tells the import block that audio is already attached', async () => {
    await renderFields({ ...VALUES, audioUrl: 'https://cdn.test/a.m4a' })

    expect(lastImportProps().hasAudio).toBe(true)
  })

  test('marks hasAudio false when there is no audio file', async () => {
    await renderFields(VALUES)

    expect(lastImportProps().hasAudio).toBe(false)
  })

  test('routes metadata and audio callbacks into their form fields', async () => {
    const onChange = jest.fn()
    await renderFields(VALUES, onChange)

    const props = lastImportProps()
    props.onMetadata({ description: 'Текст проповеди', title: 'Проповедь о покаянии' })
    props.onAudioImported('https://cdn.test/b.m4a')

    expect(onChange).toHaveBeenCalledWith('description', 'Текст проповеди')
    expect(onChange).toHaveBeenCalledWith('title', 'Проповедь о покаянии')
    expect(onChange).toHaveBeenCalledWith('audioUrl', 'https://cdn.test/b.m4a')
  })
})

import { fireEvent, screen } from '@testing-library/react-native'
import { ImportAudioPanel } from 'features/sermon-audio-import'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { type SermonFormValues } from '../lib/sermonFormInitialValues'
import { ImportAccordionSection } from './ImportAccordionSection'

jest.mock('features/sermon-audio-import', () => ({
  ImportAudioPanel: jest.fn(() => null),
}))

const mockedPanel = ImportAudioPanel as jest.MockedFunction<typeof ImportAudioPanel>
const TITLE_PATTERN = /Импорт аудио/

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

const renderAccordion = (values: SermonFormValues = VALUES, onChange = jest.fn()) =>
  renderWithProviders(<ImportAccordionSection values={values} onChange={onChange} />)

const toggleAccordion = () => fireEvent.press(screen.getByRole('button', { name: TITLE_PATTERN }))

describe('<ImportAccordionSection>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('is collapsed by default and mounts the panel only after expanding', async () => {
    await renderAccordion()

    expect(mockedPanel).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: TITLE_PATTERN })).not.toBeExpanded()

    await toggleAccordion()

    expect(screen.getByRole('button', { name: TITLE_PATTERN })).toBeExpanded()
    expect(mockedPanel).toHaveBeenCalledTimes(1)
  })

  test('forwards the form values and callbacks to the panel', async () => {
    const onChange = jest.fn()
    const values = {
      ...VALUES,
      audioUrl: 'https://cdn.test/a.m4a',
      youtubeUrl: 'https://youtu.be/abc',
    }
    await renderAccordion(values, onChange)
    await toggleAccordion()

    const props = mockedPanel.mock.calls[0][0]
    expect(props).toMatchObject({
      disabled: false,
      hasAudio: true,
      youtubeUrl: values.youtubeUrl,
    })

    props.onMetadata({ description: null, title: 'Проповедь о покаянии' })
    props.onAudioImported('https://cdn.test/b.m4a')

    expect(onChange).toHaveBeenCalledWith('description', '')
    expect(onChange).toHaveBeenCalledWith('title', 'Проповедь о покаянии')
    expect(onChange).toHaveBeenCalledWith('audioUrl', 'https://cdn.test/b.m4a')
  })
})

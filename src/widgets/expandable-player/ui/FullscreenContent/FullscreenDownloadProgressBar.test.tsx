import { createCtx } from '@reatom/framework'
import { downloadingAudioUrlAtom, downloadProgressAtom, isDownloadingAtom } from 'entities/player'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { FullscreenDownloadProgressBar } from './FullscreenDownloadProgressBar'

// The hook under test (useDownloadProgressForUrl) imports these atoms directly from
// 'entities/player/lib/download-model'. The factory must reuse the ACTUAL atom instances
// via jest.requireActual — creating fresh atoms here would break identity, and the hook
// would subscribe to different atoms than the test writes to.
jest.mock('entities/player', () => {
  const downloadModel = jest.requireActual('entities/player/lib/download-model')
  const { Text } = jest.requireActual('react-native')
  return {
    downloadingAudioUrlAtom: downloadModel.downloadingAudioUrlAtom,
    downloadProgressAtom: downloadModel.downloadProgressAtom,
    isDownloadingAtom: downloadModel.isDownloadingAtom,
    PlayerProgressBar: ({ downloadProgress }: { downloadProgress?: number }) => (
      <Text>{String(downloadProgress ?? 0)}</Text>
    ),
  }
})

const AUDIO_URL = 'https://example.com/audio.mp3'
const OTHER_URL = 'https://example.com/other.mp3'

const renderBar = (ctx: ReturnType<typeof createCtx>) =>
  renderWithProviders(
    <FullscreenDownloadProgressBar position={500} duration={1000} audioUrl={AUDIO_URL} />,
    { ctx },
  )

describe('<FullscreenDownloadProgressBar>', () => {
  test('passes 0 when nothing is downloading', async () => {
    const ctx = createCtx()

    const { getByText } = await renderBar(ctx)

    expect(getByText('0')).toBeTruthy()
  })

  test('passes 0 when a different URL is downloading', async () => {
    const ctx = createCtx()
    isDownloadingAtom(ctx, true)
    downloadingAudioUrlAtom(ctx, OTHER_URL)
    downloadProgressAtom(ctx, 0.5)

    const { getByText } = await renderBar(ctx)

    expect(getByText('0')).toBeTruthy()
  })

  test('passes the download fraction for the matching URL', async () => {
    const ctx = createCtx()
    isDownloadingAtom(ctx, true)
    downloadingAudioUrlAtom(ctx, AUDIO_URL)
    downloadProgressAtom(ctx, 0.5)

    const { getByText } = await renderBar(ctx)

    expect(getByText('0.5')).toBeTruthy()
  })
})

import { createCtx } from '@reatom/framework'
import { downloadingAudioUrlAtom, downloadProgressAtom, isDownloadingAtom } from 'entities/player'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { LightTheme } from 'shared/ui/theme'
import type { TestInstance } from 'test-renderer'
import { MiniDownloadProgress } from './MiniDownloadProgress'
import { createMiniStyles } from './miniStyles'

jest.mock('entities/player', () => {
  const downloadModel = jest.requireActual('entities/player/lib/download-model')
  return {
    downloadingAudioUrlAtom: downloadModel.downloadingAudioUrlAtom,
    downloadProgressAtom: downloadModel.downloadProgressAtom,
    isDownloadingAtom: downloadModel.isDownloadingAtom,
  }
})

const AUDIO_URL = 'https://example.com/audio.mp3'
const OTHER_URL = 'https://example.com/other.mp3'

const renderLeaf = (ctx: ReturnType<typeof createCtx>) =>
  renderWithProviders(
    <MiniDownloadProgress
      audioUrl={AUDIO_URL}
      currentTheme={LightTheme}
      miniStyles={createMiniStyles(LightTheme, 0, 400)}
    />,
    { ctx },
  )

const queryProgressFill = (container: TestInstance, progress: number) =>
  container.queryAll(node => {
    const style = node.props.style
    if (!Array.isArray(style)) return false
    return style.some((s: { width?: string } | null) => s?.width === `${progress * 100}%`)
  })

describe('<MiniDownloadProgress>', () => {
  test('renders no progress when nothing is downloading', async () => {
    const ctx = createCtx()

    const { container } = await renderLeaf(ctx)

    expect(queryProgressFill(container, 0.5)).toHaveLength(0)
  })

  test('renders no progress when a different URL is downloading', async () => {
    const ctx = createCtx()
    isDownloadingAtom(ctx, true)
    downloadingAudioUrlAtom(ctx, OTHER_URL)
    downloadProgressAtom(ctx, 0.5)

    const { container } = await renderLeaf(ctx)

    expect(queryProgressFill(container, 0.5)).toHaveLength(0)
  })

  test('renders the download fraction for the matching URL', async () => {
    const ctx = createCtx()
    isDownloadingAtom(ctx, true)
    downloadingAudioUrlAtom(ctx, AUDIO_URL)
    downloadProgressAtom(ctx, 0.5)

    const { container } = await renderLeaf(ctx)

    expect(queryProgressFill(container, 0.5)).toHaveLength(1)
  })
})

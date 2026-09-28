import { act, fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { isOnlineAtom } from 'shared/model'
import type { TrackCacheVisualState } from 'entities/offline-cache'
import type { PlaybackRate } from 'entities/player'
import type { TestInstance } from 'test-renderer'
import { PlayerMenu } from './PlayerMenu'
import { PlayerMenuItems } from './PlayerMenuItems'
import { PlayerSpeedMenu } from './PlayerSpeedMenu'

const mockOnClose = jest.fn()
const mockOnShowDetails = jest.fn()
const mockOnToggleCache = jest.fn()
const mockSetPlaybackRate = jest.fn().mockResolvedValue(undefined)
const mockOnShowSpeed = jest.fn()
const mockOnOpenSoundSettings = jest.fn()
const mockOnSelect = jest.fn()
const mockOnBack = jest.fn()

const CLOUD_STATE: TrackCacheVisualState = 'cloud'

jest.mock('entities/player', () => ({
  PLAYBACK_RATES: [0.75, 1, 1.25, 1.5, 2],
  usePlaybackRate: () => ({ rate: 1, setPlaybackRate: mockSetPlaybackRate }),
}))

const SPEED_LABEL = 'Скорость воспроизведения'
const SOUND_SETTINGS_LABEL = 'Настройки звука'

const triggerOnLayout = async (container: TestInstance) => {
  const layoutView = container.queryAll(node => node.props.onLayout !== undefined, {
    includeSelf: true,
  })[0]
  await act(async () => {
    fireEvent(layoutView, 'layout', {
      nativeEvent: { layout: { height: 200, width: 200, x: 0, y: 0 } },
    })
  })
}

describe('<PlayerMenu>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSetPlaybackRate.mockResolvedValue(undefined)
  })

  test('renders without crashing', async () => {
    const { toJSON } = await renderWithProviders(
      <PlayerMenu
        onClose={mockOnClose}
        visualState={CLOUD_STATE}
        onShowDetails={mockOnShowDetails}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  test('selecting a rate calls setPlaybackRate before onClose', async () => {
    const { container, getByText } = await renderWithProviders(
      <PlayerMenu
        onClose={mockOnClose}
        visualState={CLOUD_STATE}
        onShowDetails={mockOnShowDetails}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )

    await triggerOnLayout(container)

    const speedButton = await getByText(SPEED_LABEL)
    await act(async () => {
      fireEvent.press(speedButton)
    })

    const rate15 = await getByText('1.5x')
    await act(async () => {
      fireEvent.press(rate15)
    })

    expect(mockSetPlaybackRate).toHaveBeenCalledTimes(1)
    expect(mockSetPlaybackRate).toHaveBeenCalledWith(1.5)
    expect(mockOnClose).toHaveBeenCalledTimes(1)

    const setRateOrder = mockSetPlaybackRate.mock.invocationCallOrder[0]
    const onCloseOrder = mockOnClose.mock.invocationCallOrder[0]
    expect(setRateOrder).toBeLessThan(onCloseOrder)
  })

  test('pressing sound settings opens the sheet, then closes the menu', async () => {
    const { container, getByText } = await renderWithProviders(
      <PlayerMenu
        onClose={mockOnClose}
        visualState={CLOUD_STATE}
        onShowDetails={mockOnShowDetails}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )

    await triggerOnLayout(container)

    await act(async () => {
      fireEvent.press(getByText(SOUND_SETTINGS_LABEL))
    })

    expect(mockOnOpenSoundSettings).toHaveBeenCalledTimes(1)

    const openOrder = mockOnOpenSoundSettings.mock.invocationCallOrder[0]
    const onCloseOrder = mockOnClose.mock.invocationCallOrder[0]
    expect(openOrder).toBeLessThan(onCloseOrder)
  })
})

describe('<PlayerMenuItems>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('shows speed row with current rate', async () => {
    const { getByText } = await renderWithProviders(
      <PlayerMenuItems
        rate={1}
        visualState={CLOUD_STATE}
        onDetails={mockOnShowDetails}
        onShowSpeed={mockOnShowSpeed}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )
    expect(getByText('Скорость воспроизведения')).toBeTruthy()
    expect(getByText('1x')).toBeTruthy()
  })

  test('shows non-1 rate value correctly', async () => {
    const { getByText } = await renderWithProviders(
      <PlayerMenuItems
        rate={1.5}
        visualState={CLOUD_STATE}
        onDetails={mockOnShowDetails}
        onShowSpeed={mockOnShowSpeed}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )
    expect(getByText('1.5x')).toBeTruthy()
  })

  test('pressing speed row calls onShowSpeed', async () => {
    const { getByRole } = await renderWithProviders(
      <PlayerMenuItems
        rate={1}
        visualState={CLOUD_STATE}
        onDetails={mockOnShowDetails}
        onShowSpeed={mockOnShowSpeed}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )
    fireEvent.press(getByRole('button', { name: SPEED_LABEL }))
    expect(mockOnShowSpeed).toHaveBeenCalledTimes(1)
  })

  test('sound settings row is active and calls onOpenSoundSettings', async () => {
    const { getByRole } = await renderWithProviders(
      <PlayerMenuItems
        rate={1}
        visualState={CLOUD_STATE}
        onDetails={mockOnShowDetails}
        onShowSpeed={mockOnShowSpeed}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )
    fireEvent.press(getByRole('button', { name: SOUND_SETTINGS_LABEL }))
    expect(mockOnOpenSoundSettings).toHaveBeenCalledTimes(1)
  })

  test('pressing details calls onDetails', async () => {
    const { getByText } = await renderWithProviders(
      <PlayerMenuItems
        rate={1}
        visualState={CLOUD_STATE}
        onDetails={mockOnShowDetails}
        onShowSpeed={mockOnShowSpeed}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )
    fireEvent.press(getByText('Подробнее'))
    expect(mockOnShowDetails).toHaveBeenCalledTimes(1)
  })

  test('does not call onToggleCache when offline and not cached', async () => {
    const { ctx, getByText } = await renderWithProviders(
      <PlayerMenuItems
        rate={1}
        visualState={CLOUD_STATE}
        onDetails={mockOnShowDetails}
        onShowSpeed={mockOnShowSpeed}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )
    await act(async () => {
      isOnlineAtom(ctx, false)
    })
    fireEvent.press(getByText('Добавить в офлайн'))
    expect(mockOnToggleCache).not.toHaveBeenCalled()
  })

  test('calls onToggleCache when offline and cached (remove)', async () => {
    const { ctx, getByText } = await renderWithProviders(
      <PlayerMenuItems
        rate={1}
        isCached
        visualState='cached'
        onDetails={mockOnShowDetails}
        onShowSpeed={mockOnShowSpeed}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )
    await act(async () => {
      isOnlineAtom(ctx, false)
    })
    fireEvent.press(getByText('Удалить из офлайн'))
    expect(mockOnToggleCache).toHaveBeenCalledTimes(1)
  })

  test('shows stop caching label when downloading', async () => {
    const { getByText } = await renderWithProviders(
      <PlayerMenuItems
        rate={1}
        visualState='downloading'
        onDetails={mockOnShowDetails}
        onShowSpeed={mockOnShowSpeed}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )
    expect(getByText('Остановить добавление в офлайн')).toBeTruthy()
  })

  test('shows remove from queue label when queued', async () => {
    const { getByText } = await renderWithProviders(
      <PlayerMenuItems
        rate={1}
        visualState='queued'
        onDetails={mockOnShowDetails}
        onShowSpeed={mockOnShowSpeed}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )
    expect(getByText('Убрать из очереди')).toBeTruthy()
  })

  test('stop caching stays enabled when offline', async () => {
    const { ctx, getByText } = await renderWithProviders(
      <PlayerMenuItems
        rate={1}
        visualState='downloading'
        onDetails={mockOnShowDetails}
        onShowSpeed={mockOnShowSpeed}
        onToggleCache={mockOnToggleCache}
        onOpenSoundSettings={mockOnOpenSoundSettings}
      />,
    )
    await act(async () => {
      isOnlineAtom(ctx, false)
    })
    fireEvent.press(getByText('Остановить добавление в офлайн'))
    expect(mockOnToggleCache).toHaveBeenCalledTimes(1)
  })
})

describe('<PlayerSpeedMenu>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const RATE_LIST: PlaybackRate[] = [0.75, 1, 1.25, 1.5, 2]

  test('shows all rates', async () => {
    const { getByText } = await renderWithProviders(
      <PlayerSpeedMenu currentRate={1} onBack={mockOnBack} onSelect={mockOnSelect} />,
    )
    for (const rate of RATE_LIST) expect(getByText(`${rate}x`)).toBeTruthy()
  })

  test('back button calls onBack', async () => {
    const { getByLabelText } = await renderWithProviders(
      <PlayerSpeedMenu currentRate={1} onBack={mockOnBack} onSelect={mockOnSelect} />,
    )
    fireEvent.press(getByLabelText('Назад'))
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  test('selecting a rate calls onSelect with that rate', async () => {
    const { getByText } = await renderWithProviders(
      <PlayerSpeedMenu currentRate={1} onBack={mockOnBack} onSelect={mockOnSelect} />,
    )
    fireEvent.press(getByText('1.5x'))
    expect(mockOnSelect).toHaveBeenCalledWith(1.5)
  })

  test('selecting current rate still calls onSelect', async () => {
    const { getByText } = await renderWithProviders(
      <PlayerSpeedMenu currentRate={1} onBack={mockOnBack} onSelect={mockOnSelect} />,
    )
    fireEvent.press(getByText('1x'))
    expect(mockOnSelect).toHaveBeenCalledWith(1)
  })

  test('active rate row has selected state', async () => {
    const { getByLabelText } = await renderWithProviders(
      <PlayerSpeedMenu currentRate={1} onBack={mockOnBack} onSelect={mockOnSelect} />,
    )
    const activeRow = getByLabelText('Скорость 1x')
    expect(activeRow).toBeSelected()

    const inactiveRow = getByLabelText('Скорость 1.5x')
    expect(inactiveRow).not.toBeSelected()
  })
})

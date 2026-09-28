import { fireEvent } from '@testing-library/react-native'
import { openAudioOutputSwitcher } from 'audio-effects'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import type { ReactNode } from 'react'
import { SoundSettingsBottomSheet } from './SoundSettingsBottomSheet'

jest.mock('@gorhom/bottom-sheet', () => {
  const { View } = jest.requireActual('react-native')
  const BottomSheet = ({ children }: { children: ReactNode }) => <View>{children}</View>
  const BottomSheetScrollView = ({ children }: { children: ReactNode }) => <View>{children}</View>

  return {
    __esModule: true,
    BottomSheetBackdrop: () => null,
    BottomSheetScrollView,
    default: BottomSheet,
  }
})

const mockSetVolume = jest.fn()
const mockApplyVolume = jest.fn()
const mockSetBalance = jest.fn()
const mockApplyBalance = jest.fn()
const mockSetEqEnabled = jest.fn()
const mockSetEqBandGain = jest.fn()
const mockApplyEqBandGain = jest.fn()
const mockSetPitch = jest.fn()
const mockApplyPitch = jest.fn()
const mockOnClose = jest.fn()
const mockVolume = 0.8

const createAudioSettings = (overrides: Record<string, unknown> = {}) => ({
  applyBalance: mockApplyBalance,
  applyEqBandGain: mockApplyEqBandGain,
  applyPitch: mockApplyPitch,
  balance: 0,
  bandCount: 5,
  eqEnabled: true,
  eqGains: [0, 0, 0, 0, 0],
  eqInfo: {
    balanceSupported: true,
    bandCount: 5,
    bandFrequencies: [60, 230, 1000, 4000, 12000],
    bandRange: [-15, 15] as [number, number],
    eqSupported: true,
    outputSwitcherSupported: true,
    pitchSupported: true,
  },
  isEffectsSupported: true,
  pitch: 1,
  setBalance: mockSetBalance,
  setEqBandGain: mockSetEqBandGain,
  setEqEnabled: mockSetEqEnabled,
  setPitch: mockSetPitch,
  ...overrides,
})

let mockAudioSettings = createAudioSettings()

jest.mock('entities/player', () => ({
  useAudioSettings: () => mockAudioSettings,
  usePlayer: () => ({ applyVolume: mockApplyVolume, setVolume: mockSetVolume }),
  useVolume: () => mockVolume,
}))

const TITLE = 'Настройки звука'
const OUTPUT_LABEL = 'Выбрать устройство вывода'

const renderSheet = () => renderWithProviders(<SoundSettingsBottomSheet onClose={mockOnClose} />)

describe('<SoundSettingsBottomSheet>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAudioSettings = createAudioSettings()
  })

  test('slider step applies live and persists on commit', async () => {
    const { getByRole } = await renderSheet()

    const fireStep = (label: string) =>
      getByRole('adjustable', { name: label }).props.onAccessibilityAction({
        nativeEvent: { actionName: 'increment' },
      })

    fireStep('Громкость')
    fireStep('Баланс')
    fireStep('Высота тона')

    expect(mockApplyVolume).toHaveBeenCalledWith(0.85)
    expect(mockSetVolume).toHaveBeenCalledWith(0.85)
    expect(mockApplyBalance).toHaveBeenCalledWith(0.05)
    expect(mockSetBalance).toHaveBeenCalledWith(0.05)
    expect(mockApplyPitch).toHaveBeenCalledWith(1.05)
    expect(mockSetPitch).toHaveBeenCalledWith(1.05)
  })

  test('renders the title with the volume section', async () => {
    const { getByText } = await renderSheet()

    expect(getByText(TITLE)).toBeTruthy()
    expect(getByText('Громкость')).toBeTruthy()
    expect(getByText('80%')).toBeTruthy()
  })

  test('hides effect sections when capabilities are missing', async () => {
    mockAudioSettings = createAudioSettings({ eqInfo: null, isEffectsSupported: false })
    const { getByText, queryByText } = await renderSheet()

    expect(getByText('Громкость')).toBeTruthy()
    expect(queryByText('Баланс')).toBeNull()
    expect(queryByText('Эквалайзер')).toBeNull()
    expect(queryByText('Высота тона')).toBeNull()
  })

  test('renders effect sections, presets and band labels when supported', async () => {
    const { getByText } = await renderSheet()

    expect(getByText('Баланс')).toBeTruthy()
    expect(getByText('Центр')).toBeTruthy()
    expect(getByText('Левый')).toBeTruthy()
    expect(getByText('Правый')).toBeTruthy()
    expect(getByText('Эквалайзер')).toBeTruthy()
    expect(getByText('Высота тона')).toBeTruthy()
    expect(getByText('Ровно')).toBeTruthy()
    expect(getByText('Голос')).toBeTruthy()
    expect(getByText('Бас')).toBeTruthy()
    expect(getByText('Высокие')).toBeTruthy()
    expect(getByText('60 Гц')).toBeTruthy()
    expect(getByText('1 кГц')).toBeTruthy()
  })

  test('output row opens the native output switcher', async () => {
    const { getByRole } = await renderSheet()

    await fireEvent.press(getByRole('button', { name: OUTPUT_LABEL }))

    expect(jest.mocked(openAudioOutputSwitcher)).toHaveBeenCalledTimes(1)
  })

  test('hides the output row when the switcher is unsupported', async () => {
    mockAudioSettings = createAudioSettings({
      eqInfo: { ...createAudioSettings().eqInfo, outputSwitcherSupported: false },
    })
    const { queryByRole } = await renderSheet()

    expect(queryByRole('button', { name: OUTPUT_LABEL })).toBeNull()
  })

  test('volume reset restores full volume', async () => {
    const { getByRole } = await renderSheet()

    await fireEvent.press(getByRole('button', { name: 'Сбросить: Громкость' }))

    expect(mockSetVolume).toHaveBeenCalledWith(1)
  })

  test('balance and pitch resets restore defaults', async () => {
    const { getByRole } = await renderSheet()

    // Awaits are required: un-awaited fireEvent calls nest overlapping act()
    // scopes, which breaks every subsequent async render in the suite.
    await fireEvent.press(getByRole('button', { name: 'Сбросить: Баланс' }))
    await fireEvent.press(getByRole('button', { name: 'Сбросить: Высота тона' }))

    expect(mockSetBalance).toHaveBeenCalledWith(0)
    expect(mockSetPitch).toHaveBeenCalledWith(1)
  })

  test('slider step applies live and persists on commit', async () => {
    const { getByRole } = await renderSheet()

    const fireStep = (label: string) =>
      getByRole('adjustable', { name: label }).props.onAccessibilityAction({
        nativeEvent: { actionName: 'increment' },
      })

    fireStep('Громкость')
    fireStep('Баланс')
    fireStep('Высота тона')

    expect(mockApplyVolume).toHaveBeenCalledWith(0.85)
    expect(mockSetVolume).toHaveBeenCalledWith(0.85)
    expect(mockApplyBalance).toHaveBeenCalledWith(0.05)
    expect(mockSetBalance).toHaveBeenCalledWith(0.05)
    expect(mockApplyPitch).toHaveBeenCalledWith(1.05)
    expect(mockSetPitch).toHaveBeenCalledWith(1.05)
  })

  test('eq band slider step applies live and persists on commit', async () => {
    const { getByRole } = await renderSheet()

    getByRole('adjustable', { name: 'Эквалайзер: 60 Гц' }).props.onAccessibilityAction({
      nativeEvent: { actionName: 'increment' },
    })

    expect(mockApplyEqBandGain).toHaveBeenCalledWith(0, 1)
    expect(mockSetEqBandGain).toHaveBeenCalledWith(0, 1)
  })
})

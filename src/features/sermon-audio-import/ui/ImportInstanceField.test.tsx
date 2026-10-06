import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { ImportInstanceField } from './ImportInstanceField'

const DEFAULT_INSTANCE = 'https://inv.phobos.observer'
const ALT_INSTANCE = 'https://invidious.f5.si'
const BACKEND_INSTANCE = 'https://backend.example'
const LOCAL_INSTANCE = 'http://192.168.1.10:8080'
const INSTANCE_LABEL = 'Инстанс Invidious'

const PRESETS = [DEFAULT_INSTANCE, ALT_INSTANCE]

const mockOnChange = jest.fn()

const renderField = async (
  invidiousBaseUrl = DEFAULT_INSTANCE,
  presets: readonly string[] = PRESETS,
) =>
  renderWithProviders(
    <ImportInstanceField
      presets={presets}
      onChange={mockOnChange}
      invidiousBaseUrl={invidiousBaseUrl}
    />,
  )

describe('<ImportInstanceField>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('marks the stored instance as selected', async () => {
    await renderField(ALT_INSTANCE)

    expect(screen.getByRole('button', { name: 'invidious.f5.si' })).toBeSelected()
    expect(screen.getByRole('button', { name: 'inv.phobos.observer' })).not.toBeSelected()
  })

  test('reports the tapped preset', async () => {
    await renderField()

    fireEvent.press(screen.getByRole('button', { name: 'invidious.f5.si' }))

    expect(mockOnChange).toHaveBeenCalledWith(ALT_INSTANCE)
  })

  test('renders the chips supplied by the backend', async () => {
    await renderField(DEFAULT_INSTANCE, [BACKEND_INSTANCE])

    fireEvent.press(screen.getByRole('button', { name: 'backend.example' }))

    expect(mockOnChange).toHaveBeenCalledWith(BACKEND_INSTANCE)
  })

  test('commits a custom instance on blur', async () => {
    await renderField()

    // Элемент перезапрашивается после ввода: fireEvent работает со снимком
    // дерева, а после changeText хендлер blur уже новый (с черновиком).
    await fireEvent.changeText(screen.getByLabelText(INSTANCE_LABEL), ` ${LOCAL_INSTANCE} `)
    fireEvent(screen.getByLabelText(INSTANCE_LABEL), 'blur')

    expect(mockOnChange).toHaveBeenCalledWith(LOCAL_INSTANCE)
  })

  test('adds a scheme to a bare lan host on blur', async () => {
    await renderField()

    await fireEvent.changeText(screen.getByLabelText(INSTANCE_LABEL), ' 192.168.1.10:8080 ')
    fireEvent(screen.getByLabelText(INSTANCE_LABEL), 'blur')

    expect(mockOnChange).toHaveBeenCalledWith(LOCAL_INSTANCE)
  })

  test('discards an uncommitted draft when a preset is tapped', async () => {
    await renderField()

    await fireEvent.changeText(screen.getByLabelText(INSTANCE_LABEL), 'черновик инстанса')
    fireEvent.press(screen.getByRole('button', { name: 'invidious.f5.si' }))

    expect(mockOnChange).toHaveBeenCalledTimes(1)
    expect(mockOnChange).toHaveBeenCalledWith(ALT_INSTANCE)
  })

  test('keeps the stored instance when the field was not changed', async () => {
    await renderField()

    fireEvent(screen.getByLabelText(INSTANCE_LABEL), 'blur')

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  test('ignores an empty custom instance', async () => {
    await renderField()

    await fireEvent.changeText(screen.getByLabelText(INSTANCE_LABEL), '   ')
    fireEvent(screen.getByLabelText(INSTANCE_LABEL), 'blur')

    expect(mockOnChange).not.toHaveBeenCalled()
  })
})

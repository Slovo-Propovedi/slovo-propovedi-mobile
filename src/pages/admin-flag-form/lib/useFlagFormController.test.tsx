import { act } from '@testing-library/react-native'
import { featureFlagsMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { useFlagFormController } from './useFlagFormController'

const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockBack = jest.fn()

jest.mock('shared/api', () => ({
  featureFlagsApi: {
    getFeatureFlags: () => ({
      featureFlagsControllerCreate: mockCreate,
      featureFlagsControllerUpdate: mockUpdate,
    }),
  },
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}))

const createFlag = () =>
  featureFlagsMocks.getFeatureFlagsControllerCreateResponseMock({
    enabled: false,
    id: 'flag-1',
    key: 'read',
    title: 'Читать',
  })

describe('useFlagFormController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreate.mockResolvedValue(createFlag())
    mockUpdate.mockResolvedValue(featureFlagsMocks.getFeatureFlagsControllerUpdateResponseMock())
  })

  test('create sends key and title without an update when disabled', async () => {
    const { result } = await renderHookWithProviders(() =>
      useFlagFormController({ mode: 'create' }),
    )

    await act(async () => {
      result.current.onChange('key', 'study')
      result.current.onChange('title', 'Учиться')
    })
    await act(async () => {
      await result.current.save()
    })

    expect(mockCreate).toHaveBeenCalledWith({ key: 'study', title: 'Учиться' })
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalled()
  })

  test('create enables the flag with a follow-up update when toggled on', async () => {
    const { result } = await renderHookWithProviders(() =>
      useFlagFormController({ mode: 'create' }),
    )

    await act(async () => {
      result.current.onChange('key', 'study')
      result.current.onChange('title', 'Учиться')
      result.current.onChange('enabled', true)
    })
    await act(async () => {
      await result.current.save()
    })

    expect(mockCreate).toHaveBeenCalledWith({ key: 'study', title: 'Учиться' })
    expect(mockUpdate).toHaveBeenCalledWith('flag-1', { enabled: true })
  })

  test('create blocks an invalid key before any request', async () => {
    const { result } = await renderHookWithProviders(() =>
      useFlagFormController({ mode: 'create' }),
    )

    await act(async () => {
      result.current.onChange('key', 'Bad Key')
      result.current.onChange('title', 'Учиться')
    })
    await act(async () => {
      await result.current.save()
    })

    expect(mockCreate).not.toHaveBeenCalled()
    expect(result.current.error).toBe(
      'Ключ: строчные латинские буквы, цифры и дефис, начинается с буквы.',
    )
  })

  test('edit sends only changed title/enabled (no key)', async () => {
    const initial = createFlag()
    const { result } = await renderHookWithProviders(() =>
      useFlagFormController({ id: 'flag-1', initial, mode: 'edit' }),
    )

    await act(async () => {
      result.current.onChange('title', 'Читать книги')
      result.current.onChange('enabled', true)
    })
    await act(async () => {
      await result.current.save()
    })

    expect(mockUpdate).toHaveBeenCalledWith('flag-1', {
      enabled: true,
      title: 'Читать книги',
    })
    expect(mockUpdate.mock.calls[0][1]).not.toHaveProperty('key')
  })

  test('edit navigates back without a request when nothing changed', async () => {
    const initial = createFlag()
    const { result } = await renderHookWithProviders(() =>
      useFlagFormController({ id: 'flag-1', initial, mode: 'edit' }),
    )

    await act(async () => {
      await result.current.save()
    })

    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalled()
  })
})

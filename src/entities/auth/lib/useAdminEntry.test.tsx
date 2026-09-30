import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { useRouter } from 'expo-router'
import { authMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { authStatusAtom, authUserAtom } from '../model'
import { restoreSession } from './restoreSession'
import { useAdminEntry } from './useAdminEntry'

jest.mock('expo-router', () => ({ useRouter: jest.fn() }))
jest.mock('./restoreSession', () => ({ restoreSession: jest.fn() }))

const mockedUseRouter = jest.mocked(useRouter)
const mockedRestoreSession = jest.mocked(restoreSession)
const mockPush = jest.fn()

const renderEntry = () => renderHookWithProviders(() => useAdminEntry())

describe('useAdminEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>)
  })

  test('restores the session when idle and pushes /admin for an admin user', async () => {
    mockedRestoreSession.mockResolvedValue(
      authMocks.getAuthControllerGetProfileResponseMock({ role: 'admin' }),
    )
    const { result } = await renderEntry()

    await act(async () => {
      await result.current.openAdminInterface()
    })

    expect(mockedRestoreSession).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/admin')
  })

  test('pushes /admin/login when there is no session', async () => {
    mockedRestoreSession.mockResolvedValue(null)
    const { result } = await renderEntry()

    await act(async () => {
      await result.current.openAdminInterface()
    })

    expect(mockPush).toHaveBeenCalledWith('/admin/login')
  })

  test('skips restore and pushes /admin when already authenticated', async () => {
    const ctx = createCtx()
    authUserAtom(ctx, authMocks.getAuthControllerGetProfileResponseMock({ role: 'admin' }))
    authStatusAtom(ctx, 'authenticated')
    const { result } = await renderHookWithProviders(() => useAdminEntry(), { ctx })

    await act(async () => {
      await result.current.openAdminInterface()
    })

    expect(mockedRestoreSession).not.toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/admin')
  })
})

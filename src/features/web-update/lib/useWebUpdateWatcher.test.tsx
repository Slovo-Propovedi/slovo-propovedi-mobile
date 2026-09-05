import { act, renderHook } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { useWebUpdateWatcher } from './useWebUpdateWatcher'
import {
  createRegistration,
  createWorker,
  installDomGlobals,
  setServiceWorker,
} from './useWebUpdateWatcher.testHelpers'

const flush = () => act(async () => {})

describe('useWebUpdateWatcher', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'web')
    installDomGlobals()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('status is ready immediately when a waiting worker and controller exist', async () => {
    const { reg } = createRegistration({ waiting: {} })
    setServiceWorker(Promise.resolve(reg), {})

    const { result } = await renderHook(() => useWebUpdateWatcher())
    await flush()

    expect(result.current.status).toBe('ready')
  })

  test('updatefound sets installing, then installed with controller sets ready', async () => {
    const { emitUpdateFound, reg } = createRegistration()
    const { setState, worker } = createWorker()
    setServiceWorker(Promise.resolve(reg), {})

    const { result } = await renderHook(() => useWebUpdateWatcher())
    await flush()

    reg.installing = worker
    await act(() => emitUpdateFound())
    expect(result.current.status).toBe('installing')

    await act(() => setState('installed'))
    expect(result.current.status).toBe('ready')
  })

  test('redundant statechange returns to idle', async () => {
    const { setState, worker } = createWorker()
    const { reg } = createRegistration({ installing: worker })
    setServiceWorker(Promise.resolve(reg), {})

    const { result } = await renderHook(() => useWebUpdateWatcher())
    await flush()
    expect(result.current.status).toBe('installing')

    await act(() => setState('redundant'))
    expect(result.current.status).toBe('idle')
  })

  test('installed without a controller does not become ready (first install)', async () => {
    const { setState, worker } = createWorker()
    const { reg } = createRegistration({ installing: worker })
    setServiceWorker(Promise.resolve(reg), null)

    const { result } = await renderHook(() => useWebUpdateWatcher())
    await flush()

    await act(() => setState('installed'))
    expect(result.current.status).not.toBe('ready')
  })

  test('dismiss resets to idle and a fresh update can reach ready again', async () => {
    const { emitUpdateFound, reg } = createRegistration({ waiting: {} })
    setServiceWorker(Promise.resolve(reg), {})

    const { result } = await renderHook(() => useWebUpdateWatcher())
    await flush()

    await act(() => result.current.dismiss())
    expect(result.current.status).toBe('idle')

    const { setState, worker } = createWorker()
    reg.installing = worker
    await act(() => emitUpdateFound())
    expect(result.current.status).toBe('installing')

    await act(() => setState('installed'))
    expect(result.current.status).toBe('ready')
  })

  test('unmounting before ready resolves does not crash on late resolution', async () => {
    let resolveReady: (value: unknown) => void = () => {}
    const ready = new Promise(resolve => {
      resolveReady = resolve
    })
    const { reg } = createRegistration()
    setServiceWorker(ready, {})

    const { unmount } = await renderHook(() => useWebUpdateWatcher())
    await unmount()

    await act(async () => resolveReady(reg))
  })

  test('unmounting after ready resolves runs cleanup without throwing', async () => {
    const { reg } = createRegistration({ waiting: {} })
    setServiceWorker(Promise.resolve(reg), {})

    const { result, unmount } = await renderHook(() => useWebUpdateWatcher())
    await flush()
    expect(result.current.status).toBe('ready')

    expect(() => unmount()).not.toThrow()
  })
})

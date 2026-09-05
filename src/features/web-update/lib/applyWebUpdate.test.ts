import { applyWebUpdate } from './applyWebUpdate'

const SKIP_WAITING_MESSAGE = { type: 'SKIP_WAITING' }

interface ServiceWorkerContainerMock {
  addEventListener: jest.Mock
  ready: Promise<ServiceWorkerRegistration>
}

const createWaitingWorker = () => ({ postMessage: jest.fn() })

const mockServiceWorkerContainer = (waiting: { postMessage: jest.Mock } | null) => {
  const registration = { waiting } as unknown as ServiceWorkerRegistration
  const container: ServiceWorkerContainerMock = {
    addEventListener: jest.fn(),
    ready: Promise.resolve(registration),
  }
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: container,
  })
  return container
}

const mockReload = () => {
  const reload = jest.fn()
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { reload },
  })
  return reload
}

const getControllerChangeHandler = (container: ServiceWorkerContainerMock) => {
  const call = container.addEventListener.mock.calls.find(([type]) => type === 'controllerchange')
  return call?.[1] as (() => void) | undefined
}

describe('applyWebUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('posts SKIP_WAITING to the waiting worker and reloads once on controllerchange', async () => {
    const waiting = createWaitingWorker()
    const container = mockServiceWorkerContainer(waiting)
    const reload = mockReload()

    await applyWebUpdate()

    expect(waiting.postMessage).toHaveBeenCalledWith(SKIP_WAITING_MESSAGE)
    expect(reload).not.toHaveBeenCalled()

    const controllerChangeHandler = getControllerChangeHandler(container)
    expect(controllerChangeHandler).toBeDefined()

    controllerChangeHandler?.()
    controllerChangeHandler?.()

    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('reloads directly when no waiting worker exists', async () => {
    mockServiceWorkerContainer(null)
    const reload = mockReload()

    await applyWebUpdate()

    expect(reload).toHaveBeenCalledTimes(1)
  })
})

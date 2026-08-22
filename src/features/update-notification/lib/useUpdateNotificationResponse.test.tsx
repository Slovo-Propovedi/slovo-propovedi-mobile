import { renderHook } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { addNotificationResponseListener } from 'shared/lib/notifications'
import { ctx } from 'shared/lib/reatom-ctx'
import { startUpdateAction } from 'shared/model'
import { useUpdateNotificationResponse } from './useUpdateNotificationResponse'

jest.mock('shared/lib/notifications', () => ({
  addNotificationResponseListener: jest.fn(),
}))

jest.mock('shared/lib/reatom-ctx', () => ({
  ctx: {},
}))

jest.mock('shared/model', () => ({
  startUpdateAction: jest.fn(),
}))

interface NotificationResponse {
  actionIdentifier: string | undefined
  notification: {
    request: {
      content: { data: Record<string, string> }
    }
  }
}

const RELEASE_URL = 'https://github.com/Slovo-Propovedi/slovo-propovedi-mobile/releases/tag/v0.4.0'

const mockedAddListener = addNotificationResponseListener as jest.MockedFunction<
  typeof addNotificationResponseListener
>
const mockedStartUpdate = startUpdateAction as jest.MockedFunction<typeof startUpdateAction>

const buildResponse = (actionIdentifier: string | undefined): NotificationResponse => ({
  actionIdentifier,
  notification: {
    request: {
      content: { data: { releaseUrl: RELEASE_URL } },
    },
  },
})

const captureListener = async (): Promise<(response: NotificationResponse) => void> => {
  let capturedCallback: ((response: NotificationResponse) => void) | undefined
  mockedAddListener.mockImplementation(callback => {
    capturedCallback = callback
    return () => {}
  })

  await renderHook(() => useUpdateNotificationResponse())

  if (!capturedCallback) throw new Error('Notification response listener was not registered')
  return capturedCallback
}

describe('useUpdateNotificationResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('starts the in-app update when the update action is pressed', async () => {
    const listener = await captureListener()

    listener(buildResponse('start-in-app-update'))

    expect(mockedStartUpdate).toHaveBeenCalledTimes(1)
    expect(mockedStartUpdate).toHaveBeenCalledWith(ctx)
  })

  test('opens the release URL when the open-release-url action is pressed', async () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
    const listener = await captureListener()

    listener(buildResponse('open-release-url'))

    expect(openURLSpy).toHaveBeenCalledWith(RELEASE_URL)
  })

  test('ignores unknown action identifiers', async () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
    const listener = await captureListener()

    listener(buildResponse('unknown-action'))

    expect(mockedStartUpdate).not.toHaveBeenCalled()
    expect(openURLSpy).not.toHaveBeenCalled()
  })
})

import { act, renderHook } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { reportError } from 'shared/model/error-dialog'
import { showInfo } from 'shared/model/info-dialog'
import { useVoiceInput } from './useVoiceInput'
import { type WebSpeechResult, type WebSpeechResultEvent } from './webSpeechRecognition'

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))
jest.mock('shared/model/info-dialog', () => ({ showInfo: jest.fn() }))

const VOICE_UNAVAILABLE = 'Голосовой ввод недоступен на этом устройстве'
const mockedReportError = reportError as jest.MockedFunction<typeof reportError>
const mockedShowInfo = showInfo as jest.MockedFunction<typeof showInfo>

const buildResult = (transcript: string, isFinal: boolean | undefined): WebSpeechResult =>
  isFinal === undefined
    ? [{ confidence: 1, transcript }]
    : Object.assign([{ confidence: 1, transcript }], { isFinal })

const buildResultEvent = (results: WebSpeechResult[], resultIndex = 0): WebSpeechResultEvent => ({
  resultIndex,
  results,
})

let startFailure: Error | null = null

const fakeRecognitionInstances: FakeRecognition[] = []

class FakeRecognition {
  public constructor() {
    fakeRecognitionInstances.push(this)
  }

  public abort = jest.fn()
  public continuous = true
  public interimResults = true
  public lang = ''
  public maxAlternatives = 3
  public onend: (() => void) | null = null
  public onerror: ((event: { error?: string }) => void) | null = null
  public onresult: ((event: WebSpeechResultEvent) => void) | null = null
  public start = jest.fn(() => {
    if (startFailure) throw startFailure
  })
  public stop = jest.fn()
}

const installWindow = (recognition?: unknown) => {
  const previousWindow = Object.getOwnPropertyDescriptor(global, 'window')
  const fakeWindow: Record<string, unknown> = {}
  if (recognition) fakeWindow.SpeechRecognition = recognition

  Object.defineProperty(global, 'window', {
    configurable: true,
    value: fakeWindow,
    writable: true,
  })

  return () => {
    if (previousWindow) Object.defineProperty(global, 'window', previousWindow)
    else Reflect.deleteProperty(global, 'window')
  }
}

const installNavigatorPermissions = (permissions?: unknown) => {
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: permissions === undefined ? {} : { permissions },
    writable: true,
  })

  return () => {
    if (previousNavigator) Object.defineProperty(globalThis, 'navigator', previousNavigator)
    else Reflect.deleteProperty(globalThis, 'navigator')
  }
}

const renderWebVoiceInput = async (options: { withApi?: boolean } = {}) => {
  const restoreWindow = installWindow(options.withApi === false ? undefined : FakeRecognition)
  const onTranscript = jest.fn()
  const hook = await renderHook(() => useVoiceInput({ onTranscript }))

  return { ...hook, onTranscript, restoreWindow }
}

const latestRecognition = (): FakeRecognition => {
  const recognition = fakeRecognitionInstances.at(-1)
  if (!recognition) throw new Error('recognition was never constructed')
  return recognition
}

describe('useVoiceInput (web)', () => {
  let restorePlatform: { restore: () => void }

  beforeEach(() => {
    fakeRecognitionInstances.length = 0
    mockedReportError.mockClear()
    mockedShowInfo.mockClear()
    restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
  })

  afterEach(() => {
    restorePlatform.restore()
  })

  test('writes the final transcript through onTranscript', async () => {
    const { onTranscript, restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {
        result.current.startListening()
      })
      const recognition = latestRecognition()

      expect(recognition.start).toHaveBeenCalledTimes(1)
      expect(recognition.lang).toBe('ru-RU')
      expect(recognition.continuous).toBe(false)
      expect(recognition.interimResults).toBe(false)

      await act(async () => {
        recognition.onresult?.(buildResultEvent([buildResult('  привет мир  ', true)]))
      })

      expect(onTranscript).toHaveBeenCalledWith('привет мир')
    } finally {
      restoreWindow()
    }
  })

  test('does not write an empty or interim-only result', async () => {
    const { onTranscript, restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {
        result.current.startListening()
      })
      const recognition = latestRecognition()

      await act(async () => {
        recognition.onresult?.(buildResultEvent([buildResult('приве', false)]))
        recognition.onresult?.(buildResultEvent([]))
      })

      expect(onTranscript).not.toHaveBeenCalled()
    } finally {
      restoreWindow()
    }
  })

  test('leaves the listening state once a final result arrives', async () => {
    const { restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {
        result.current.startListening()
      })
      const recognition = latestRecognition()

      await act(async () => {
        recognition.onresult?.(buildResultEvent([buildResult('привет', true)]))
      })
      expect(result.current.isListening).toBe(false)

      await act(async () => {
        recognition.onend?.()
      })
      expect(result.current.isListening).toBe(false)
    } finally {
      restoreWindow()
    }
  })

  test('aborts the active recognition when stopListening is called', async () => {
    const { restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {
        result.current.startListening()
      })
      const recognition = latestRecognition()

      await act(async () => {
        result.current.stopListening()
      })

      expect(recognition.abort).toHaveBeenCalledTimes(1)
      expect(result.current.isListening).toBe(false)
    } finally {
      restoreWindow()
    }
  })

  test('aborts the active recognition on unmount', async () => {
    const { restoreWindow, result, unmount } = await renderWebVoiceInput()

    try {
      await act(async () => {
        result.current.startListening()
      })
      const recognition = latestRecognition()

      await act(async () => {
        unmount()
      })

      expect(recognition.abort).toHaveBeenCalledTimes(1)
    } finally {
      restoreWindow()
    }
  })

  test('does not abort anything on unmount when idle', async () => {
    const { restoreWindow, unmount } = await renderWebVoiceInput()

    try {
      await act(async () => {
        unmount()
      })

      expect(fakeRecognitionInstances).toHaveLength(0)
    } finally {
      restoreWindow()
    }
  })

  test('treats a recognizer that cannot run here as unavailable, not as an error', async () => {
    const { restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {
        result.current.startListening()
      })
      const recognition = latestRecognition()

      await act(async () => {
        recognition.onerror?.({ error: 'not-allowed' })
      })

      expect(mockedShowInfo).toHaveBeenCalledWith(VOICE_UNAVAILABLE)
      expect(mockedReportError).not.toHaveBeenCalled()
      expect(result.current.isListening).toBe(false)
      expect(result.current.isUnavailable).toBe(true)
    } finally {
      restoreWindow()
    }
  })

  test('keeps a real network failure on the error path and stays available', async () => {
    const { restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {
        result.current.startListening()
      })
      const recognition = latestRecognition()

      await act(async () => {
        recognition.onerror?.({ error: 'network' })
      })

      expect(mockedReportError).toHaveBeenCalledWith('network', 'Не удалось распознать речь')
      expect(mockedShowInfo).not.toHaveBeenCalled()
      expect(result.current.isUnavailable).toBe(false)
    } finally {
      restoreWindow()
    }
  })

  test('turns unavailable when the browser reports a denied microphone permission', async () => {
    const query = jest.fn().mockResolvedValue({ state: 'denied' })
    const restoreNavigator = installNavigatorPermissions({ query })
    const { restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {})

      expect(query).toHaveBeenCalledWith({ name: 'microphone' })
      expect(result.current.isUnavailable).toBe(true)
    } finally {
      restoreNavigator()
      restoreWindow()
    }
  })

  test('stays available when the permission API is unsupported', async () => {
    const restoreNavigator = installNavigatorPermissions()
    const { restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {})

      expect(result.current.isUnavailable).toBe(false)
    } finally {
      restoreNavigator()
      restoreWindow()
    }
  })

  test('stays available when the permission probe returns an unknown state', async () => {
    const query = jest.fn().mockResolvedValue({ state: 'mystery' })
    const restoreNavigator = installNavigatorPermissions({ query })
    const { restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {})

      expect(result.current.isUnavailable).toBe(false)
    } finally {
      restoreNavigator()
      restoreWindow()
    }
  })

  test('treats aborted and no-speech as normal outcomes', async () => {
    const { restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {
        result.current.startListening()
      })
      const recognition = latestRecognition()

      await act(async () => {
        recognition.onerror?.({ error: 'aborted' })
      })

      expect(mockedReportError).not.toHaveBeenCalled()
      expect(result.current.isListening).toBe(false)
    } finally {
      restoreWindow()
    }
  })

  test('ignores results from a superseded recognizer', async () => {
    const { onTranscript, restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {
        result.current.startListening()
      })
      const first = latestRecognition()

      await act(async () => {
        result.current.stopListening()
      })
      await act(async () => {
        result.current.startListening()
      })
      const second = latestRecognition()

      await act(async () => {
        first.onresult?.(buildResultEvent([buildResult('старый результат', true)]))
      })
      expect(onTranscript).not.toHaveBeenCalled()

      await act(async () => {
        second.onresult?.(buildResultEvent([buildResult('новый результат', true)]))
      })
      expect(onTranscript).toHaveBeenCalledWith('новый результат')
    } finally {
      restoreWindow()
    }
  })

  test('starts a fresh recognizer after the previous one ended', async () => {
    const { restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {
        result.current.startListening()
      })
      const first = latestRecognition()

      await act(async () => {
        first.onend?.()
      })
      await act(async () => {
        result.current.startListening()
      })

      expect(fakeRecognitionInstances).toHaveLength(2)
      expect(latestRecognition()).not.toBe(first)
    } finally {
      restoreWindow()
    }
  })

  test('ignores a second press while the recognizer is already listening', async () => {
    const { restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {
        result.current.startListening()
      })
      const first = latestRecognition()

      await act(async () => {
        result.current.startListening()
      })

      expect(first.start).toHaveBeenCalledTimes(1)
      expect(first.abort).not.toHaveBeenCalled()
      expect(fakeRecognitionInstances).toHaveLength(1)
    } finally {
      restoreWindow()
    }
  })

  test('shows the info dialog when the browser has no recognizer', async () => {
    const { restoreWindow, result } = await renderWebVoiceInput({ withApi: false })

    try {
      expect(result.current.isUnavailable).toBe(true)

      await act(async () => {
        result.current.startListening()
      })

      expect(mockedShowInfo).toHaveBeenCalledWith(VOICE_UNAVAILABLE)
      expect(fakeRecognitionInstances).toHaveLength(0)
    } finally {
      restoreWindow()
    }
  })

  test('reports a synchronous start failure without leaving the mic stuck', async () => {
    startFailure = new Error('InvalidStateError')
    const { restoreWindow, result } = await renderWebVoiceInput()

    try {
      await act(async () => {
        result.current.startListening()
      })

      expect(mockedReportError).toHaveBeenCalled()
      expect(result.current.isListening).toBe(false)
    } finally {
      startFailure = null
      restoreWindow()
    }
  })
})

describe('useVoiceInput (unsupported platform)', () => {
  test('starts as unavailable on iOS, where no recognizer is wired', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')

    try {
      const { result } = await renderHook(() => useVoiceInput({ onTranscript: jest.fn() }))

      expect(result.current.isUnavailable).toBe(true)
    } finally {
      restorePlatform.restore()
    }
  })
})

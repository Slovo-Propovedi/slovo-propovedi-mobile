import { reportError } from 'shared/model/error-dialog'
import { reportPlayError } from './audioHandlers'

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

const errorNamed = (name: string): Error => Object.assign(new Error(name), { name })

describe('reportPlayError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('downgrades AbortError to a warning without surfacing a dialog', () => {
    reportPlayError(errorNamed('AbortError'))

    expect(reportError).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith('[WebPlayerService] play aborted:', expect.anything())
  })

  test('reports an unexpected play failure', () => {
    reportPlayError(errorNamed('NotSupportedError'))

    expect(reportError).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalled()
  })
})

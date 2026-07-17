import { render } from '@testing-library/react-native'
import { GlobalErrorHandler } from './GlobalErrorHandler'

const mockShowError = jest.fn()

jest.mock('./useErrorDialog', () => ({
  useErrorDialog: () => ({ showError: mockShowError }),
}))

const FATAL_MESSAGE = 'Фатальная ошибка приложения'
const NON_FATAL_MESSAGE = 'Произошла непредвиденная ошибка'

const getInstalledHandler = () => jest.mocked(ErrorUtils.setGlobalHandler).mock.calls[0][0]

describe('<GlobalErrorHandler>', () => {
  beforeEach(() => {
    mockShowError.mockClear()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(ErrorUtils, 'setGlobalHandler')
    jest.spyOn(ErrorUtils, 'getGlobalHandler').mockReturnValue(jest.fn())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders null — no visible children', async () => {
    const { toJSON } = await render(<GlobalErrorHandler />)

    expect(toJSON()).toBeNull()
  })

  test('calls ErrorUtils.setGlobalHandler on mount', async () => {
    await render(<GlobalErrorHandler />)

    expect(ErrorUtils.setGlobalHandler).toHaveBeenCalledTimes(1)
  })

  test('installed handler calls showError with fatal message when isFatal=true', async () => {
    await render(<GlobalErrorHandler />)

    const handler = getInstalledHandler()
    const error = new Error('fatal boom')

    handler(error, true)

    expect(mockShowError).toHaveBeenCalledWith(error, FATAL_MESSAGE)
  })

  test('installed handler calls showError with non-fatal message when isFatal=false', async () => {
    await render(<GlobalErrorHandler />)

    const handler = getInstalledHandler()
    const error = new Error('non-fatal boom')

    handler(error, false)

    expect(mockShowError).toHaveBeenCalledWith(error, NON_FATAL_MESSAGE)
  })

  test('installed handler calls showError with non-fatal message when isFatal is undefined', async () => {
    await render(<GlobalErrorHandler />)

    const handler = getInstalledHandler()
    const error = new Error('undefined fatal boom')

    handler(error, undefined)

    expect(mockShowError).toHaveBeenCalledWith(error, NON_FATAL_MESSAGE)
  })

  test('installed handler also calls the original handler (chaining)', async () => {
    const originalHandler = jest.fn()
    jest.mocked(ErrorUtils.getGlobalHandler).mockReturnValue(originalHandler)

    await render(<GlobalErrorHandler />)

    const handler = getInstalledHandler()
    const error = new Error('chain test')

    handler(error, true)

    expect(mockShowError).toHaveBeenCalledTimes(1)
    expect(originalHandler).toHaveBeenCalledTimes(1)
    expect(originalHandler).toHaveBeenCalledWith(error, true)
  })

  test('the error object passed to showError is the same reference', async () => {
    await render(<GlobalErrorHandler />)

    const handler = getInstalledHandler()
    const error = new Error('reference check')

    handler(error, true)

    expect(mockShowError.mock.calls[0][0]).toBe(error)
  })
})

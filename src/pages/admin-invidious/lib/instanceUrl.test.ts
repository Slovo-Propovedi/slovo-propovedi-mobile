import { validateInstanceUrl } from './instanceUrl'

const HTTPS_INSTANCE = 'https://inv.phobos.observer'

describe('validateInstanceUrl', () => {
  test('accepts a full https url', () => {
    expect(validateInstanceUrl(HTTPS_INSTANCE, [])).toBe('ok')
  })

  test('trims surrounding whitespace before checking', () => {
    expect(validateInstanceUrl(`  ${HTTPS_INSTANCE}  `, [])).toBe('ok')
  })

  test('rejects a url without the https scheme', () => {
    expect(validateInstanceUrl('http://inv.phobos.observer', [])).toBe('invalid')
    expect(validateInstanceUrl('inv.phobos.observer', [])).toBe('invalid')
  })

  test('rejects a duplicate', () => {
    expect(validateInstanceUrl(HTTPS_INSTANCE, [HTTPS_INSTANCE])).toBe('duplicate')
    expect(validateInstanceUrl(` ${HTTPS_INSTANCE} `, [HTTPS_INSTANCE])).toBe('duplicate')
  })
})

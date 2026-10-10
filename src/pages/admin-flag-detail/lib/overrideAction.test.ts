import { resolveEffectiveEnabled, resolveOverrideAction } from './overrideAction'

describe('resolveEffectiveEnabled', () => {
  test('grant turns the flag on regardless of the global value', () => {
    expect(resolveEffectiveEnabled('grant', false)).toBe(true)
    expect(resolveEffectiveEnabled('grant', true)).toBe(true)
  })

  test('deny turns the flag off regardless of the global value', () => {
    expect(resolveEffectiveEnabled('deny', true)).toBe(false)
    expect(resolveEffectiveEnabled('deny', false)).toBe(false)
  })

  test('without an override the global value is inherited', () => {
    expect(resolveEffectiveEnabled(null, true)).toBe(true)
    expect(resolveEffectiveEnabled(null, false)).toBe(false)
  })
})

describe('resolveOverrideAction', () => {
  test('turning on while globally disabled grants the user', () => {
    expect(resolveOverrideAction(true, false)).toEqual({ type: 'set', value: 'grant' })
  })

  test('turning on while globally enabled drops the deny override', () => {
    expect(resolveOverrideAction(true, true)).toEqual({ type: 'clear' })
  })

  test('turning off while globally enabled denies the user', () => {
    expect(resolveOverrideAction(false, true)).toEqual({ type: 'set', value: 'deny' })
  })

  test('turning off while globally disabled drops the grant override', () => {
    expect(resolveOverrideAction(false, false)).toEqual({ type: 'clear' })
  })
})

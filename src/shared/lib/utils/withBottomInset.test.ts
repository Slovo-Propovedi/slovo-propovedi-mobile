import { StyleSheet } from 'react-native'
import { withBottomInset } from './withBottomInset'

describe('withBottomInset', () => {
  test('adds the inset to the existing bottom padding', () => {
    const style = withBottomInset({ padding: 16, paddingBottom: 24 }, 20)

    expect(StyleSheet.flatten(style)).toMatchObject({ padding: 16, paddingBottom: 44 })
  })

  test('reserves the inset when the style is undefined', () => {
    const style = withBottomInset(undefined, 34)

    expect(StyleSheet.flatten(style)).toMatchObject({ paddingBottom: 34 })
  })

  test('keeps the base style untouched when the inset is zero', () => {
    const style = withBottomInset({ padding: 16, paddingBottom: 24 }, 0)

    expect(StyleSheet.flatten(style)).toMatchObject({ padding: 16, paddingBottom: 24 })
  })
})

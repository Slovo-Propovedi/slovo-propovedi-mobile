import { screen } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { ListenTopRow } from './ListenTopRow'

jest.mock('features/onboarding', () => ({
  HelpHeaderButton: () => null,
  OnboardingTarget: ({ children }: { children: ReactNode }) => children,
}))

jest.mock('shared/lib/hooks/useHasFinePointer', () => ({
  useHasFinePointer: () => false,
}))

jest.mock('./AdminShieldButton', () => ({ AdminShieldButton: () => null }))

interface StyleNode {
  children?: unknown[]
  props?: { style?: unknown }
}

const findRightAlignedRow = (node: null | string | StyleNode): undefined | ViewStyle => {
  if (node === null || typeof node === 'string') return undefined

  const style = StyleSheet.flatten(node.props?.style as StyleProp<ViewStyle>)
  if (style?.flexDirection === 'row' && style.justifyContent === 'flex-end') return style

  for (const child of node.children ?? []) {
    const found = findRightAlignedRow(child as StyleNode)
    if (found) return found
  }

  return undefined
}

describe('<ListenTopRow>', () => {
  test('aligns its buttons to the right edge of the row', async () => {
    await renderWithProviders(<ListenTopRow showAdminButton={false} />)

    const row = findRightAlignedRow(screen.toJSON() as unknown as null | StyleNode)

    expect(row?.justifyContent).toBe('flex-end')
  })
})

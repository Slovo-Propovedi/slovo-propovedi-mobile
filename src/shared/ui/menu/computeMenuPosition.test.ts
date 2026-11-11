import { computeMenuPosition } from './computeMenuPosition'

const WINDOW = { height: 844, width: 390 }
const GAP = 4

describe('computeMenuPosition', () => {
  test('places the menu above the anchor when there is room', () => {
    const position = computeMenuPosition(
      { height: 36, width: 44, x: 300, y: 500 },
      { height: 100, width: 160 },
      WINDOW,
      GAP,
    )

    expect(position).toEqual({ right: 46, top: 396 })
  })

  test('flips below the anchor when there is no room above', () => {
    const position = computeMenuPosition(
      { height: 36, width: 44, x: 300, y: 50 },
      { height: 100, width: 160 },
      WINDOW,
      GAP,
    )

    expect(position).toEqual({ right: 46, top: 90 })
  })

  test('clamps top so the menu never leaves the window', () => {
    const position = computeMenuPosition(
      { height: 36, width: 44, x: 300, y: 500 },
      { height: 800, width: 160 },
      WINDOW,
      GAP,
    )

    expect(position.top).toBe(40)
  })

  test('clamps right so the menu never leaves the window horizontally', () => {
    const position = computeMenuPosition(
      { height: 36, width: 44, x: 0, y: 500 },
      { height: 100, width: 160 },
      WINDOW,
      GAP,
    )

    expect(position.right).toBe(226)
  })
})

describe('computeMenuPosition below placement', () => {
  test('opens below the anchor even when it would also fit above', () => {
    const position = computeMenuPosition(
      { height: 36, width: 44, x: 300, y: 500 },
      { height: 100, width: 160 },
      WINDOW,
      GAP,
      'below',
    )

    expect(position).toEqual({ right: 46, top: 540 })
  })

  test('flips above only when the menu cannot fit below', () => {
    const position = computeMenuPosition(
      { height: 36, width: 44, x: 300, y: 710 },
      { height: 100, width: 160 },
      WINDOW,
      GAP,
      'below',
    )

    expect(position).toEqual({ right: 46, top: 606 })
  })

  test('clamps top so the menu never leaves the window', () => {
    const position = computeMenuPosition(
      { height: 36, width: 44, x: 300, y: 704 },
      { height: 100, width: 160 },
      WINDOW,
      GAP,
      'below',
    )

    expect(position.top).toBe(740)
  })

  test('clamps right exactly like the default placement', () => {
    const position = computeMenuPosition(
      { height: 36, width: 44, x: 0, y: 500 },
      { height: 100, width: 160 },
      WINDOW,
      GAP,
      'below',
    )

    expect(position.right).toBe(226)
  })
})

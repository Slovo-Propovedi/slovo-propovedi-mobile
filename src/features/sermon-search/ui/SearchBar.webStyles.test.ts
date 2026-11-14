import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The web shell is the only place that can beat mobile Chrome's UA focus ring:
// react-native-web's inline styles lose to the browser's `:focus-visible` rule.
const WEB_SHELL = readFileSync(join(__dirname, '../../../../public/index.html'), 'utf8')
const SEARCH_INPUT_SELECTOR = 'input[aria-label="Проповеди, проповедники, название книги"]'

describe('web shell native-control styling', () => {
  test('removes the focus ring and shadow from the search input', () => {
    expect(WEB_SHELL).toContain(SEARCH_INPUT_SELECTOR)
    expect(WEB_SHELL).toMatch(/outline:\s*none/)
    expect(WEB_SHELL).toMatch(/box-shadow:\s*none/)
  })

  test('disables the mobile tap highlight on inputs and buttons', () => {
    expect(WEB_SHELL).toContain('-webkit-tap-highlight-color: transparent')
    expect(WEB_SHELL).toMatch(/input,\s*button,\s*\[role='button'\]/)
  })
})

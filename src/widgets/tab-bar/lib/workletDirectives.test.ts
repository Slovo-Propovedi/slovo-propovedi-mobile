import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Every helper reachable from an animated style must carry the 'worklet'
// directive: a worklet may only call another worklet, otherwise the UI runtime
// throws "Tried to synchronously call a Remote Function". The reanimated babel
// plugin strips the directive from transpiled output, so jest (where the
// mocked hooks run on the JS thread) cannot see it — read the source instead.
const WORKLET_HELPERS: Array<[string, string[]]> = [
  ['getBarMorphStyles.ts', ['getIslandContentStyle', 'getTabItemStyle']],
  [
    'getIslandStyle.ts',
    [
      'getCapsuleOpacity',
      'getCircleButtonStyle',
      'getIslandContentPadding',
      'getIslandStyle',
      'getTabIconOffset',
      'getTabItemHeight',
      'getTabItemHorizontalMargin',
      'getTabItemVerticalMargin',
      'getTabSlotStyle',
    ],
  ],
  ['getIslandMath.ts', ['clampProgress', 'getIslandHeight', 'interpolateSize']],
]

const readSource = (file: string) => readFileSync(join(__dirname, file), 'utf8')

const getDeclaration = (source: string, name: string) => {
  const declaration = source.match(new RegExp(`(?:export )?const ${name} = [\\s\\S]*?\\n\\}`))

  if (!declaration) throw new Error(`No block-bodied declaration found for ${name}`)

  return declaration[0]
}

describe('tab-bar worklet directives', () => {
  test.each(WORKLET_HELPERS)('%s declares its UI-thread helpers as worklets', (file, names) => {
    const source = readSource(file)

    for (const name of names) expect(getDeclaration(source, name)).toMatch(/'worklet'/)
  })
})

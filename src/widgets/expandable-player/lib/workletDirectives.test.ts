import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Every helper reachable from the animated mask props must carry the 'worklet'
// directive: a worklet may only call another worklet, otherwise the UI runtime
// throws "Tried to synchronously call a Remote Function". The reanimated babel
// plugin strips the directive from transpiled output, so jest cannot see it —
// read the source instead.
const WORKLET_HELPERS: Array<[string, string[]]> = [
  ['getShadeFrameHeight.ts', ['getShadeFrameHeight']],
  ['getShadeHoles.ts', ['getShadeHoles']],
  ['getIslandShadeHole.ts', ['getIslandShadeHole']],
  ['getPillShadeHole.ts', ['getPillShadeHole']],
  ['getSearchShadeHoles.ts', ['getCloseHole', 'getSearchShadeHoles']],
  ['shadeRow.ts', ['getShadeRow', 'toShadeHole']],
]

const readSource = (file: string) => readFileSync(join(__dirname, file), 'utf8')

// The directive opens the function body; destructured parameter types make a
// full-declaration regex stop too early, so inspect the arrow's body instead.
const getBodyStart = (source: string, name: string) => {
  const declarationStart = source.indexOf(`const ${name} =`)

  if (declarationStart < 0) throw new Error(`No declaration found for ${name}`)

  const arrowStart = source.indexOf('=> {', declarationStart)

  if (arrowStart < 0) throw new Error(`No arrow body found for ${name}`)

  return source.slice(arrowStart, arrowStart + 40)
}

describe('shade hole worklet directives', () => {
  test.each(WORKLET_HELPERS)('%s declares its UI-thread helpers as worklets', (file, names) => {
    const source = readSource(file)

    for (const name of names) expect(getBodyStart(source, name)).toMatch(/'worklet'/)
  })
})

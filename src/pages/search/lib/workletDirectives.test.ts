import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Same contract as the tab-bar worklet test: the reanimated babel plugin strips
// the directive from transpiled output and jest's reanimated mock runs on the
// JS thread, so only the source can prove a helper is callable from a worklet.
const WORKLET_HELPERS: Array<[string, string[]]> = [
  ['resultsTransition.ts', ['clamp01', 'getResultsTransitionStyles']],
]

const readSource = (file: string) => readFileSync(join(__dirname, file), 'utf8')

const getDeclaration = (source: string, name: string) => {
  const declaration = source.match(new RegExp(`(?:export )?const ${name} = [\\s\\S]*?\\n\\}`))

  if (!declaration) throw new Error(`No block-bodied declaration found for ${name}`)

  return declaration[0]
}

describe('search transition worklet directives', () => {
  test.each(WORKLET_HELPERS)('%s declares its UI-thread helpers as worklets', (file, names) => {
    const source = readSource(file)

    for (const name of names) expect(getDeclaration(source, name)).toMatch(/'worklet'/)
  })

  test('animated updaters close over the shared progress value, not the clock container', () => {
    const source = readSource('useResultsTransition.ts')

    expect(source).toContain('const { progress } = clock')
    expect(source).not.toContain('clock.progress.value')
  })
})

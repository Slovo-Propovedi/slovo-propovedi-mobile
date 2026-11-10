import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  defineConfig,
  NamingConvention,
  OutputMockType,
  OutputMode,
  PropertySortOrder,
} from 'orval'

// Required build-time config: the OpenAPI spec host. Orval runs the config
// through jiti, which does not load .env on its own — so missing vars are
// filled from .env first (yarn scripts run from the repo root). No fallback:
// a missing var must fail fast with a clear message instead of silently
// generating the client against the production docs host. See .env.example.
const loadDotEnv = () => {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separator = line.indexOf('=')
    if (separator === -1) continue

    const key = line.slice(0, separator).trim()
    if (!key || process.env[key] !== undefined) continue

    const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
    process.env[key] = value
  }
}

// Mirrors the backend's orval.config.mjs local-spec override: OPENAPI_SPEC_PATH
// points codegen at a local checkout of slovo-propovedi-docs (used while a spec
// change is not published yet) and makes DOCS_HOSTNAME optional.
const localSpecPath = process.env.OPENAPI_SPEC_PATH

if (!process.env.DOCS_HOSTNAME && !localSpecPath) loadDotEnv()

const docsHostname = process.env.DOCS_HOSTNAME

if (!localSpecPath && !docsHostname) {
  throw new Error(
    'DOCS_HOSTNAME is not set. Add it to .env (see .env.example) or export DOCS_HOSTNAME=<bare hostname> and re-run. Alternatively, set OPENAPI_SPEC_PATH to a local openAPI.yaml.',
  )
}

const specInput = localSpecPath ?? `https://${docsHostname}/openAPI.yaml`

export default defineConfig({
  // Output 1: Axios API функции с mutator и MSW моками
  main: {
    input: specInput,
    output: {
      mode: OutputMode.TAGS_SPLIT,
      client: 'axios',
      httpClient: 'axios',
      target: './src/shared/api/generated',
      // index.ts ведётся вручную — Orval не должен его перезаписывать
      indexFiles: false,
      mock: { generators: [{ type: OutputMockType.FAKER, generateEachHttpStatus: true }] },
      propertySortOrder: PropertySortOrder.ALPHABETICAL,
      unionAddMissingProperties: true,
      namingConvention: NamingConvention.CAMEL_CASE,
      formatter: 'prettier',
      override: {
        mutator: {
          path: './src/shared/api/axiosInstance.ts',
          name: 'customInstance',
        },
      },
    },
  },
  // Output 2: Zod схемы отдельно (без mutator)
  schemas: {
    input: specInput,
    output: {
      mode: OutputMode.TAGS,
      propertySortOrder: PropertySortOrder.ALPHABETICAL,
      unionAddMissingProperties: true,
      client: 'zod',
      target: './src/shared/api/generated/model',
      formatter: 'prettier',
      namingConvention: NamingConvention.CAMEL_CASE,
      override: {
        zod: {
          generate: { response: true, body: true, header: true, param: true, query: true },
          generateEachHttpStatus: true,
        },
      },
    },
  },
})

import {
  defineConfig,
  NamingConvention,
  OutputMockType,
  OutputMode,
  PropertySortOrder,
} from 'orval'

// Required build-time config: the OpenAPI spec host. No fallback — a missing
// var must fail fast with a clear message instead of silently generating the
// client against the production docs host. See .env.example.
const docsHostname = process.env.DOCS_HOSTNAME

if (!docsHostname) {
  throw new Error(
    'DOCS_HOSTNAME is not set. Copy .env.example to .env (or export DOCS_HOSTNAME=<bare hostname>) and re-run.',
  )
}

const OPENAPI_SPEC_URL = `https://${docsHostname}/openAPI.yaml`

export default defineConfig({
  // Output 1: Axios API функции с mutator и MSW моками
  main: {
    input: OPENAPI_SPEC_URL,
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
    input: OPENAPI_SPEC_URL,
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

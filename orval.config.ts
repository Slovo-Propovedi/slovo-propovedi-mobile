import {
  defineConfig,
  NamingConvention,
  OutputMockType,
  OutputMode,
  PropertySortOrder,
} from 'orval'

const OPENAPI_SPEC_URL = `https://${process.env.DOCS_HOSTNAME ?? 'docs.slovo-propovedi.ru'}/openAPI.yaml`

export default defineConfig({
  // Output 1: Axios API функции с mutator и MSW моками
  main: {
    input: OPENAPI_SPEC_URL,
    output: {
      mode: OutputMode.TAGS_SPLIT,
      client: 'axios',
      httpClient: 'axios',
      target: './src/shared/api/generated',
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

import { defineConfig, NamingConvention, OutputMode, PropertySortOrder } from 'orval'

export default defineConfig({
  // Output 1: Axios API функции с mutator и MSW моками
  main: {
    input: 'https://docs.slovo-propovedi.ru/openAPI.yaml',
    output: {
      mode: OutputMode.TAGS_SPLIT,
      client: 'axios',
      httpClient: 'axios',
      target: './src/shared/api/generated',
      // mock: { type: OutputMockType.MSW, generateEachHttpStatus: true },
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
    input: './openAPI.yaml',
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

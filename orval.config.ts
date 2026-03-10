import {
  defineConfig,
  NamingConvention,
  OutputClient,
  OutputMockType,
  OutputMode,
  PropertySortOrder,
} from 'orval'

export default defineConfig({
  // main: {
  //   output: {
  //     mode: 'tags-split',
  //     target: './src/shared/api/generated',
  //     // schemas: './src/shared/api/generated/model',
  //     client: 'react-query',
  //     mock: true,
  //     prettier: true,
  //     override: {
  //       query: {
  //         useSuspenseQuery: true,
  //       },
  //     },
  //   },
  //   input: 'https://docs.api.exarh.ru/openapi.dev.yml',
  // },
  mainZod: {
    input: 'https://example.com/openapi.yml',
    output: {
      target: './src/shared/api/generated',
      schemas: './src/shared/api/generated/model',
      client: OutputClient.ZOD,
      mode: OutputMode.TAGS_SPLIT,
      fileExtension: '.zod.ts',
      prettier: true,
      mock: { type: OutputMockType.MSW, generateEachHttpStatus: true },
      propertySortOrder: PropertySortOrder.ALPHABETICAL,
      unionAddMissingProperties: true,
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

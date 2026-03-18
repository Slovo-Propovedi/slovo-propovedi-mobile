import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: ['src/app/main.tsx'],
  ignore: [
    'src/shared/model/file/mimeTypes.ts',
    '**/schemas.ts',
    '**/*schemas.ts',
    '**/index.web.ts',
  ],
  project: ['src/**/*.{ts,js,tsx,jsx}'],
  rules: {
    dependencies: 'warn',
    devDependencies: 'warn',
    optionalPeerDependencies: 'warn',
    unlisted: 'off',
  },
}

export default config

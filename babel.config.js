// eslint-disable-next-line no-undef
const { resolvePath: defaultResolvePath } = require('babel-plugin-module-resolver')

// Metro применяет этот babel-конфиг и к node_modules: без guard'а bare-импорты
// npm-пакетов (например, пакет `entities` из цепочки react-native-svg → css-select
// → domutils → dom-serializer) переписывались бы в src/entities проекта.
const resolvePathSkipNodeModules = (sourcePath, currentFile, opts) => {
  if (currentFile.includes('node_modules')) return sourcePath

  return defaultResolvePath(sourcePath, currentFile, opts)
}

// eslint-disable-next-line no-undef
module.exports = function (api) {
  api.cache(true)
  return {
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            entities: './src/entities',
            features: './src/features',
            pages: './src/pages',
            shared: './src/shared',
            widgets: './src/widgets',
          },
          root: ['./src/'],
          resolvePath: resolvePathSkipNodeModules,
        },
      ],
      'react-native-reanimated/plugin',
    ],
    presets: ['babel-preset-expo'],
  }
}

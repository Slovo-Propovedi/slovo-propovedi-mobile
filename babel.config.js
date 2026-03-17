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
        },
      ],
      'react-native-reanimated/plugin',
    ],
    presets: ['babel-preset-expo'],
  }
}

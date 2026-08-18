jest.mock('expo-image', () => {
  const { forwardRef } = require('react')
  const { View } = require('react-native')

  const Image = forwardRef((props, ref) => {
    const { testID, style, source, children, ...rest } = props
    return (
      <View ref={ref} testID={testID} style={style} source={source} {...rest}>
        {children}
      </View>
    )
  })

  Image.displayName = 'Image'

  return {
    __esModule: true,
    default: Image,
    Image,
    prefetch: () => Promise.resolve(),
    clearDiskCache: () => Promise.resolve(),
    clearMemoryCache: () => Promise.resolve(),
  }
})

jest.mock('expo-image', () => {
  const { forwardRef, useEffect } = require('react')
  const { View } = require('react-native')

  const Image = forwardRef((props, ref) => {
    const { testID, style, source, children, ...rest } = props
    // Like a real image, report the load after mount: CoverImage frees its slot
    // in the cover loading queue on `onLoad`.
    const uri = source?.uri
    useEffect(() => {
      props.onLoad?.({ source: { uri } })
    }, [uri])
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

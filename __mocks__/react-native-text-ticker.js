jest.mock('react-native-text-ticker', () => {
  const { Text } = require('react-native')

  const capturedProps = []

  const TextTicker = props => {
    capturedProps.push({ ...props })
    return (
      <Text testID={props.testID} style={props.style}>
        {props.children}
      </Text>
    )
  }

  return {
    __esModule: true,
    default: TextTicker,
    __textTickerMock: {
      lastProps: () => capturedProps[capturedProps.length - 1],
      reset: () => {
        capturedProps.length = 0
      },
    },
  }
})
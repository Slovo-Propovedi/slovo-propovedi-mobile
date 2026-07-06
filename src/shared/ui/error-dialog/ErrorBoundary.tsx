import { Component, type ErrorInfo, type ReactNode } from 'react'
import { View } from 'react-native'
import { COLORS } from 'shared/ui/themed'
import { ErrorDialog } from './ErrorDialog'
import { getErrorDetail, getErrorMessage } from './useErrorDialog'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundaryInternal extends Component<Props, State> {
  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  public componentDidCatch(_error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
  }

  public handleDismiss = () => {
    this.setState({ error: null, errorInfo: null })
  }

  public render() {
    const { children } = this.props
    const { error, errorInfo } = this.state

    if (error) {
      const message = getErrorMessage(error)
      const detail =
        getErrorDetail(error) +
        (errorInfo ? `\n\nComponent Stack:\n${errorInfo.componentStack}` : '')

      return (
        <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
          <ErrorDialog visible detail={detail} message={message} onDismiss={this.handleDismiss} />
        </View>
      )
    }

    return children
  }

  public constructor(props: Props) {
    super(props)
    this.state = {
      error: null,
      errorInfo: null,
    }
  }
}

export const ErrorBoundary = ({ children }: Props) => (
  <ErrorBoundaryInternal>{children}</ErrorBoundaryInternal>
)

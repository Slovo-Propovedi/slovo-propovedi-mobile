import { Component, type ErrorInfo, type ReactNode } from 'react'
import { View } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'
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
        <ErrorBoundaryThemeWrapper>
          <ErrorDialog visible detail={detail} message={message} onDismiss={this.handleDismiss} />
        </ErrorBoundaryThemeWrapper>
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

const ErrorBoundaryThemeWrapper = ({ children }: { children: ReactNode }) => {
  const { currentTheme } = useTheme()
  return <View style={{ backgroundColor: currentTheme.background, flex: 1 }}>{children}</View>
}

export const ErrorBoundary = ({ children }: Props) => (
  <ErrorBoundaryInternal>{children}</ErrorBoundaryInternal>
)

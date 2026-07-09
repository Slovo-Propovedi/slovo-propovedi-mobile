import { createCtx } from '@reatom/framework'
import { reatomContext } from '@reatom/npm-react'
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderHookResult,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react-native'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from '../ui/theme/ThemeContext/ThemeProvider'

interface CustomRenderHookOptions<Props>
  extends Omit<RenderHookOptions<Props>, 'wrapper'>, ProvidersOptions {}

interface CustomRenderOptions extends Omit<RenderOptions, 'queries'>, ProvidersOptions {}

interface ProvidersOptions {
  AdditionalWrapper?: React.FunctionComponent<React.PropsWithChildren>
  ctx?: ReturnType<typeof createCtx>
}

const getWrapper = ({
  AdditionalWrapper,
  ctx,
}: Pick<ProvidersOptions, 'AdditionalWrapper'> &
  Required<Pick<ProvidersOptions, 'ctx'>>): React.FunctionComponent<React.PropsWithChildren> => {
  const Wrapper = AdditionalWrapper ?? React.Fragment

  return ({ children }) => (
    <reatomContext.Provider value={ctx}>
      <ThemeProvider>
        <SafeAreaProvider
          initialMetrics={{
            frame: { height: 0, width: 0, x: 0, y: 0 },
            insets: { bottom: 0, left: 0, right: 0, top: 0 },
          }}
        >
          <Wrapper>{children}</Wrapper>
        </SafeAreaProvider>
      </ThemeProvider>
    </reatomContext.Provider>
  )
}

export const renderWithProviders = async (
  ui: React.ReactElement,
  options?: CustomRenderOptions,
): Promise<{ ctx: ReturnType<typeof createCtx> } & RenderResult> => {
  const { AdditionalWrapper, ctx = createCtx(), ...renderOptions } = options || {}

  const result = await render(ui, {
    wrapper: getWrapper({ AdditionalWrapper, ctx }),
    ...renderOptions,
  })

  return { ...result, ctx }
}

export const renderHookWithProviders = async <Result, Props>(
  renderCallback: (props: Props) => Result,
  options?: CustomRenderHookOptions<Props>,
): Promise<{ ctx: ReturnType<typeof createCtx> } & RenderHookResult<Result, Props>> => {
  const { AdditionalWrapper, ctx = createCtx(), ...renderHookOptions } = options || {}

  const result = await renderHook(renderCallback, {
    wrapper: getWrapper({ AdditionalWrapper, ctx }),
    ...renderHookOptions,
  })

  return { ...result, ctx }
}

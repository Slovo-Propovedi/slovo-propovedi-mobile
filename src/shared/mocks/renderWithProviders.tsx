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
import { ThemeProvider } from 'shared/ui/theme'

interface CustomRenderHookOptions<Props>
  extends Omit<RenderHookOptions<Props>, 'wrapper'>, ProvidersOptions {}

interface CustomRenderOptions extends Omit<RenderOptions, 'queries'>, ProvidersOptions {}

interface ProvidersOptions {
  AdditionalWrapper?: React.FunctionComponent<React.PropsWithChildren>
  ctx?: ReturnType<typeof createCtx>
}

export const renderWithProviders = async (
  ui: React.ReactElement,
  options?: CustomRenderOptions,
): Promise<{ ctx: ReturnType<typeof createCtx> } & RenderResult> => {
  const { AdditionalWrapper, ctx = createCtx(), ...renderOptions } = options || {}

  const Wrapper = AdditionalWrapper ?? React.Fragment

  const result = await render(ui, {
    wrapper: ({ children }) => (
      <reatomContext.Provider value={ctx}>
        <ThemeProvider>
          <Wrapper>{children}</Wrapper>
        </ThemeProvider>
      </reatomContext.Provider>
    ),
    ...renderOptions,
  })

  return { ...result, ctx }
}

export const renderHookWithProviders = async <Result, Props>(
  renderCallback: (props: Props) => Result,
  options?: CustomRenderHookOptions<Props>,
): Promise<{ ctx: ReturnType<typeof createCtx> } & RenderHookResult<Result, Props>> => {
  const { AdditionalWrapper, ctx = createCtx(), ...renderHookOptions } = options || {}

  const Wrapper = AdditionalWrapper ?? React.Fragment

  const result = await renderHook(renderCallback, {
    wrapper: ({ children }) => (
      <reatomContext.Provider value={ctx}>
        <ThemeProvider>
          <Wrapper>{children}</Wrapper>
        </ThemeProvider>
      </reatomContext.Provider>
    ),
    ...renderHookOptions,
  })

  return { ...result, ctx }
}

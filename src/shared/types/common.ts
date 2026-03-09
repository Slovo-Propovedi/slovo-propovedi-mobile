export interface BookData {
  description?: string
  id: string
  previewUrl?: string
  textFileUrl?: string
  title: string
}

export type HOC<
  RequiredProps extends object,
  ProvidedProps extends RequiredProps = RequiredProps,
  InjectedKeys extends keyof ProvidedProps | void = void,
> = <Props extends object>(
  component: React.FC<Props & ProvidedProps>,
  injector: InjectedKeys extends keyof ProvidedProps ? Pick<ProvidedProps, InjectedKeys> : void,
) => React.FC<Props & RequiredProps>

export type KeyofAny = number | string | symbol

export interface PlaylistData {
  description?: string
  list: SermonData[]
  previewUrl?: string
  title: string
}

export type RequireAtLeastOne<Obj extends object, ExcludeKeys extends keyof Obj = keyof Obj> = {
  [K in ExcludeKeys]-?: Partial<Pick<Obj, Exclude<keyof Obj, K>>> & Required<Pick<Obj, K>>
}[ExcludeKeys] &
  Pick<Obj, Exclude<keyof Obj, ExcludeKeys>>

export interface SermonData {
  audioUrl?: string
  description?: string
  id: string
  textFileUrl?: string
  title: string
  youtubeUrl?: string
}

export type Unpacked<T> = T extends (infer U)[]
  ? U
  : T extends (...args: unknown[]) => infer U
    ? U
    : T extends Promise<infer U>
      ? U
      : T

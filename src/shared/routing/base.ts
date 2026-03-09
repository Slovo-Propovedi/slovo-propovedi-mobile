export type BaseParamList<Obj extends object> = Obj & Record<string, Obj[keyof Obj]>

// The row's outer side inset morphs with the one-line state of the bar; the
// search pill geometry and the collapsed mini pill read the same shared
// progress.
export { oneLineBarMorphDriver } from '../model/oneLineBarMorphDriver'
// Circle import by the FSD `@x` convention: the search island sits in the same
// bottom row as the tab island and must morph into the same target state from
// the same progress value.
export { tabIslandMorphDriver } from '../model/tabIslandMorphDriver'

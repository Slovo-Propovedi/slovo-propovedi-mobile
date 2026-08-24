/**
 * dependency-cruiser config — regression guard against Metro require cycles.
 *
 * Policy:
 * - Circular dependencies are ERRORS: new cycles must fail loudly
 *   (`yarn check:circular`, see docs/conventions.md).
 * - Pre-existing cycles (found when the guard was introduced) are WARNs,
 *   scoped to their own rule below so they don't block CI.
 * - Excluded from all circular rules:
 *   - `src/shared/api/generated/**` — Orval-generated code we don't own;
 *   - test files (`*.test.ts(x)`) and `__mocks__` — jest.mock cycles are noise.
 *
 * Run: yarn check:circular
 */

const GENERATED = '^src/shared/api/generated'
const TEST_FILES = '\\.test\\.[jt]sx?$'
const MOCKS = '__mocks__'

/*
 * Known pre-existing cycles (2026-08, book-reader):
 *   getParagraphElement.tsx → getElementsInBlockElement.ts
 *     → parseObjectToStylizedElements.ts → getParagraphElement.tsx
 *   getBlockElement.tsx → getElementsInBlockElement.ts
 *     → parseObjectToStylizedElements.ts → getBlockElement.tsx
 */
const LEGACY_BOOK_READER =
  '^src/pages/book-reader/lib/(getParagraphElement|getBlockElement|getElementsInBlockElement|parseObjectToStylizedElements)'

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'Metro require cycles crash or hang the bundle at runtime. ' +
        'Any new cycle must be refactored away, not suppressed.',
      from: {
        pathNot: [GENERATED, TEST_FILES, MOCKS, LEGACY_BOOK_READER],
      },
      to: {
        circular: true,
        pathNot: [GENERATED, TEST_FILES, MOCKS],
      },
    },
    {
      name: 'no-axios-instance-to-generated',
      severity: 'error',
      comment:
        'axiosInstance.ts must never runtime-import ./generated/** ' +
        '(type-only imports are fine — tsPreCompilationDeps=false means they create no edges). ' +
        'Guard against regression of the axiosInstance↔generated/auth require cycle.',
      from: {
        path: '^src/shared/api/axiosInstance\\.ts$',
      },
      to: {
        path: '^src/shared/api/generated',
      },
    },
    {
      name: 'no-circular-legacy-book-reader',
      severity: 'warn',
      comment:
        'Pre-existing cycles in book-reader lib (see list above). ' +
        'Fix by extracting shared helpers; do not add new files here.',
      from: {
        path: LEGACY_BOOK_READER,
      },
      to: {
        circular: true,
        pathNot: [GENERATED, TEST_FILES, MOCKS],
      },
    },
  ],
  options: {
    /* Resolve FSD aliases (shared/*, entities/*, ...) from tsconfig paths */
    tsConfig: { fileName: 'tsconfig.json' },
    /* Don't descend into node_modules */
    doNotFollow: { path: 'node_modules' },
    /* Same systems Metro cares about; type-only imports produce no edges
       (tsPreCompilationDeps defaults to false) */
    moduleSystems: ['es6', 'cjs'],
  },
}

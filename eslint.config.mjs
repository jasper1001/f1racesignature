import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// Flat ESLint config — `next lint` was removed in Next 16, so `npm run lint`
// now runs the ESLint CLI directly against this file.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React-Compiler-era hooks rules, new in Next 16's config. The codebase
      // has many pre-existing setState-after-mount patterns (localStorage
      // reads, etc.) that work fine without the compiler — keep these visible
      // as warnings rather than blocking the build until they're refactored.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/incompatible-library': 'warn',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts']),
])

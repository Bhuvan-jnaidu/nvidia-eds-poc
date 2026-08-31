// Build-time replacement for `react-compiler-runtime`. The published package is
// CommonJS and does `require("react")`, which can't run in browser ESM with
// react kept external. This ESM shim provides the same `c()` memo-cache helper
// using a normal `react` import, so react stays external in the bundle.
import { useMemo } from 'react';

const EMPTY = Symbol.for('react.memo_cache_sentinel');

export function c(size) {
  return useMemo(() => {
    const cache = new Array(size);
    for (let i = 0; i < size; i += 1) cache[i] = EMPTY;
    cache[EMPTY] = true;
    return cache;
  }, [size]);
}

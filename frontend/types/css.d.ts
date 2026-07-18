// frontend/types/css.d.ts
//
// TypeScript 5.6+ added diagnostic ts(2882) for side-effect imports of
// non-module files (e.g. `import './globals.css'`). Next.js 14.2's
// TypeScript plugin doesn't suppress this for plain CSS imports, so we
// declare the module explicitly instead of depending on the plugin.
declare module "*.css";
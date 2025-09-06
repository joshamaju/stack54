# mpa

## 0.11.1

### Patch Changes

- 59b03ab: Provide components as standalone exports to avoid runtime/rendering issues due to platform specific APIs used by some components

## 0.11.0

### Minor Changes

- f3e4231: Add support for custom config file in CLI options

## 0.10.3

### Patch Changes

- 2ba2ea2: Add style tags to bundled assets and fix issue with missing asset in final output if multiple tags reference the same file

## 0.10.2

### Patch Changes

- 89f0397: Add generated version file to distro bundle

## 0.10.1

### Patch Changes

- d465c67: Preserve asset order as defined in source code

## 0.10.0

### Minor Changes

- 4139610: Handoff env handling to vite
- 040ee92: Adds CLI shortcuts to the development server

## 0.9.2

### Patch Changes

- ee62590: Uses consistent naming convention for exported APIs
- 9a73fa2: Adds types for the user and resolved config parameters passed to integration hooks

## 0.9.1

### Patch Changes

- f44ba52: Output final package version

## 0.9.0

### Minor Changes

- d945998: Refactors from effect to effection, in addition with proper error reporting to the console

## 0.8.1

### Patch Changes

- af66f61: Fixes views build failure caused by when no view found in project directory

## 0.8.0

### Minor Changes

- 2152754: Rename HotReload component to LiveReload to properly communicate its purpose, because it actually reloads the page instead of hot module replacement
- 3c97e59: Keep transform hook for only html files. Use vite transform hook for svelte files
- 4a07e92: Use original file extension instead of hardcoded .svelte to support user custom extension i.e markdown (.svex)

### Patch Changes

- f0a541e: Preprocess views before passing on to integrations to improve performance during build

## 0.7.0

### Minor Changes

- cfcb1bc: Remove hook to configure preview server. You should just run the build command and run your application server

### Patch Changes

- 5fcf548: Adds ClientOnly component that only renders its child on client browser
- 2289c26: Switch off emitting css by the vite svelte plugin dev to avoid issues with internal preprocessors getting css content in place of actual component markup
- acb1100: This change speeds up build by skipping views with no client assets and avoids module preload script injected by vite

## 0.6.0

### Minor Changes

- 1bf90c1: Add support for resolving view from multiple locations

### Patch Changes

- 06c05c6: Avoid ending streaming with error if Await promise rejects or errors
- a13d2ea: Make view config entries array only
- 5efe148: Provide environment variables in dev mode
- 8070de9: Only move generated assets if folder exists

## 0.5.2

### Patch Changes

- 4d359ac: Fix package exports

## 0.5.1

### Patch Changes

- c75ad78: Fix core package exports

## 0.5.1

### Patch Changes

- 590a1b1: Remove the wrapping html tag injected during build

## 0.5.0

### Minor Changes

- d2c2888: Export props serialization utils

## 0.4.0

### Minor Changes

- 3ca19cf: Export handler to convert hono instance to a node request handler, which enabled integrating a Hono app with something like express.js

### Patch Changes

- 3e561fb: Include link tag in asset realignment after secondary build

## 0.3.1

### Patch Changes

- fe552e9: Fix invalid html error by vite during build

## 0.3.0

### Minor Changes

- 121e285: Properly support script tags of type module in leaf components

### Patch Changes

- 34b90b9: Add helper to construct locals svelte context
- d2d0b1c: Rename props passing getter and setter functions

## 0.2.0

### Minor Changes

- fdedcab: Add hot reload feature

### Patch Changes

- be749d5: Correctly resolve and load vite virtual modules
- b9c83dd: Set secondary build as production build

## 0.1.0

### Minor Changes

- 20edbce: Add view rendering middleware with views autosuggestion

### Patch Changes

- 9819365: Properly resolve package json file

## 0.0.3

### Patch Changes

- 721358d: Change package name

## 0.0.2

### Patch Changes

- a6bfe4f: Fix release pipeline

## 0.0.1

### Patch Changes

- 90e2eb5: Initial release

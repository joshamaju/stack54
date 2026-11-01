# Configuration and CLI

Stack54 reads `stack.config.js` from the current working directory by default. Export an object or a function that receives the command (`"build"` or `"serve"`). `defineConfig` from `stack54/config` provides a typed helper:

```js
import { defineConfig } from "stack54/config";

export default defineConfig({
  staticDir: "static",
  views: ["src/views/**/*.svelte"],
  entry: "src/entry.{js,ts,mjs,mts}",
  build: {
    outDir: "dist",
    assetsDir: "client",
    assetPrefix: "/",
    minify: true,
    copyStaticDir: false,
  },
});
```

## Options

| Option | Default | Purpose |
| --- | --- | --- |
| `staticDir` | `"static"` | Public/static source directory. |
| `views` | `["src/views/**/*.svelte"]` | View file patterns. |
| `entry` | `"src/entry.{js,ts,mjs,mts}"` | Server entry file pattern, patterns array, or named entry map. |
| `vite` | `{}` | Vite user configuration. |
| `integrations` | `[]` | Stack54 integrations. |
| `build.outDir` | `"dist"` | Build output directory. |
| `build.assetsDir` | `"client"` | Asset subdirectory. |
| `build.assetPrefix` | `"/"` | URL prefix used for built assets. |
| `build.minify` | `true` | Whether build output is minified. |
| `build.copyStaticDir` | `false` | Whether to copy the static directory during build. |
| `env.dir` | unset | Optional environment file directory. |
| `env.publicPrefix` | `"PUBLIC_"` | Prefix for values exposed as public environment values. |
| `svelte.emitCss` | `false` | Whether to emit component CSS as separate assets. |
| `svelte.extensions` | `[".svelte"]` | Svelte file extensions. |
| `svelte.preprocess` | unset | Svelte preprocessors. |
| `svelte.compilerOptions` | `{}` | Svelte compiler options (excluding filename, format, and generate). |

`environments` can provide Vite configuration and integrations separately for `client` and `server`. The exact Vite settings available depend on the installed Vite version.

## CLI

```sh
stack54 dev [--config <path>] [--port <port>]
stack54 build [--config <path>]
```

The default config path is `stack.config.js`. `dev` starts the development pipeline; `build` generates production output. The server process and deployment command remain the application's responsibility.

## Static files and built assets

Static source and build output are separately configurable. The main app output defaults to `dist`, and generated client assets default to `dist/client`. Confirm the framework integration and starter's production server setup before deploying, especially when changing `staticDir`, `outDir`, or `assetPrefix`.

# Follow-up plan: external Svelte CSS assets

**Status:** Existing bug tracked separately; out of scope for the Svelte 5 migration
**Related migration:** [Svelte 5 plan](../migrations/svelte-5.md)
**Issue:** [#286 — Link emitted Svelte CSS assets in rendered views](https://github.com/joshamaju/stack54/issues/286)

## Problem

This is an existing bug independent of the Svelte 5 migration. Stack54 defaults `svelte.emitCss` to `false`, which keeps component styles in Svelte's rendered `head`. When users set it to `true`, Vite emits component styles as separate CSS assets. Stack54 currently rewrites stylesheet links authored directly in a view, but it does not collect the CSS dependencies of imported Svelte components from Vite's build metadata or add those links to the rendered page.

## Goal

When external CSS emission is enabled for a Stack54-built view, include links to the CSS assets required by that view in its HTML response. Keep the default injected-style behavior unchanged.

## Plan

1. **Map Vite metadata to views.** Inspect the client and SSR build manifests for Svelte component CSS dependencies, including transitive imports. Determine how those records map back to each Stack54 view.
2. **Define renderer behavior.** Decide how CSS metadata reaches `renderToString`, streaming responses, and framework integrations. Also decide whether the low-level `renderToString` API without Stack54 build metadata remains a manual-link path or gains an explicit metadata option.
3. **Build a stable CSS manifest.** Store per-view CSS asset paths in Stack54's build manifest. Resolve paths using the configured `assetPrefix` and `assetsDir`; deduplicate shared stylesheets while preserving deterministic order.
4. **Add links to the response head.** Insert `<link rel="stylesheet">` elements for the CSS required by the selected view. Preserve authored links and avoid duplicate tags when an app already includes an emitted file.
5. **Cover development and production.** Confirm that external CSS URLs work with the dev server, production output, copied assets, nested views, lazy component imports, and every supported server integration.
6. **Document the opt-in.** Explain `svelte.emitCss: true`, how Stack54 discovers the required assets, and how users can provide links when rendering components outside the Stack54 build pipeline.

## Acceptance criteria

- With `svelte.emitCss: false`, existing injected styles and `head` output remain unchanged.
- With `svelte.emitCss: true`, a built view links every CSS file required by its Svelte component tree, with no duplicate links.
- Generated URLs honor `assetPrefix` and `assetsDir` and resolve to files present in the production output.
- Lazy and transitive component CSS is included when that component is rendered.
- Low-level rendering without build metadata has a documented, deterministic behavior.
- Existing user-authored stylesheet links continue to work.

## Open decisions

- Whether styles are linked for every component bundled into a view or only for components actually rendered at request time.
- How CSS for dynamically selected components is loaded without sending unrelated stylesheets.
- Whether to expose a public manifest lookup/helper or keep CSS discovery internal to Stack54's renderer.

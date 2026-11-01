# Compatibility and migration

## Stack54 1.x

The current 1.x line requires:

- Node.js `^20.19.0 || >=22.12.0`;
- Svelte `^5.46.4`;
- `@sveltejs/vite-plugin-svelte` `^7.3.1`;
- Vite `^8.0.9`.

Existing Svelte 4 component syntax can remain in use with Svelte 5; converting components to runes is not required. Code that passes components directly to Stack54 must use Svelte 5 `Component` values. Stack54 renders them through `svelte/server`; Svelte 4 constructors, instance `.render()` calls, and `css.code` output are unsupported. Client entry points that instantiate components must use `mount`, `hydrate`, and `unmount` rather than constructors and `$destroy`.

Svelte 5 island components do not support slotted children. Component CSS is included in the server render head by default (`svelte.emitCss: false`). If `emitCss` is enabled, link emitted CSS assets in the document yourself; Stack54 does not add those links automatically.

## Svelte 4 projects

For Svelte 4, use the last compatible Stack54 release, `stack54@0.14.0`, with Svelte `^4.2.8`, `@sveltejs/vite-plugin-svelte` `^3.0.1`, and Vite `^5.3.5`, plus matching integration releases. `@stack54/streaming@0.1.1` is only for this older release line. See the [Svelte 5 migration notes](migrations/svelte-5.md) and [release notes](migrations/svelte-5-release-notes.md) for details.

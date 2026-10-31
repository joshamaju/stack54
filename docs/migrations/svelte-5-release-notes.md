# Svelte 5 migration release notes

## Breaking changes

The next Stack54 major requires Svelte 5. Svelte 4 projects must remain on the final Stack54 release line before this major and use the matching Svelte 4 Vite plugin/toolchain. The new major does not support Svelte 4, including through peer dependency overrides.

The last pre-migration releases are `stack54@0.14.0`, `@stack54/express@1.1.1`, `@stack54/hono@0.1.1`, `@stack54/island@0.3.12`, `@stack54/streaming@0.1.1`, and `@stack54/service-worker@0.1.2`. For Svelte 4, the recommended compatible toolchain is Svelte `^4.2.8`, `@sveltejs/vite-plugin-svelte` `^3.0.1`, and Vite `^5.3.5`.

The migration target is Svelte `^5.57.2`, `@sveltejs/vite-plugin-svelte` `^7.3.1`, and Vite `^8.0.9`. Vite 8 requires Node `^20.19.0 || >=22.12.0`.

## Renderer changes

Core rendering now accepts Svelte 5 `Component` values and uses `svelte/server`'s `render(component, { props, context })`. The render result exposes `body` and `head`; the Svelte 4 `css.code` output is gone. `renderToString` retains Stack54's props/options call shape. With Stack54's default `svelte.emitCss: false`, Svelte injects component styles into the returned `head`.

Applications using `svelte.emitCss: true` must account for the generated CSS assets. Asset discovery and adding stylesheet links to the final HTML are not implemented by this migration; see the separate [external Svelte CSS assets plan](../plans/external-svelte-css-assets.md).

## Islands and streaming

Island components support Svelte 5 hydration and unmount behavior. Islands do not support slotted children in this release. Render those children outside the island boundary.

`@stack54/streaming` is excluded from this major and remains on its Svelte 4 release line. Projects that require it must stay on the pre-major Stack54 releases and must not combine `@stack54/streaming@0.1.1` with Stack54 1.x.

## Legacy Svelte syntax

Svelte 5 supports legacy Svelte 4 component syntax, so this release does not require converting components to runes or snippets. Core and island compiler transforms use Svelte's modern AST with `estree-walker`; the excluded Svelte 4 streaming integration retains its legacy compiler transform.

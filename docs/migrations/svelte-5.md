# Svelte 5 migration plan

**Status:** Migration, release, and verification are complete. Stack54 1.0 and its maintained integrations are published, the tracked example lockfiles resolve to those releases, and the Svelte modern-AST follow-up is merged. Streaming remains excluded from this major.
**Branch:** `migration/svelte-5`
**Supersedes:** [PR #39](https://github.com/joshamaju/stack54/pull/39)

This document tracks the migration of Stack54 and its maintained examples and templates to Svelte 5. Update the checkboxes and notes as work lands. Keep each phase reviewable and record any changes to the support policy here.

## Goal

Support the current Svelte 5 release across Stack54's packages, integrations, examples, and templates, excluding `@stack54/streaming`. This is a breaking major release and the new Stack54 major will require Svelte 5. It will not claim Svelte 4 compatibility. Converting all components to runes is not a prerequisite: Svelte 5 supports Svelte 4 component syntax.

### If a project must stay on Svelte 4

Users who cannot move to Svelte 5 must stay on the last Stack54 release line published before this migration's major release and pin all Stack54 packages/integrations to versions from that line. They must keep Svelte 4 and the matching Svelte Vite plugin/toolchain versions accepted by those pinned Stack54 packages. Upgrading to the new Stack54 major while retaining Svelte 4 is unsupported; peer dependency overrides do not make it compatible.

The last tagged releases before this migration are `stack54@0.14.0`, `@stack54/express@1.1.1`, `@stack54/hono@0.1.1`, `@stack54/island@0.3.12`, `@stack54/streaming@0.1.1`, and `@stack54/service-worker@0.1.2`. Core `0.14.0` declares Svelte `^4.2.8`, plugin `^3.0.1`, and Vite `^5.3.5 || ^7.0.0`; streaming `0.1.1` pins Svelte `4.2.20`. Plugin 3's peer range is Vite 5, so the recommended peer-compatible Svelte 4 toolchain is Svelte `^4.2.8`, `@sveltejs/vite-plugin-svelte` `^3.0.1`, and Vite `^5.3.5`. Core's advertised Vite 7 peer range is not part of that recommendation. Users needing streaming must stay on this pre-major line and must not combine `@stack54/streaming@0.1.1` with Stack54 `1.x`.

## Progress

- [x] Phase 0: Confirm support policy and dependency baseline
- [x] Phase 1: Align Svelte toolchain and workspace dependencies
- [x] Phase 2: Migrate core rendering and component types
- [x] Phase 3: Migrate island hydration (slotted children unsupported)
- [x] Phase 4: Exclude `@stack54/streaming` from this Svelte 5 major
- [x] Phase 5: Update maintained examples and templates
- [x] Phase 6: Validate, document, and release

## Phase 0: Confirm support policy and baseline

- [x] Choose Svelte 5 only for the new major release; Svelte 4 users stay on the final pre-migration Stack54 release line.
- [x] Record the minimum supported Svelte, Vite, plugin, and Node versions.
- [x] Record that the pre-migration build/test baseline was not captured; it cannot be reconstructed retrospectively.
- [x] Inventory every package/app with a Svelte dependency or compiler/runtime API use.

**Current findings:** Svelte declarations appeared across core, integrations, test apps, examples, and templates. Core and package Vite ranges were not uniform. The pre-migration test/build baseline was not captured and is recorded as unavailable. The released-version matrix above was checked against repository release tags and package manifests.

## Phase 1: Align Svelte toolchain and workspace dependencies

- [x] Update Svelte and the Svelte Vite plugin to mutually compatible current versions.
- [x] Set peer/dev dependency ranges requiring Svelte 5 for the new major; retain the verified Svelte 4 matrix in the user migration documentation.
- [x] Update Vite to the major required by the chosen Svelte plugin; keep TypeScript unchanged for now.
- [x] Regenerate the root pnpm workspace lockfile.
- [x] Build core and a representative app under Node 25.
- [x] Declare the Vite 8 Node.js requirement in the core package and generated template manifests.

**Toolchain target:** Svelte `^5.57.2`, `@sveltejs/vite-plugin-svelte` `^7.3.1`, Vite `^8.0.9`; plugin 7.3.1 requires Svelte 5.46.4+ and Vite 8. Vite 8 requires Node `^20.19.0 || >=22.12.0`; the core package and generated templates now declare this in `engines.node`. Recheck these targets before release. See the [plugin 7 release notes](https://github.com/sveltejs/vite-plugin-svelte/releases) and [Vite 8 Node requirements](https://vite.dev/blog/announcing-vite8.html).

**Progress:** Updated tracked package manifests in core, integrations, test apps, examples, and templates. Updated the root pnpm lockfile and both tracked example lockfiles with pnpm 10.14.0. Other example lockfiles are ignored by git. No tracked template lockfiles are present. Workspace lock generation reports peer warnings under ignored experimental `playground/` projects, outside this migration's maintained scope.

**Exit criteria:** workspace dependency installation is represented by the refreshed root lockfile and the root TypeScript build passes. The pre-migration baseline was not captured.

## Phase 2: Migrate core rendering and component types

- [x] Replace Svelte 4 component-class assumptions in the core renderer with Svelte 5 component types.
- [x] Update core static and streaming rendering to call `svelte/server` with `{ props, context }` and consume `body`/`head` output.
- [x] Replace manual insertion of Svelte 4 `render(...).css.code`; Stack54's default `emitCss: false` makes Svelte inject component styles into the server render's `head`.
- [x] Document the renderer API change: components are Svelte 5 `Component` values rendered through `svelte/server`; there is no `css.code` result. Stack54's `renderToString` keeps its props/options call shape.
- [x] Document that default injected CSS is included in `head`; external CSS asset linking remains a separate follow-up.
- [x] Replace removed/deprecated `svelte/compiler.walk` usage in core and maintained integrations.
- [x] Remove Svelte 4's `hydratable` compiler option; Svelte 5 components are always hydratable.
- [x] Review remaining compiler AST assumptions and deprecated/internal Svelte imports.
- [x] Add or update focused coverage for static rendering, props, context, head output, CSS, and lazy components.

**Exit criteria:** core builds and its rendering tests pass using Svelte 5.

## Phase 3: Migrate island hydration (no slotted children)

- [x] Replace the island runtime's Svelte 4 `new Component(...)`, `$destroy`, and private `svelte/internal` use with public `hydrate`/`unmount` APIs.
- [x] Set the Svelte 5 compatibility boundary: island components do not accept slotted children; render that content outside the island boundary.
- [x] Preserve DOM nodes, listeners, and cleanup semantics for the supported no-slot cases; recovery is covered when server markup changes before hydration.
- [x] Cover nested islands, delayed loading, no-slot hydration, changed server markup, and disconnect/unmount cleanup.

**Exit criteria:** browser-level island scenarios hydrate and clean up correctly with Svelte 5.

## Phase 4: Exclude streaming from this major

- [x] Keep `@stack54/streaming` out of the Svelte 5 release; its published `0.1.1` release remains on the Svelte 4 line.
- [x] Document that streaming users must stay on the pre-major Stack54 release line.
- [x] Configure Changesets to ignore `@stack54/streaming` during automated versioning and publishing.

The integration still uses Svelte 4 SSR hooks and is not compatible with the new major. A future Svelte 5 streaming effort requires its own migration plan and release decision. `.changeset/config.json` ignores the package so its queued Changeset cannot version or publish it with Stack54 1.x. Remove the ignore only as part of a separately planned streaming release. Mixed Changesets were split before versioning.

## Phase 5: Update maintained examples and templates

- [x] Update package manifests in maintained examples/templates and point their Stack54 dependency at the new `^1.0.0` core major.
- [x] Replace direct Svelte 4 component constructors in maintained examples and core app fixtures with `hydrate` or `mount`.
- [x] Review Svelte configs and type declarations for Svelte 5 changes.
- [x] Regenerate tracked example pnpm lockfiles after the new core version is published; no tracked template lockfiles exist.
- [x] Keep legacy syntax where Svelte 5 supports it; make targeted changes only where runtime/compiler API compatibility requires them.
- [x] Build representative Express, Hono, standalone, Tailwind, and HTMX projects. The Express and React examples were also installed from their regenerated frozen lockfiles and built against the published packages.
- [x] Check the remaining examples, integration fixtures, and scaffolder output for stale Svelte 4 pins.

**Exit criteria:** generated projects install and build using the documented Svelte 5 toolchain.

## Phase 6: Validate, document, and prepare release

- [x] Run the included TypeScript workspace build under supported Node; streaming is intentionally omitted.
- [x] Run included test suites and relevant browser/integration checks sequentially. Root `pnpm test` excludes `@stack54/streaming`; its Svelte 4 line remains to be validated separately.
- [x] Search for stale Svelte 4 pins, `SvelteComponent` class APIs, `.render(...)`, `$destroy`, and private `svelte/internal` imports; review each remaining result.
- [x] Use Svelte's modern AST and `estree-walker` in core and island transforms; keep the excluded Svelte 4 streaming transform on its legacy AST.
- [x] Document that Svelte 5 island components do not support slotted children.
- [x] Document the Node.js floor, Svelte 4 path, and streaming exclusion in the root README and migration notes.
- [x] Add the Svelte 5 exclusion notice to the streaming integration README.
- [x] Prepare release notes with the exact compatibility matrix and breaking-change summary.
- [x] Add Changesets with the correct release levels for the selected compatibility policy.
- [x] Exclude the streaming integration from this major and describe its separate Svelte 4 release line.
- [x] Record final supported dependency ranges and known limitations here; recheck version availability immediately before release.
- [x] Publish the automated release and confirm `stack54@1.0.0`, `@stack54/express@1.1.3`, `@stack54/hono@0.1.3`, `@stack54/island@0.4.0`, and `@stack54/service-worker@0.1.4`; verify `@stack54/streaming` remains at its Svelte 4 release.

## Working notes

- PR #39 is a reference for prior experiments, not the implementation baseline. It is broad, uses older Svelte 5/toolchain versions, and its island slot conversion needs redesign and explicit DOM/hydration coverage.
- Upgrade to the latest compatible Svelte 5 release at implementation time; do not target SvelteKit changes unless Stack54 adopts SvelteKit (it currently does not).
- Svelte 5 accepts legacy Svelte 4 syntax. Treat runes/snippets adoption as a separate component migration from the compiler/runtime upgrade.
- Do not run `sv migrate svelte-5` as a blanket sweep. Targeted source changes already replace the removed component constructor/render APIs; legacy event and component syntax can remain unless a specific feature requires the newer API.
- Stack54 `1.0.0` and maintained integrations are published. The tracked examples use `stack54: ^1.0.0` and their pnpm lockfiles now resolve to the published packages.
- Stack54 defaults to `svelte.emitCss: false`; with Svelte 5 this uses injected styles, which are included in the `head` returned by `svelte/server.render`. External CSS asset discovery/linking is explicitly out of scope for this migration; see the [follow-up plan](../plans/external-svelte-css-assets.md).
- Core build/render coverage passes. External CSS asset discovery and linking are explicitly deferred to the [separate follow-up plan](../plans/external-svelte-css-assets.md), rather than being a migration exit criterion. Island hydration uses public Svelte 5 lifecycle APIs and the supported no-slot cases pass browser coverage. Slotted children are an intentional unsupported case for this major, not pending work.
- Replaced the local legacy AST traversal helpers in core asset collection, dev path rewriting, and island processing with `estree-walker` and Svelte's modern AST (`modern: true`). The Svelte 4 streaming integration remains excluded and retains its legacy compiler transform.
- A source scan found no remaining private `svelte/internal` imports or Svelte 4 component constructors/lifecycle calls in maintained code. The streaming integration still relies on `Component.$$render` and legacy slot fragments; that is isolated in Phase 4.
- Existing example components still use `createEventDispatcher`, which Svelte 5 deprecates but continues to support. Keep that legacy syntax unless a specific component needs callback props for its migration; runes and event syntax conversion are not required for Svelte 5 compatibility.
- The maintained repository has no tracked `svelte.config.*` or `vite.config.*` files to migrate. Existing `env.d.ts` declarations reference Svelte's types, and the HTMX template's `svelteHTML.HTMLAttributes` augmentation remains an app-specific declaration; no Svelte 5-specific declaration change was identified.
- `@stack54/streaming` still intercepts Svelte 4's generated `$$render` function and is intentionally excluded from this major. Its prior Svelte 4 release requires Stack54 `0.14.x`; do not publish it with a dependency on the new core major.
- The final compatibility scan found no stale Svelte 4 pins in maintained examples, templates, or the included integrations. Svelte 4 pins and the original Svelte 4 compiler transform are intentionally retained under `integrations/streaming`, including its fixture app; do not include this package in 1.x versioning or publication. The root lockfile was regenerated after restoring those excluded workspace manifests.
- Initial lockfile regeneration used system Node `18.20.8`, below the declared Vite 8/core requirement, and pnpm emitted an engine warning. Dependency installation and the successful workspace build were subsequently run under Node 25.
- The first Svelte 5 workspace build under Node 25 exposed an `Arrayable` type import that the new Svelte Vite plugin no longer exports; core config now declares the small local `T | T[]` helper instead. The build also tried to compile the explicitly excluded Svelte 4 streaming integration and failed against the changed workspace config/compiler APIs. The root build references now omit streaming; keep it on its separate Svelte 4 maintenance/release path.
- The core basic app fixture had its island integration commented out, so Svelte 5 treated Stack54's `<script island="...">` marker as an unknown attribute. The fixture now enables `@stack54/island`; its production build passes without those warnings.
- The Svelte 4 API scan found no remaining component-class constructors, `$destroy`, or private `svelte/internal` imports in the included migration scope. Remaining `.render(...)` calls belong to Stack54/framework view-rendering APIs; the Svelte `Component.$$render` dependency is isolated to excluded streaming. Core and island AST transforms use Svelte's modern AST and `estree-walker`.
- `.changeset/bright-islands-hydrate.md` recorded the Svelte 5 breaking change as a core major and island minor. The automated release workflow applied the Changesets and left `@stack54/streaming` out of the release.
- Island hydration now uses `hydrate(Component, { target, props })`, but the old `$$slots`/`slotty` bridge is removed. For the Svelte 5 major, island components must not receive slotted children; render that content outside the island boundary. This is an intentional limitation, not an unresolved migration item.
- Svelte 5 exposes `Snippet` props and `createRawSnippet`, but a snippet created from captured `innerHTML` would only reproduce markup; it would not recreate the parent component's compiled behavior or event handlers. The no-slotted-children boundary avoids treating an HTML snapshot as a replacement for the old slot bridge. See [Svelte snippets](https://svelte.dev/docs/svelte/snippet), [createRawSnippet](https://svelte.dev/docs/svelte/svelte#createrawsnippet), and [hydrate](https://svelte.dev/docs/svelte/svelte#hydrate).
- The former commented island scenarios are replaced by active coverage for no-slot hydration, nested islands, delayed hydration, markup changes, cleanup, and merged head output. Slotted children are intentionally excluded.
- Updated the SSR SPA example to call `svelte/server.render(ServerApp, { props })` and use its `body` and `head`; removed its dependency on the legacy `css.code` result.
- Updated client examples and app fixtures to call the public Svelte 5 `hydrate` API when server markup exists and `mount` for the empty counter target.
- The included workspace tests pass sequentially, including Express/Hono integration fixtures and the core basic app's 25 browser tests. Running all workspace projects concurrently caused the invalid-entry test to exceed its timeout while nested Playwright installs ran; the root `test` script now uses workspace concurrency 1. The streaming integration remains excluded by design.
- The root TypeScript workspace build passes under Node 25. Production builds passed for the core basic Express fixture and Hono default fixture. Browser tests reported no island marker warnings after enabling the island integration in the basic fixture. Svelte still reports the compatibility `Await.resolve` property warning; this migration retains legacy component syntax supported by Svelte 5.
- Svelte 5 renders `undefined` interpolations as empty text; the affected environment/locals browser assertions now check the actual output. The ClientOnly fixture now uses `onMount` so its content is absent from SSR and appears after mount, and its dedicated fixture is kept separate from island auto-hydration.
- Added [Svelte 5 release notes](./svelte-5-release-notes.md). The first post-release workflow run stopped before publishing because an ignored streaming-only Changeset remained. [PR #294](https://github.com/joshamaju/stack54/pull/294) removed that stale file; [the rerun](https://github.com/joshamaju/stack54/actions/runs/41200495707) published Stack54 1.0 and maintained integrations while skipping the already-published Svelte 4 streaming package.
- Standalone, Tailwind, and HTMX template production builds pass using temporary local tarballs from the merged Svelte 5 source. The published-version Express and React examples now also install with frozen lockfiles and build successfully. HTMX reports three existing label/control accessibility warnings.

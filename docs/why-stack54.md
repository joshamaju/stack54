# Why Stack54?

Stack54 combines modern web tooling with the directness of traditional server rendered applications. It brings component based composition, TypeScript-aware props, and editor support to server rendered HTML, while leaving the application server and request lifecycle in your hands.

Traditional server templates are often composed with named partials, includes, or layouts. Those systems work well, but when a template is referenced by a string or path, mistakes can surface only at runtime and editors may not know the component's props. This varies by engine and setup; some template systems provide typed helpers or component support.

Stack54 currently uses Svelte as its templating language. A view can import and compose components directly, and TypeScript can describe their props:

```svelte
<!-- components/Greeting.svelte -->
<script lang="ts">
  interface Props {
    name: string;
  }

  let { name }: Props = $props();
</script>

<p>Hello, {name}.</p>
```

```svelte
<!-- views/home.page.svelte -->
<script lang="ts">
  import Greeting from "../components/Greeting.svelte";
</script>

<main>
  <Greeting name="Ada" />
</main>
```

The component relationship is an import, and Svelte language tooling can provide prop diagnostics and editor support. Stack54 renders the view on the server; Svelte is the current template implementation, not a requirement that the application use Svelte as its browser UI framework.

Stack54's `dev` and `build` commands compile the application through Vite, but they do not run a full application wide Svelte/TypeScript type check. Add the type checking tool and script that fit your project if you want those diagnostics in CI.

## Ship only the JavaScript you choose

Stack54 does not inject a client framework runtime or hydrate every page by default. Add the browser scripts you need explicitly, or opt specific components into client interactivity with the [island integration](integrations.md#islands). This lets mostly static pages stay mostly HTML and gives the application control over how much JavaScript reaches the browser.

## How the approaches differ

| Approach | Composition and typing | Server and request handling |
| --- | --- | --- |
| Traditional template engine | Often uses template-specific partial/layout references. Type checking and editor support vary by engine and tooling. | Depends on the surrounding server framework. |
| Full-stack framework | Usually provides an integrated component model and may add routing, data loading, and client runtime conventions. | The framework defines much of the application lifecycle. |
| Stack54 | Uses Svelte components and typed props for template composition. | Your application chooses the server and request lifecycle. Client JavaScript is explicit, with optional islands for interactive components. |

These are broad patterns, not hard boundaries. Template engines and full-stack frameworks differ, and some offer component imports, type checking, or flexible server adapters too.

## What Stack54 is for

Stack54 lets you use modern tools such as Svelte components, TypeScript, and Vite while keeping the traditional web model direct: the server returns HTML, assets are explicit, and the application controls the request lifecycle. You keep control of:

- routing and request handling;
- the server framework or runtime;
- how and whether browser JavaScript is shipped;
- the deployment and static asset serving strategy.

That flexibility means you also own more of the application wiring. Stack54 does not provide a router, data loading model, or universal production server. See [Core concepts](core-concepts.md), [Integrations](integrations.md), and [Deployment](deployment.md) for those boundaries.

## Current implementation

Svelte is the current templating language. Stack54's server, integration, and build model is designed around explicit boundaries; another template integration could be explored separately without changing the goal of keeping application server behavior under user control.

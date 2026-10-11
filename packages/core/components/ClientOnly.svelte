<!-- Avoid rendering browser-only content during server-side rendering. -->
{#if typeof window != "undefined"}
  <slot />
{/if}

<script lang="ts">
  type T = $$Generic<T>;

  interface $$Slots {
    error: { error: Error };
    default: { value: T };
    fallback: any;
  }

  export let resolve: PromiseLike<T> = null;
  const error = null as any as Error;
  const value = null as any as T;
</script>

{#if typeof window == "undefined"}
  <slot name="error" {error} />
  <slot name="fallback" />
  <slot {value} />
{:else}
  {#await resolve}
    <slot name="fallback" />
  {:then value}
    <slot {value} />
  {:catch error}
    <slot name="error" {error} />
  {/await}
{/if}

<script lang="ts" generics="T">
  import type { Snippet } from "svelte";

  interface Props {
    resolve: PromiseLike<T>;
    fallback: Snippet<[any]>;
    children: Snippet<[value: T]>;
    error: Snippet<[error: Error]>;
  }

  const {
    children,
    error: error_,
    resolve = null,
    fallback: fallback_,
    ...rest
  }: Props = $props();
</script>

<!-- <svelte:head>
  {#if typeof window == "undefined"}
    {#if rest.internal}
      {#if rest.internal.state == "pending"}
        <script data-await-swap-script>
          window.__AWAIT_SWAP__ = function (id) {
            var script = document.querySelector(
              '[data-await-swap-init-script="' + id + '"]'
            );
            var template = document.querySelector('[data-await="' + id + '"]');
            var fallback = document.querySelector(
              '[data-await-fallback="' + id + '"]'
            );
            fallback.replaceWith(template.content);
            template.remove();
            script.remove();
          };

          document.addEventListener("DOMContentLoaded", () => {
            var patcher = document.querySelector("[data-await-swap-script]");
            // patcher.remove();
          });
        </script>
      {/if}
    {/if}
  {/if}
</svelte:head> -->

{#if typeof window == "undefined"}
  {#if rest.internal}
    {#if rest.internal.state == "pending"}
      <div style="display: contents;" data-await-fallback={rest.internal.id}>
        {@render fallback_?.()}
      </div>
    {:else if rest.internal.state == "error"}
      {@render error_?.(rest.internal.error)}
    {:else}
      {@render children?.(rest.internal.value)}
    {/if}
  {/if}
{:else}
  {#await resolve}
    {@render fallback_?.()}
  {:then value}
    {@render children?.(value)}
  {:catch error}
    {@render error_?.(error)}
  {/await}
{/if}

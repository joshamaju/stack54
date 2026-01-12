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

<slot name="error" {error} />
<slot name="fallback" />
<slot {value} />

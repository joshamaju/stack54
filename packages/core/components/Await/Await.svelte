<script lang="ts">
  type T = $$Generic<T>;

  interface $$Slots {
    /** Rejected promises render this slot; resolved promises use the default. */
    error: { error: Error };
    default: { value: T };
    fallback: any;
  }

  export let resolve: PromiseLike<T> = null;
  /** The Node SSR wrapper supplies these slot values when the promise settles. */
  const error = null as any as Error;
  const value = null as any as T;
</script>

<slot name="error" {error} />
<slot name="fallback" />
<slot {value} />

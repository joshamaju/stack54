# stack54

> The fun Javascript stack

## Background

stack54 is a build tool for building optimized multi page applications. We use svelte templates (instead of ejs, pug etc), which saves us from the brittleness of partials and layouts. And also we get full control over how our static assets like js and css are located (instead of placing everything in [project]/public/(js,css)).

## Features

- 🔌 BYOR (Bring Your Own Router)
- 📡 Streaming
- 🏝 Islands
- 🔗 Integrations

## Integrations

- [island](/integrations/island)
- [express](/integrations/express)
- [hono](/integrations/hono)

## Streaming

```svelte
<script>
  import Await from "stack54/components/Await";

  const wait = (ms, value) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms, value);
    });
  };
</script>

<Await let:value resolve="{wait(1000, 10)}">
    <p slot="error" let:error>{error}</p>
    <p slot="fallback">loading...</p>
    <p>{value}</p>
</Await>
```

## Examples

- [express](/examples/with-express)
- [react](/examples/with-react)
- [svelte](/examples/with-svelte)

## License

[MIT](https://github.com/joshamaju/stack54/blob/main/LICENSE)

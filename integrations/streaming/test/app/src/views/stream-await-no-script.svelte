<!-- __HEAD_INSERT__ -->

<div data-testid="native-await">
  {#await new Promise((rs) => setTimeout(rs, 1000, "Success"))}
    <div>Loading Native...</div>
  {:then value}
    <div>Native: {value}</div>
  {:catch error}
    <div>Error: {error}</div>
  {/await}
</div>

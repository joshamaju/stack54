<script lang="ts">
  import type { User } from "../types/user";
  import Document from "./components/document.entry.svelte";
  export let user: User;
</script>

<Document>
  <svelte:fragment slot="head">
    <link rel="stylesheet" href="./welcome.css" />
    <script type="module" src="./welcome.ts"></script>
  </svelte:fragment>

  <section class="h-full flex">
    <main class="m-auto text-center">
      <div hx-target="this" hx-swap="outerHTML">
        <div><label>First Name</label>: {user.first_name}</div>
        <div><label>Last Name</label>: {user.last_name}</div>
        <div><label>Email</label>: {user.email}</div>
        <button hx-get="/contact">Click To Edit</button>
      </div>
    </main>
  </section>
</Document>

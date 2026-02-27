<script lang="ts">
  import { Head } from "stack54/components";
  import type { User } from "../types/user";

  export let user: User;
</script>

<svelte:head>
  <Head />
</svelte:head>

<form hx-target="this" hx-put="/contact" hx-swap="outerHTML">
  <div>
    <label>First Name</label>
    <input type="text" name="first_name" value="{user.first_name}" />
  </div>
  <div class="form-group">
    <label>Last Name</label>
    <input type="text" name="last_name" value="{user.last_name}" />
  </div>
  <div class="form-group">
    <label>Email Address</label>
    <input type="email" name="email" value="{user.email}" />
  </div>

  <div class="space-x-4">
    <button type="submit">Submit</button>
    <button hx-get="/">Cancel</button>
  </div>
</form>

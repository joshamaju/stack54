<script lang="ts">
  import type { Task as ITask } from "../types/task";
  import Task from "./task.svelte";

  export let tasks: ITask[];
</script>

<div class="flex flex-col gap-2 pt-2 w-full">
  {#each tasks as task}
    <Task {task} on:remove />
  {/each}
</div>

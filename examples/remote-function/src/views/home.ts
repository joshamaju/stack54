import { decode } from "stack54";
import Todo from "./islands/todo.svelte";
import type { Task } from "./types/task";

const tasks = decode("TASKS") as Task[];
const target = document.getElementById("tasks-container")!;

new Todo({ hydrate: true, target, props: { tasks } });

import { hydrate } from "svelte";
import { decode } from "stack54/data";
import Todo from "./islands/todo.svelte";
import type { Task } from "./types/task";

const tasks = decode("TASKS") as Task[];
const target = document.getElementById("tasks-container")!;

hydrate(Todo, { target, props: { tasks } });

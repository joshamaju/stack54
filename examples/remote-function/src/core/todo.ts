import { fn$ } from "thaler";
import { debounce } from "thaler/utils";
import type { Task } from "../views/types/task";

export let tasks: Task[] = [];

export const saveTodo = debounce(
  fn$(async (todos: Task[]) => {
    // const tasks = JSON.stringify(todos);
    // const module = await import("../utils/session");
    // const { setCookie } = await import("hono/cookie");
    // setCookie(module.getContext(), "tasks", tasks);

    tasks = todos;
  }),
  { key: () => "tasks" }
);

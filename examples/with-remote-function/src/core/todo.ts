import { fn$ } from "thaler";
import { debounce } from "thaler/utils";
import type { Task } from "../views/types/task";
import { setTasks } from "./tasks";

export const saveTodo = debounce(
  fn$(async (todos: Task[]) => {
    setTasks(todos);
  }),
  { key: () => "tasks" }
);

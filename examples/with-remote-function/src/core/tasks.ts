import type { Task } from "../views/types/task";

export let tasks: Task[] = [];

export function setTasks(todos: Task[]) {
  tasks = todos;
}

export function getTasks() {
  return tasks;
}

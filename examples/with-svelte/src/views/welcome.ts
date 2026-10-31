import { mount } from "svelte";
import Counter from "./components/counter.svelte";

const container = document.getElementById("counter")!;

mount(Counter, { target: container });

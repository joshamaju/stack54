import Counter from "./components/counter.svelte";

const container = document.getElementById("counter")!;

new Counter({ hydrate: true, target: container });

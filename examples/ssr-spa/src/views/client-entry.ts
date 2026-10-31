import { hydrate } from "svelte";
import { decode } from "stack54/data";
import { ClientApp } from "svelte-pilot";
import router from "../router";

const props = decode("data") as any;
const target = document.getElementById("app")!;

router.start(
  () => hydrate(ClientApp, { target, props: { router } }),
  { ssrState: props.__SSR_STATE__ }
);

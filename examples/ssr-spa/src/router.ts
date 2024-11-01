import { Router } from "svelte-pilot";

export default new Router({
  routes: [
    {
      component: () => import("./views/layout.svelte"),
      children: [
        {
          path: "/",
          component: () => import("./views/pages/home.svelte"),
        },

        {
          path: "/about",
          component: () => import("./views/pages/about.svelte"),
        },
      ],
    },
  ],
});

import { dedent } from "ts-dedent";

export const controller = ({ param }: { param: string }) => dedent`
import type {Context} from "hono";

/**
 * Return list of all posts or paginate through them
 */
export async function index(ctx: Context) {}

/**
 * Render the form to create a new post.
 * 
 * Not needed if you are creating an API server.
 */
export async function create(ctx: Context) {}

/**
 * Handle form submission to create a new post
 */
export async function store(ctx: Context) {}

/**
 * Display a single post by id.
 */
export async function show(ctx: Context) {
    const id = ctx.req.param('${param}');
}

/**
 * Render the form to edit an existing post by its id.
 * Not needed if you are creating an API server.
 */
export async function edit(ctx: Context) {
    const id = ctx.req.param('${param}');
}

/**
 * Handle the form submission to update a specific post by id
 */
export async function update(ctx: Context) {}

/**
 * Handle the form submission to delete a specific post by id.
 */
export async function destroy(ctx: Context) {
    const id = ctx.req.param('${param}');
}
`;

export const router = ({ param }: { param: string }) => dedent`
import {Hono} from "hono";
import * as controller from "./controller.js";

const router = new Hono();

router.get('/', controller.index);
router.post('/', controller.store);

router.get('/new', controller.create);

router.get('/:${param}', controller.show);
router.get('/:${param}/edit', controller.edit);

router.put('/:${param}', controller.update);
router.patch('/:${param}', controller.update);
router.delete('/:${param}', controller.destroy);

export default router;
`;

type Inflection = {
  plural: string;
  singular: string;
};

export const view_index = (
  name: Inflection,
  title: Partial<Inflection>
) => dedent/* html */ `
<script lang="ts">
    export let ${name.plural}: any[];
</script>

<h1>${title.plural}</h1>

<ul>
  {#each ${name.plural} as ${name.singular}}
    <li>
      {@html link_to(${name.singular}.title, ${name.singular})}
    </li>
  {/each}
</ul>
`;

export const view_new = (
  name: Inflection,
  title: Partial<Inflection>
) => dedent/* html */ `
<script>
    const form = createForm();
</script>

<h1>New ${title.singular}</h1>

<form.Form>
  <div>
    {@html form.label("title")}<br>
    {@html form.text_field("title")}
  </div>

  <div>
    <%= form.label :body %><br>
    {@html form.text_are(:"body")}
  </div>

  <div>
    {@html form.submit}
  </div>
</form.Form>
`;

# Standalone Express starter

This starter runs the Express server directly and rebuilds views separately. Install dependencies, then start both watchers in separate terminals:

```sh
# Terminal 1: server watcher
npm run dev

# Terminal 2: Stack54 view/build watcher
npm run view:dev
```

Run a one-time view build with:

```sh
npm run view:build
```

The starter currently has no production `start` script. See [Development workflows](../../docs/development-and-deployment.md) and [Deployment](../../docs/deployment.md) before adapting it for production.

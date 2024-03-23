import fs from "node:fs";
import path from "node:path";
import { dedent } from "ts-dedent";
import { Config } from "../config/options";
import { relative_path } from "../../vite/utils/filesystem";

export const server_fileName = "server.js";

export function write_server(
  config: Config,
  {
    outDir,
    publicDir,
    middlewares,
  }: {
    outDir: string;
    publicDir: string;
    middlewares: string[];
  }
) {
  const imports: string[] = [];

  for (let i = 0; i < middlewares.length; i++) {
    const file = middlewares[i];
    const src = relative_path(outDir, file);
    imports.push(`import $${i}_middleware from "${src}";`);
  }

  fs.writeFileSync(
    path.join(outDir, server_fileName),
    dedent`
    import sirv from 'sirv';
    import wsAdapter from "crossws/adapters/node";
    import {createApp, toNodeListener, fromNodeMiddleware} from 'h3';
    import router from '${relative_path(outDir, config.serverEntry)}';
    
    const assets = sirv('${publicDir}', {
        etag: true,
        gzip: true,
        brotli: true,
        setHeaders(res, pathname) {
            // only apply to build directory, not e.g. /public/assets
            if (pathname.startsWith('/assets') && res.statusCode === 200) {
                res.setHeader('cache-control', 'public,max-age=31536000,immutable');
            }
        }
    });
    
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';

    const app = createApp();
    const { handleUpgrade } = wsAdapter(app.websocket);
    
    app.use(fromNodeMiddleware(assets));
    
    // middlewares
    ${middlewares.map((_, i) => `app.use($${i}_middleware)`).join(";\n")}
    
    app.use(router);
    
    const server = createServer(toNodeListener(app));
    
    server.on("upgrade", handleUpgrade);

    let shutdown_timeout_id;

    function shutdown() {
        if (shutdown_timeout_id) return;
        
        server.closeIdleConnections();
        
        server.close(() => {
            if (shutdown_timeout_id) {
                shutdown_timeout_id = clearTimeout(shutdown_timeout_id);
            }
            
            if (idle_timeout_id) {
                idle_timeout_id = clearTimeout(idle_timeout_id);
            }
        });
        
        shutdown_timeout_id = setTimeout(
            () => server.closeAllConnections(),
            shutdown_timeout * 1000
        );
    }
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    server.listen(port, () => {
        console.log(\`Listening on \${host + ':' + port\}\`);
    });
    `
  );
}

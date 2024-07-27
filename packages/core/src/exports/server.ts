import type { Hono } from "hono";
import { IncomingMessage, ServerResponse } from "node:http";

import { getRequest, setResponse } from "../core/request.js";

export function toNodeHandler(app: Hono) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const protocol = (req.connection as any)?.encrypted ? "https" : "http";

    const base = `${protocol}://${
      req.headers[":authority"] || req.headers.host
    }`;

    const response = await app.fetch(getRequest({ base, request: req }));

    setResponse(res, response);
  };
}

export { getRequest, setResponse };

import { Plugin } from "vite";
import { previewServer } from "./server.js";

export function plugin_previewServer(): Plugin {
  return {
    name: "mpa:preview-server",
    configurePreviewServer(server) {
      return () => previewServer(server);
    },
  };
}

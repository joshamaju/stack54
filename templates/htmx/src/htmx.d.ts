import Htmx from "htmx.org";

declare global {
  interface Window {
    htmx: typeof Htmx;
  }

  var htmx: typeof Htmx;
}

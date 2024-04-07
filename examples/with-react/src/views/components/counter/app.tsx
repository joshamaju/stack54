import React from "react";
import ReactDOM from "react-dom/client";
import Counter from "./Counter.tsx";

ReactDOM.createRoot(document.getElementById("counter")!).render(
  <React.StrictMode>
    <Counter />
  </React.StrictMode>
);

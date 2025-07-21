import React from "react";
import ReactDOM from "react-dom/client";

// Tailwind’s base / component / utility layers.
// ⚠️  Make sure index.css includes the three @tailwind directives.
import "./index.css";

// Your root component (the one we’ve been editing in the canvas)
import App from "./App";

// StrictMode helps surface problems in development
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

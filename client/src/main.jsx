import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import AuthGate from "./auth/AuthGate";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthGate>
    <App />
  </AuthGate>
);

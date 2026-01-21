import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import "./i18n";   // 🔥 i18n burada yüklenecek

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Suspense fallback={<div></div>}>
    <App />
  </Suspense>
);

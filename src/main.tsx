import "./polyfills";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./context/ThemeContext";
import { PlanProvider } from "./context/PlanContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <PlanProvider>
        <App />
      </PlanProvider>
    </ThemeProvider>
  </StrictMode>
);

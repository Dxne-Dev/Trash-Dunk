import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AutoWorkflowScenario } from "./components/AutoWorkflowScenario";

const isWorkflowMode = window.location.search.includes("workflow=demo");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isWorkflowMode ? <AutoWorkflowScenario /> : <App />}
  </StrictMode>
);

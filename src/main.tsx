import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AutoWorkflowScenario } from "./components/AutoWorkflowScenario";
import { DesktopOverlayMode } from "./components/DesktopOverlayMode";

// Détection de l'environnement Tauri (Application Windows Native)
const isTauriDesktop = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const isWorkflowMode = window.location.search.includes("workflow=demo");

// Désactiver le menu contextuel par défaut du navigateur (Actualiser, Imprimer, Enregistrer sous...)
// pour une expérience logicielle desktop fluide et 100 % native
if (isTauriDesktop) {
  window.addEventListener("contextmenu", (e) => e.preventDefault());
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isTauriDesktop ? (
      <DesktopOverlayMode />
    ) : isWorkflowMode ? (
      <AutoWorkflowScenario />
    ) : (
      <App />
    )}
  </StrictMode>
);

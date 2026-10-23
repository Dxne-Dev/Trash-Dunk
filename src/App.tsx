import { Download } from "@/components/Download";
import { Footer, Nav, Ribbon, Toaster } from "@/components/Chrome";
import { MeterAnatomy } from "@/components/MeterAnatomy";
import { Opener } from "@/components/Opener";
import { Playbook } from "@/components/Playbook";
import { Roadmap } from "@/components/Roadmap";
import { SpecSheet } from "@/components/SpecSheet";
import { Trigger } from "@/components/Trigger";
import { DunkProvider } from "@/state/dunk";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const RIBBON_TOP = [
  "Dunk it",
  "Delete it",
  "Swish ≤ 2 %",
  "2 swishs = COLD",
  "Air ball > 15 %",
  "Corbeille Windows",
  "Streak ×5",
  "Échap = rien n'est supprimé",
];

const RIBBON_TECH = [
  "Tauri v2 · Rust",
  "React 19 · Vite",
  "Overlay topmost transparent",
  "Verbe shell Windows",
  "trash-rs Corbeille",
  "Zéro télémétrie",
  "Léger & rapide",
];

export default function App() {
  return (
    <ErrorBoundary>
      <DunkProvider>
        <div id="top" className="relative min-h-screen">
          <div className="arena-bg" aria-hidden />
          <div className="arena-lines" aria-hidden />
          <div className="noise-layer" aria-hidden />

          <Nav />

          <main className="relative">
            <Ribbon items={RIBBON_TOP} tone="orange" />
            <Opener />
            <Ribbon items={RIBBON_TECH} reverse />
            <Trigger />
            <MeterAnatomy />
            <Playbook />
            <Roadmap />
            <SpecSheet />
            <Download />
          </main>

          <Footer />
          <Toaster />
        </div>
      </DunkProvider>
    </ErrorBoundary>
  );
}

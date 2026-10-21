import { useState, useEffect } from "react";
import { Download } from "@/components/Download";
import { Footer, Nav, Ribbon, Toaster } from "@/components/Chrome";
import { MeterAnatomy } from "@/components/MeterAnatomy";
import { Opener } from "@/components/Opener";
import { Playbook } from "@/components/Playbook";
import { Roadmap } from "@/components/Roadmap";
import { SpecSheet } from "@/components/SpecSheet";
import { Trigger } from "@/components/Trigger";
import { AutoDemoModal } from "@/components/AutoDemoModal";
import { DunkProvider } from "@/state/dunk";

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
  "C# · .NET 8",
  "WPF overlay topmost",
  "Verbe shell",
  "SQLite stats",
  "NAudio",
  "Inno Setup",
  "Zéro télémétrie",
  "4,2 Mo",
];

export default function App() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShowDemoModal(true);
    window.addEventListener("trashdunk:open-autodemo", handleOpen);
    return () => window.removeEventListener("trashdunk:open-autodemo", handleOpen);
  }, []);

  return (
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
        <AutoDemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
      </div>
    </DunkProvider>
  );
}

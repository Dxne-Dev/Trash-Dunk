import { useEffect, useState } from "react";
import { ExplorerDemo } from "@/components/ExplorerDemo";
import { Arena } from "@/components/arena/Arena";
import { DunkProvider } from "@/state/dunk";

export function AutoWorkflowScenario() {
  const [phase, setPhase] = useState<"explorer" | "arena">("explorer");

  useEffect(() => {
    // 0s à 4s : Explorateur avec clic droit simulé
    // 4s à 12s : Terrain de basket avec shoots
    const interval = setInterval(() => {
      setPhase((p) => (p === "explorer" ? "arena" : "explorer"));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <DunkProvider>
      <div className="relative min-h-screen bg-arena-950 text-chalk p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-[1100px]">
          {phase === "explorer" ? (
            <div className="animate-in fade-in duration-500">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded bg-dunk-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Étape 1 : Clic Droit Windows Explorer
                </span>
                <span className="text-xs text-chalk-dim">Sélectionnez et cliquez sur « Dunk it »</span>
              </div>
              <ExplorerDemo />
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded bg-swish px-3 py-1 text-xs font-bold uppercase tracking-wider text-arena-950">
                  Étape 2 : Le Parquet & Swish
                </span>
                <span className="text-xs text-chalk-dim">Enchaînez les dunks dans la corbeille !</span>
              </div>
              <Arena />
            </div>
          )}
        </div>
      </div>
    </DunkProvider>
  );
}

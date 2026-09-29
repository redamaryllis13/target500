"use client";

import { useState, useEffect } from "react";
import { useMapStore } from "@/store/map-store";
import { X, ChevronRight, ChevronLeft, Info, Database } from "lucide-react";

export function AssetSidePanel() {
  const { selectedFeature, setSelectedFeature } = useMapStore();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (selectedFeature) {
      setIsOpen(true);
    }
  }, [selectedFeature]);

  return (
    <div 
      className={`absolute top-0 right-0 h-full w-80 bg-background/95 backdrop-blur-md shadow-2xl z-[1000] flex flex-col pointer-events-auto transition-transform duration-300 ease-in-out border-l border-border ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-1/2 -left-8 -translate-y-1/2 flex items-center justify-center w-8 h-16 bg-background border-y border-l border-border rounded-l-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.5)] cursor-pointer"
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {selectedFeature ? (
        <>
          <div className="flex justify-between items-center p-5 border-b border-border bg-muted/30 shrink-0">
            <h2 className="text-lg font-bold text-primary truncate pr-2 flex items-center gap-2">
              <Database size={18} />
              Détails de l'entité
            </h2>
            <button
              onClick={() => setSelectedFeature(null)}
              className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Fermer les détails"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
            <div className="space-y-4 bg-card p-4 rounded-xl border border-border break-words">
              {Object.entries(selectedFeature).map(([key, value]) => {
                if (key.startsWith('_') || typeof value === 'object') return null;
                
                return (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-foreground font-medium mt-0.5">
                      {value ? String(value) : "-"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 flex flex-col h-full text-muted-foreground">
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4 shrink-0">
            <div className="p-2 bg-muted rounded-lg text-primary">
              <Info size={24} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Socle Carto
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 text-sm leading-relaxed pr-2">
            <p>Bienvenue sur votre environnement cartographique générique.</p>
            <p>Ce panneau contextuel est prévu pour héberger les instructions globales, la légende de vos futures cartes, ou des statistiques transverses.</p>
            
            <div className="mt-8 p-4 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
                État du système
              </p>
              <ul className="space-y-3 text-xs">
                <li className="flex justify-between items-center">
                  <span>Moteur de rendu</span> 
                  <span className="text-foreground bg-muted px-2 py-1 rounded">MapLibre GL</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Dossier /public</span> 
                  <span className="text-primary font-medium">En attente de couches</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-border text-xs text-center shrink-0">
            V 0.1.0 — Architecture Agnostique
          </div>
        </div>
      )}
    </div>
  );
}
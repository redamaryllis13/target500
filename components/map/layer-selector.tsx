"use client";

import { useState, useRef, useEffect } from "react";
import { useMapStore } from "@/store/map-store";
import { Layers } from "lucide-react";

export function LayerSelector() {
  const { availableLayers, activeLayers, toggleLayer } = useMapStore();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative pointer-events-auto">
      
      {/* Bouton Icône agnostique */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center h-10 w-10 bg-background/90 backdrop-blur-sm rounded-lg shadow-lg border transition-colors ${
          isOpen 
            ? 'border-border text-primary bg-muted' 
            : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title="Couches de données"
      >
        <Layers size={20} />
      </button>

      {/* Menu Déroulant Flottant agnostique */}
      {isOpen && (
        <div className="absolute top-12 left-0 w-64 bg-popover/95 backdrop-blur-md rounded-lg shadow-xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          
          <div className="p-3 border-b border-border bg-muted/50">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Couches disponibles
            </h3>
          </div>
          
          <div className="p-2">
            {!availableLayers || availableLayers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                Aucune couche trouvée dans le dossier public.
              </p>
            ) : (
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {availableLayers.map((layer: any) => {
                  const isActive = activeLayers.includes(layer.id);
                  return (
                    <label 
                      key={layer.id} 
                      className="flex items-center gap-3 cursor-pointer hover:bg-muted p-2 rounded transition-colors border border-transparent hover:border-border"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-ring focus:ring-offset-background cursor-pointer"
                        checked={isActive}
                        onChange={() => toggleLayer(layer.id)}
                      />
                      <span className="text-sm text-foreground truncate" title={layer.name}>
                        {layer.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
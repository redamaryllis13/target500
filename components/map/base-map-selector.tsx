"use client";

import { useState } from "react";
import { useMapStore } from "@/store/map-store";
import { Map as MapIcon, ChevronRight } from "lucide-react";

export function BaseMapSelector() {
  const { baseMap, setBaseMap } = useMapStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center pointer-events-auto bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border overflow-hidden transition-all h-10">
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center h-full px-3 transition-colors ${
          isOpen 
            ? 'border-r border-border bg-muted text-primary' 
            : 'text-muted-foreground hover:text-primary hover:bg-muted'
        }`}
        title="Fonds de carte"
      >
        <MapIcon size={18} className="shrink-0" />
        {!isOpen && <ChevronRight size={16} className="ml-1 opacity-50 shrink-0" />}
      </button>

      {isOpen && (
        <div className="flex items-center px-1 animate-in slide-in-from-left-2 duration-200">
          <button
            onClick={() => { setBaseMap('osm'); setIsOpen(false); }}
            className={`px-3 py-1.5 m-1 text-sm rounded-md transition-colors whitespace-nowrap ${
              baseMap === 'osm' 
                ? 'bg-muted text-primary font-medium border border-border' 
                : 'text-muted-foreground border border-transparent hover:bg-muted hover:text-primary hover:border-border'
            }`}
          >
            Plan
          </button>
          <button
            onClick={() => { setBaseMap('satellite'); setIsOpen(false); }}
            className={`px-3 py-1.5 m-1 text-sm rounded-md transition-colors whitespace-nowrap ${
              baseMap === 'satellite' 
                ? 'bg-muted text-primary font-medium border border-border' 
                : 'text-muted-foreground border border-transparent hover:bg-muted hover:text-primary hover:border-border'
            }`}
          >
            Satellite
          </button>
        </div>
      )}
    </div>
  );
}
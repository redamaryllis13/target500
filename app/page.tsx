"use client";

import { MapProvider } from "react-map-gl/maplibre";
import CommunesMap from "@/components/map"; // Ajuste le chemin si besoin (ex: components/ui/map)
import { SearchBar } from "@/components/map/search-bar";
import { LayerSelector } from "@/components/map/layer-selector";
import { BaseMapSelector } from "@/components/map/base-map-selector";
import { AssetSidePanel } from "@/components/map/asset-side-panel";

export default function Home() {
  return (
    // Le MapProvider est OBLIGATOIRE pour que SearchBar puisse faire "map.flyTo()"
    <MapProvider>
      <div className="relative w-full h-full overflow-hidden bg-neutral-900">
        
        {/* 1. La carte (fond) */}
        <div className="absolute inset-0 z-0">
          <CommunesMap />
        </div>

        {/* 2. La barre de recherche (Centrée en haut) */}
        <SearchBar />

        {/* 3. Les Layers (En haut à gauche) */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <LayerSelector />
        </div>

        {/* 4. Le fond de carte (En bas à gauche) */}
        <div className="absolute bottom-6 left-4 z-10 pointer-events-none">
          <BaseMapSelector />
        </div>

        {/* 5. Le panneau latéral du Maire (A droite) */}
        <div className="absolute top-0 right-0 h-full z-20 pointer-events-none">
          <AssetSidePanel />
        </div>

      </div>
    </MapProvider>
  );
}
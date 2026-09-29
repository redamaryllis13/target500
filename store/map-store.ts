import { create } from 'zustand';

// On définit la structure d'une couche directement ici
export interface MapLayer {
  id: string;
  name: string;
  type: 'geojson';
  url: string;
  defaultVisible: boolean;
  color?: string; // Couleur optionnelle pour l'affichage sur la carte
}

interface MapState {
  // Vue de la carte
  center: [number, number];
  zoom: number;
  baseMap: 'osm' | 'satellite' | 'terrain';
  
  // Données dynamiques
  availableLayers: MapLayer[]; // Toutes les couches trouvées par l'API
  activeLayers: string[];      // Celles qui sont cochées pour l'affichage
  selectedFeature: any | null; // La commune sur laquelle on a cliqué
  
  // Actions
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setBaseMap: (baseMap: 'osm' | 'satellite' | 'terrain') => void;
  toggleLayer: (layerId: string) => void;
  setSelectedFeature: (feature: any | null) => void;
  
  // Fonction pour charger la configuration depuis notre nouvelle API
  fetchLayers: () => Promise<void>; 
}

export const useMapStore = create<MapState>((set) => ({
  center: [46.603354, 1.888334], // Centre de la France
  zoom: 6,
  baseMap: 'osm',
  
  availableLayers: [],
  activeLayers: [],
  selectedFeature: null,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setBaseMap: (baseMap) => set({ baseMap }),
  
  toggleLayer: (layerId) =>
    set((state) => ({
      activeLayers: state.activeLayers.includes(layerId)
        ? state.activeLayers.filter((id) => id !== layerId)
        : [...state.activeLayers, layerId],
    })),
    
  setSelectedFeature: (feature) => set({ selectedFeature: feature }),

  fetchLayers: async () => {
    try {
      const response = await fetch('/api/config/layers');
      if (!response.ok) throw new Error('Erreur lors de la récupération des couches');
      const layers: MapLayer[] = await response.json();
      
      // On récupère les couches qui doivent être visibles par défaut
      let defaultActive = layers.filter(l => l.defaultVisible).map(l => l.id);
      
      // Si aucune n'est visible par défaut, on active la première de la liste
      if (defaultActive.length === 0 && layers.length > 0) {
        defaultActive = [layers[0].id];
      }
      
      set({ 
        availableLayers: layers,
        activeLayers: defaultActive
      });
    } catch (error) {
      console.error("Impossible de charger les couches dynamiques :", error);
    }
  }
}));
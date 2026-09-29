"use client";

import { useEffect, useState } from "react";
import Map, { Source, Layer, NavigationControl, AttributionControl } from "react-map-gl/maplibre";
import { useMapStore } from "@/store/map-store";
import { setWorkerUrl } from "maplibre-gl";

if (typeof window !== "undefined") {
  setWorkerUrl("/maplibre-gl-csp-worker.js");
}

const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    },
  },
  layers: [{ id: "osm-layer", type: "raster" as const, source: "osm" }],
};

const SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    },
    ign: {
      type: "raster" as const,
      tiles: [
        "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}"
      ],
      tileSize: 256,
      attribution: '© <a href="https://www.ign.fr/" target="_blank" rel="noreferrer">IGN</a>'
    }
  },
  layers: [
    { id: "osm-layer", type: "raster" as const, source: "osm" },
    { id: "ign-layer", type: "raster" as const, source: "ign" }
  ],
};

export default function CommunesMap() {
  const { center, zoom, baseMap, availableLayers, activeLayers, fetchLayers, setSelectedFeature } = useMapStore();
  const [geojsons, setGeojsons] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchLayers();
  }, [fetchLayers]);

  useEffect(() => {
    activeLayers.forEach(layerId => {
      if (!geojsons[layerId]) {
        const layerConf = availableLayers.find(l => l.id === layerId);
        if (layerConf) {
          fetch(layerConf.url)
            .then(res => res.json())
            .then(data => setGeojsons(prev => ({ ...prev, [layerId]: data })))
            .catch(err => console.error("Erreur chargement GeoJSON:", err));
        }
      }
    });
  }, [activeLayers, availableLayers, geojsons]);

  const mapStyle = baseMap === "satellite" ? SATELLITE_STYLE : OSM_STYLE;

  return (
    <Map
      id="mainMap"
      initialViewState={{ longitude: center[1], latitude: center[0], zoom }}
      mapStyle={mapStyle}
      interactiveLayerIds={activeLayers.map(id => `layer-${id}`)}
      onClick={(e) => {
        if (e.features && e.features.length > 0) {
          setSelectedFeature(e.features[0].properties);
        }
      }}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <AttributionControl position="bottom-right" compact={false} />
      <NavigationControl position="bottom-right" />
            
      {activeLayers.map(layerId => {
        const data = geojsons[layerId];
        const layerConf = availableLayers.find(l => l.id === layerId);
        
        if (!data || !layerConf) return null;
        
        // On récupère la couleur définie dans le store, sinon on met un bleu par défaut
        const layerColor = layerConf.color || "#3b82f6";
        
        return (
          <Source key={layerId} id={`source-${layerId}`} type="geojson" data={data}>
            <Layer 
              id={`layer-${layerId}`} 
              type="circle" 
              paint={{
                "circle-color": layerColor,
                "circle-radius": 6,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff" // Bordure blanche générique pour bien détacher les points
              }} 
            />
          </Source>
        );
      })}
    </Map>
  );
}
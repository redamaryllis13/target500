"use client";

import { useState, useEffect, useRef } from "react";
import { useMap } from "react-map-gl/maplibre";
import { Search, MapPin, Loader2, X, Database } from "lucide-react";

type SearchResult = {
  id: string;
  label: string;
  context: string;
  type: "address" | "layer-feature"; 
  coordinates: [number, number];
  zoom: number;
  source?: string;
};

export function SearchBar() {
  const { mainMap, current } = useMap(); 
  const mapToUse = mainMap || current; 
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      const newResults: SearchResult[] = [];

      try {
        const banRes = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
        const banData = await banRes.json();
        
        if (banData.features) {
          banData.features.forEach((f: any) => {
            newResults.push({
              id: `ban-${f.properties.id}`,
              label: f.properties.label,
              context: f.properties.context,
              type: "address",
              source: "api-adresse",
              coordinates: f.geometry.coordinates,
              zoom: f.properties.type === "municipality" ? 12 : 15,
            });
          });
        }

        setResults(newResults);
        if (newResults.length > 0) setIsOpen(true);
      } catch (err) {
        console.error("Erreur de recherche:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    const [longitude, latitude] = result.coordinates;
    
    if (mapToUse) {
      mapToUse.flyTo({
        center: [longitude, latitude],
        zoom: result.zoom,
        duration: 2500,
        essential: true
      });
    }

    setQuery(result.label);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[28rem] pointer-events-auto">
      {/* Barre de saisie agnostique */}
      <div className="relative flex items-center w-full bg-background/95 backdrop-blur-md rounded-full border border-border shadow-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-ring">
        <div className="pl-4 text-muted-foreground">
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Search className="w-5 h-5" />}
        </div>
        <input
          type="text"
          className="w-full bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          placeholder="Rechercher une commune, une adresse, ..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 3) setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {query && (
          <button 
            onClick={() => { setQuery(""); setResults([]); setIsOpen(false); }}
            className="pr-4 text-muted-foreground hover:text-foreground outline-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Menu déroulant des résultats agnostique */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-popover/95 backdrop-blur-md rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-80 overflow-y-auto custom-scrollbar">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className="flex items-start text-left px-4 py-3 hover:bg-muted border-b border-border last:border-0 transition-colors"
            >
              {result.type === "address" ? (
                <MapPin className="w-4 h-4 text-primary mt-0.5 mr-3 shrink-0" />
              ) : (
                <Database className="w-4 h-4 text-primary mt-0.5 mr-3 shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">{result.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{result.context}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
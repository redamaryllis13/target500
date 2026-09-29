"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map as MapIcon, ChevronLeft, ChevronRight, Hexagon, Database } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Carte Globale", icon: MapIcon },
  { href: "/donnees", label: "Base de données", icon: Database },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    // bg-neutral-950 -> bg-background | border-yellow-500/20 -> border-border
    <aside className={`bg-background border-r border-border transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col h-screen z-[1000] relative shadow-lg`}>
      
      {/* Poignée miroir */}
      {/* bg-neutral-950 -> bg-background | text-yellow-500/70 -> text-muted-foreground | hover:bg... -> hover:bg-muted */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="absolute top-1/2 -right-8 -translate-y-1/2 flex items-center justify-center w-8 h-16 bg-background border-y border-r border-border rounded-r-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-[4px_0_15px_-3px_rgba(0,0,0,0.5)] z-50 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* En-tête */}
      <div className="flex items-center justify-center p-4 border-b border-border h-16 overflow-hidden shrink-0">
        {isCollapsed ? (
          <Hexagon size={24} className="text-primary shrink-0" />
        ) : (
          <div className="flex items-center gap-2 text-primary w-full">
            <Hexagon size={24} className="shrink-0" />
            <span className="font-bold text-lg tracking-wide uppercase truncate text-foreground">Nom du Projet</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href}
              href={item.href} 
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors overflow-hidden border ${
                isActive 
                  ? "border-border bg-muted text-primary font-medium" // État actif
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-primary hover:border-border" // État inactif + Hover
              }`}
            >
              <Icon size={20} className="shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      
    </aside>
  );
}
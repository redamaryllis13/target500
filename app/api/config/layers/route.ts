import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  // 1. On définit le chemin absolu vers le dossier public/data
  const dataDir = path.join(process.cwd(), 'public', 'data');
  
  try {
    // 2. On vérifie si le dossier existe (si le script n'a jamais tourné, on évite un crash)
    try {
      await fs.access(dataDir);
    } catch {
      return NextResponse.json([]); // Dossier introuvable = 0 couche
    }

    // 3. On lit le contenu du dossier
    const entries = await fs.readdir(dataDir, { withFileTypes: true });
    const layers = [];

    // 4. On boucle sur chaque élément trouvé
    for (const entry of entries) {
      // On ne s'intéresse qu'aux dossiers (ex: communes_sarthe)
      if (entry.isDirectory()) {
        const folderName = entry.name; 
        const geojsonFileName = `${folderName}.geojson`;
        const geojsonFilePath = path.join(dataDir, folderName, geojsonFileName);

        try {
          // On vérifie que le fichier .geojson existe bien à l'intérieur
          await fs.access(geojsonFilePath);
          
          // Petit formatage pour l'affichage dans le menu : 
          // Transforme "communes_sarthe" en "Sarthe" avec une majuscule
          const namePart = folderName.replace('communes_', '').replace(/_/g, ' ');
          const formattedName = `Communes - ${namePart.charAt(0).toUpperCase() + namePart.slice(1)}`;

          // On ajoute la couche à notre liste
          layers.push({
            id: folderName,
            name: formattedName,
            type: 'geojson',
            url: `/data/${folderName}/${geojsonFileName}`,
            defaultVisible: false // Par défaut, on ne les affiche pas toutes en même temps
          });
        } catch (err) {
          // S'il n'y a pas de fichier geojson dans ce dossier, on l'ignore
          continue;
        }
      }
    }

    // 5. On renvoie la liste complète au frontend
    return NextResponse.json(layers);

  } catch (error) {
    console.error("Erreur lors de la lecture des couches:", error);
    return NextResponse.json(
      { error: "Impossible de lire la configuration des couches" }, 
      { status: 500 }
    );
  }
}
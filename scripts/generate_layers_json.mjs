import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

// ============================================================================
// CONFIGURATION DU SCRIPT
// ============================================================================

// 👉 Chemin de destination : le fichier RNE sera téléchargé dans le dossier /public/data du projet. Vous pouvez adapter ce chemin si nécessaire.
const BASE_DATA_DIR = path.join(process.cwd(), 'public', 'data');
const CSV_FILE = path.join(BASE_DATA_DIR, 'rne_maires.csv');

// URL officielle du fichier RNE (Répertoire National des Élus) - Données data.gouv.fr
const RNE_CSV_URL = 'https://www.data.gouv.fr/fr/datasets/r/2876a346-d50c-4911-934e-19ee07b0e503'; 

// Liste des départements souhaités pour générer les fichiers GeoJSON correspondants.
// 👉 Ajoutez, modifiez ou commentez les départements que vous souhaitez extraire. Vous avez ci-dessous des exemples pour 3 départements :
const DEPARTEMENTS = [
  { code: '41', nom: 'Loir-et-Cher', dossier: 'communes_loir_et_cher' },
  // { code: '72', nom: 'Sarthe', dossier: 'communes_sarthe' },
  // { code: '24', nom: 'Dordogne', dossier: 'communes_dordogne' },
  // { code: '87', nom: 'Haute-Vienne', dossier: 'communes_haute_vienne' }
];

// Fonction utilitaire pour respecter la limite de l'API OpenStreetMap (1 requête / sec)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fonction utilitaire pour dessiner une barre de progression dans la console
function drawProgressBar(current, total, prefix = '', suffix = '') {
  const width = 30;
  const progress = current / total;
  const filled = Math.round(width * progress);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percentage = Math.round(progress * 100).toString().padStart(3, ' ');
  
  // \x1b[K efface la fin de la ligne pour éviter les résidus de texte
  process.stdout.write(`\r   ${prefix} [${bar}] ${percentage}% | ${suffix}\x1b[K`);
}

// ============================================================================
// ÉTAPE 1 : TÉLÉCHARGEMENT DU RNE
// ============================================================================
async function downloadRNE() {
  console.log(`\n⬇️  Étape 1 : Téléchargement du fichier RNE des maires...`);
  const response = await fetch(RNE_CSV_URL);
  
  if (!response.ok) {
    throw new Error(`Erreur lors du téléchargement du RNE: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(CSV_FILE, Buffer.from(arrayBuffer));
  console.log(`✅ Fichier CSV du RNE téléchargé et sauvegardé dans : ${CSV_FILE}`);
}

// ============================================================================
// ÉTAPE 2 : CHARGEMENT DU RNE EN MÉMOIRE
// ============================================================================
async function loadMairesDictionnaire() {
  console.log(`\n⏳ Étape 2 : Analyse du fichier CSV du RNE en mémoire...`);
  const csvContent = await fs.readFile(CSV_FILE, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ';',
    trim: true 
  });

  const mairesDictionnaire = new Map();
  const codesDeptsCibles = DEPARTEMENTS.map(c => c.code);
  const totalRecords = records.length;
  
  for (let i = 0; i < totalRecords; i++) {
    const record = records[i];
    const codeDept = record['Code du département'];
    
    // Seuls les maires des départements ciblés sont stockés pour économiser de la mémoire
    if (codesDeptsCibles.includes(codeDept)) {
      let codeCommune = record['Code de la commune'] ? record['Code de la commune'].trim() : '';
      let codeInsee = (codeCommune.startsWith(codeDept) && codeCommune.length === 5)
        ? codeCommune
        : `${codeDept}${codeCommune.padStart(3, '0')}`;
      
      // Extraction des informations du ficher rne :
      const prenom = record["Prénom de l'élu"] || '';
      const nom = record["Nom de l'élu"] || '';
      const dateNaissance = record["Date de naissance"] || 'Inconnue';
      const profession = record["Libellé de la profession"] || record["Libellé de la catégorie socio-professionnelle"] || 'Non renseignée';
      const etiquette = record["Code de la nuance politique"] || 'Sans étiquette déclarée';

      mairesDictionnaire.set(codeInsee, {
        maire: `${prenom} ${nom}`,
        date_naissance: dateNaissance,
        profession: profession,
        etiquette: etiquette
      });
    }

    // Mise à jour de la barre de progression
    if (i % 5000 === 0 || i === totalRecords - 1) {
      drawProgressBar(i + 1, totalRecords, "Analyse", `${i + 1}/${totalRecords} lignes lues`);
    }
  }
  
  console.log(`\n✅ ${mairesDictionnaire.size} maires préchargés pour les départements ciblés.`);
  return mairesDictionnaire;
}

// ============================================================================
// ÉTAPE 3 : GÉNÉRATION ET FUSION PAR DÉPARTEMENT
// ============================================================================
async function processDepartement(dept, mairesDictionnaire) {
  const targetDir = path.join(BASE_DATA_DIR, dept.dossier);
  await fs.mkdir(targetDir, { recursive: true });
  
  const targetJsonFile = path.join(targetDir, `${dept.dossier}.geojson`);
  const apiGeoUrl = `https://geo.api.gouv.fr/departements/${dept.code}/communes?fields=nom,code,centre`;

  console.log(`\n======================================================`);
  console.log(`⏳ Traitement de : ${dept.nom} (${dept.code})`);
  console.log(`======================================================`);

  const communesRes = await fetch(apiGeoUrl);
  if (!communesRes.ok) throw new Error(`Erreur API Géo (${dept.nom}): ${communesRes.status}`);
  
  const communes = await communesRes.json();
  const features = [];
  let count = 0;
  let mairesTrouves = 0;

  console.log(`📍 Géocodage OSM et fusion RNE pour ${communes.length} mairies (cette étape prendra du temps)...`);

  for (let i = 0; i < communes.length; i++) {
    const commune = communes[i];
    count++;
    const codeInsee = commune.code;
    let coordinates = commune.centre ? commune.centre.coordinates : [0, 0]; 
    let adresseComplete = `Mairie, ${commune.nom}`;

    // --- A. Géocodage via Nominatim (OpenStreetMap) ---
    try {
      const query = `Mairie ${commune.nom} ${dept.nom} France`;
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`;
      
      const res = await fetch(nomUrl, {
        headers: { 'User-Agent': 'LocalScript/1.0' }
      });
      
      const data = await res.json();
      
      if (data && data.length > 0) {
        const addr = data[0].address;
        let street = "Mairie";
        if (addr.house_number && addr.road) {
          street = `${addr.house_number} ${addr.road}`;
        } else if (addr.road) {
          street = addr.road;
        } else if (addr.pedestrian) {
          street = addr.pedestrian;
        }
        const postcode = addr.postcode || "";
        const city = addr.village || addr.town || addr.city || addr.municipality || commune.nom;
        
        adresseComplete = `${street}, ${postcode} ${city}`.trim();
        coordinates = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
      }
    } catch (e) {
      // En cas d'erreur de réseau temporaire, on garde le centre de la commune par défaut
    }

    // --- B. Récupération des infos du Maire dans le dictionnaire ---
    const dataMaire = mairesDictionnaire.get(codeInsee);
    if (dataMaire) mairesTrouves++;

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinates
      },
      properties: {
        commune: commune.nom,
        code_insee: codeInsee,
        adresse_mairie: adresseComplete.replace(/,\s+/, ', ').trim(),
        maire_2026: dataMaire ? dataMaire.maire : "Non trouvé dans le RNE",
        date_de_naissance: dataMaire ? dataMaire.date_naissance : "N/A",
        profession: dataMaire ? dataMaire.profession : "N/A",
        etiquette_politique: dataMaire ? dataMaire.etiquette : "N/A"
      }
    });

    // Progressbar
    drawProgressBar(count, communes.length, "Progression", `${count}/${communes.length} | Match: ${mairesTrouves} | ${commune.nom}`);
    
    // Pause obligatoire pour ne pas saturer OpenStreetMap (1 requête / seconde max)
    await sleep(1500);
  }

  const geojson = {
    type: "FeatureCollection",
    features: features
  };

  await fs.writeFile(targetJsonFile, JSON.stringify(geojson, null, 2), 'utf8');
  console.log(`\n✅ ${dept.nom} terminé ! Fichier généré : /public/data/${dept.dossier}/${dept.dossier}.geojson`);
}

// ============================================================================
// ÉXÉCUTION PRINCIPALE
// ============================================================================
async function main() {
  try {
    // Création du dossier racine si inexistant
    await fs.mkdir(BASE_DATA_DIR, { recursive: true });

    // 1. Télécharger le RNE
    await downloadRNE();

    // 2. Extraire et charger les données du RNE en mémoire
    const mairesDictionnaire = await loadMairesDictionnaire();

    // 3. Traiter chaque département
    for (const dept of DEPARTEMENTS) {
      await processDepartement(dept, mairesDictionnaire);
    }

    console.log(`\n🎉 Script global terminé avec succès !`);
    
  } catch (error) {
    console.error("\n❌ Une erreur critique est survenue :", error.message);
  }
}

main();
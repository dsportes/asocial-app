export const config = {
  // CONFIGURATION TECHNIQUE : à adapter à chaque déploiement
  DEV: true,
  DEBUG: true,
  BUILD: '22',
  hasWS: true, // true si Data Sync est assuré par WS

  portupload: 33666, // Ne pas changer en général

  /* Configuration de profilage - obligatoires */  
  locale: 'fr-FR',
  localeOptions: [
    { value: 'en-EN', label: 'English',  flag: '🇬🇧' },
    { value: 'fr-FR', label: 'Français', flag: '🇫🇷' }
  ],

  silence: true,
  
  motscles: { 
    '255': { 'fr-FR': 'Statut/Nouveau', 'en-EN': 'Status/New' },
    '254': { 'fr-FR': 'Visibilité/Liste noire', 'en-EN': 'Visibility/Black List' },
    '253': { 'fr-FR': 'Compte/Sponsorisé', 'en-EN': 'Account/Sponsored' },
    '252': { 'fr-FR': 'Compte/Sponsor', 'en-EN': 'Account/Sponsor' },
    '251': { 'fr-FR': 'Visibilité/Favori', 'en-EN': 'Visibility/Favorite' },
    '250': { 'fr-FR': 'Visibilité/Important', 'en-EN': 'Visibility/Important' },
    '249': { 'fr-FR': 'Visibilité/Obsolète', 'en-EN': 'Visibility/Deprecated' },
    '248': { 'fr-FR': 'Visibilité/A lire', 'en-EN': 'Visibility/To Read' },
    '247': { 'fr-FR': 'Visibilité/A traiter', 'en-EN': 'Visibility/To Do' },
    '246': { 'fr-FR': 'Visibilité/Poubelle', 'en-EN': 'Visibility/Trash' }
  },

  /* Valeurs à spécifier quand elles contredisent les valeurs par défaut */
  // En test pour éviter de frapper les "phrases secrètes" de test
  phrases: [
    'leszsanglotszLONGSzgarezauzGORILLEz',
    'auzvillagezSANSzjaizmauvaisezREPUTATIONz'
  ],
  nomDuComptable: 'Comptable',
  nomPartitionPrimitive: 'Primitive',
  donorg: 2, // don par défaut à un compte A par création depuis un compte O
  dons: [50, 100, 200], // choix des dons d'un compte A au sponsotring d'un autre compte A
  dons2: [1, 5, 10, 20, 50], // choix des dons pour les dons directs pat chat
  allocComptable: [8, 2, 8],
  allocPrimitive: [256, 256, 256],
  quotas: { '0': 0, 'XXS': 1, 'XS': 2, 'SM': 4, 'MD': 8, 'LG': 16, 'XL': 32, 'XXL': 64 },
  profils: [[100, 10, 10], [1000, 50, 50], [10000, 250, 250], [1000, 50, 10], [10000, 250, 50]],
  lgtitre: 120,
  maxlgtextegen: 250,
  maxlgtextesecret: 5000,
  alertedlv: 40,

  /* Une base locale IDB non resynchronisée depuis plus de idbObs jours est
  considérée comme obsolète et détruite à la première connexion synchronisée */
  idbObs: 500, 

  tarifs: [
    { am: 202201, cu: [0.45, 0.10, 80, 200, 15, 15] },
    { am: 202305, cu: [0.45, 0.10, 80, 200, 15, 15] },
    { am: 202309, cu: [0.45, 0.10, 80, 200, 15, 15] }
  ]
}

export const config = {
  /* Obligatoires */  
  locale: 'fr-FR',
  localeOptions: [
    { value: 'en-EN', label: 'English',  flag: '🇬🇧' },
    { value: 'fr-FR', label: 'Français', flag: '🇫🇷' }
  ],
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
  fsSync: false,
  portupload: 33666,
  phrases: [
    'leszsanglotszLONGSzgarezauzGORILLEz',
    'auzvillagezSANSzjaizmauvaisezREPUTATIONz'
  ],
  nomDuComptable: 'Comptable',
  allocComptable: [32, 32, 256, 256],
  quotas: { '0': 0, 'XXS': 1, 'XS': 2, 'SM': 4, 'MD': 8, 'LG': 16, 'XL': 32, 'XXL': 64 },
  profils: [[10, 10], [50, 50], [250, 250], [50, 10], [250, 50]],
  lgtitre: 120,
  maxlgtextegen: 250,
  maxlgtextesecret: 5000
}

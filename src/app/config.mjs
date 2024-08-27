// Branch 20240801

export const config = {
  // CONFIGURATION TECHNIQUE : à adapter à chaque déploiement
  DEV: true,
  DEBUG: true,
  BUILD: '24-08-16 17:30',

  vapid_public_key: 'BC8J60JGGoZRHWJDrSbRih-0qi4Ug0LPbYsnft668oH56hqApUR0piwzZ_fsr0qGrkbOYSJ0lX1hPRTawQE88Ew',

  portupload: 33666, // Ne pas changer en général

  /* Configuration de profilage - obligatoires */  
  locale: 'fr-FR',
  localeOptions: [
    { value: 'en-EN', label: 'English',  flag: '🇬🇧' },
    { value: 'fr-FR', label: 'Français', flag: '🇫🇷' }
  ],

  silence: false,
  silenceHome: true,
  dldemonsec: 10,
  
  /* Valeurs à spécifier quand elles contredisent les valeurs par défaut */
  // En test pour éviter de frapper les "phrases secrètes" de test
  phrases: [
    'leszsanglotszLONGSzgarezauzGORILLEz',
    'auzvillagezSANSzjaizmauvaisezREPUTATIONz'
  ],
  nomDuComptable: 'Comptable',
  nomDeAdmin: 'Administrateur',
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
  retriesdlinmin: [1, 10, 60, 360]

}

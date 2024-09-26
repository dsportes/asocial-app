// Branch 20240801

export const config = {
  // CONFIGURATION TECHNIQUE : à adapter SI NECESSAIRE à chaque déploiement
  BUILD: '24-09-24 12:30',

  /* Configuration linguistiques - Commenter les langues non souhaitées dans ce déploiement */  
  locale: 'fr-FR',
  localeOptions: [
    { value: 'en-EN', label: 'English',  flag: '🇬🇧' },
    { value: 'fr-FR', label: 'Français', flag: '🇫🇷' }
  ],

  silence: false,
  silenceHome: true,

  motscles: {
    indesirable: { 'fr-FR': 'indesirable', 'en-EN': 'junk'}, 
    important: { 'fr-FR': 'important', 'en-EN': 'important'}, 
    obsolete: { 'fr-FR': 'obsolete', 'en-EN': 'obsolete'},
    ami: { 'fr-FR': 'ami', 'en-EN': 'friend'},
    alire: { 'fr-FR': 'alire', 'en-EN': 'toread'},
    afaire: { 'fr-FR': 'afaire', 'en-EN': 'todo'}
  },

  // En test pour éviter de frapper les "phrases secrètes" de test. Vide en production
  phrases: [
    'leszsanglotszLONGSzgarezauzGORILLEz',
    'auzvillagezSANSzjaizmauvaisezREPUTATIONz'
  ],

  /* Valeurs à ne pas changer, sauf rares exception */
  portupload: 33666, // Ne pas changer en général
  dldemonsec: 10, // ficav-store : délai du démon
  donorg: 2, // don par défaut à un compte A par création depuis un compte O
  dons: [50, 100, 200], // choix des dons d'un compte A au sponsoring d'un autre compte A
  dons2: [1, 5, 10, 20, 50], // choix des dons pour les dons directs pat chat

  maxlgtextegen: 250,
  maxlgtextesecret: 5000,
  alerteDlv: 15

}

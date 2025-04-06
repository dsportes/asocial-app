// Branch 20240801

export const config = {
  // CONFIGURATION TECHNIQUE : à adapter SI NECESSAIRE à chaque déploiement
  BUILD: 'v1.5.5 - 1.01',
  mondebug: true,

  /* Configuration linguistiques - Commenter les langues non souhaitées dans ce déploiement */  
  locale: 'fr-FR',
  localeOptions: [
    { value: 'en-EN', label: 'English',  flag: '🇬🇧' },
    { value: 'fr-FR', label: 'Français', flag: '🇫🇷' }
  ],

  silence: false,
  silenceHome: true,
  touchInMinutes: 10,

  theme: {
    primary: ['#0D47A1', '#BBDEFB'],
    secondary: ['#33691E', '#DCEDC8'],
    info: ['#82C8E8', '#0101FF'],
    accent: ['#9C27B0', '#9C27B0'],
    positive: ['#21BA45', '#21BA45'],
    negative: ['#C10015', '#C10015'],
    warning: ['#E65100', '#E65100'],
    msgbg: ['#FFF176', '#FFF176'],
    msgtc: ['#B71C1C', '#B71C1C'],
    tbptc: ['#82C8E8', '#0101FF'],
    tbstc: ['#DCEDC8', '#212121'],
    btnbg: ['#1976D2', '#1976D2'],
    btntc: ['#FFFFFF', '#FFFFFF'],
    btwbg: ['#E65100', '#E65100'],
    btwtc: ['#FFFFFF', '#FFFFFF'],
    mdtitre: ['#64B5F6', '#1565C0']
  },

  motscles: {
    indesirable: { 'fr-FR': 'indesirable', 'en-EN': 'junk'}, 
    important: { 'fr-FR': 'important', 'en-EN': 'important'}, 
    obsolete: { 'fr-FR': 'obsolete', 'en-EN': 'obsolete'},
    ami: { 'fr-FR': 'ami', 'en-EN': 'friend'},
    alire: { 'fr-FR': 'alire', 'en-EN': 'toread'},
    afaire: { 'fr-FR': 'afaire', 'en-EN': 'todo'}
  },

  /* Valeurs à ne pas changer, sauf rares exception */
  portupload: 33666, // Ne pas changer en général
  dldemonsec: 10, // ficav-store : délai du démon
  dons: [1, 5, 10, 20, 50, 100], // choix des dons au sponsoring d'un autre compte
  dons2: [2, 5, 10, 20, 50, 100], // choix des dons pour les dons directs pat chat

  maxlgtextegen: 250,
  maxlgtextesecret: 5000,
  alerteDlv: 31,

  // quotasMax : [QN, QV, QC]
  quotasMaxP: [100000, 100000, 100000], // quotas max attribuables à une PARTITION
  quotasMaxC: [10000, 10000, 10000], // quotas max attribuables à un COMPTE
  quotasMaxA: [100000, 100000, 100000], // quotas max attribuables à l'ensemble des COMPTES A d'un espace
  quotasMaxE: [100000, 100000, 100000] // quotas max attribuables à un espace

}

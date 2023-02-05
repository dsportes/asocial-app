export default {
  bonjour: 'Bonjour !',
  build: 'Build: {0} - Debug: {1}',
  reseau: 'Réseau : {0}',
  aide: 'Un peu d\'aide ... ',

  sync: 'Synchronisé',
  incognito: 'Incognito',
  avion: 'Avion',

  asc: 'tri asc.',
  desc: 'tri desc.',
  detail: 'Détails',

  OK: 'OK',
  jailu: 'J\'ai lu',
  continuer: 'Continuer',
  changer: 'Changer',
  valider: 'Valider',
  renoncer: 'Renoncer',
  corriger: 'Corriger',
  creer: 'Créer',
  obsolete: 'Obsolète',
  annuler: 'Annuler',
  refuser: 'Refuser',
  fermer: 'Fermer',
  editer: 'Editer',
  confirmer: 'Confirmer',
  suivant: 'Suivant',
  precedent: 'Précédent',
  personnel: 'PERSONNEL ',
  entree: 'Presser "Entrée" à la fin de la saisie',
  cryptage: 'Cryptage en cours ...',
  jour: 'zéro jour | un jour | {count} jours',
  merci: 'Merci {0}',
  contient: 'contient',
  debute: 'débute par',
  langue: 'Choix de la langue',
  clairfonce: 'Choix style clair / foncé',

  enalerte: 'En alerte',
  ensursis: 'En sursis',
  bloque: 'Bloqué',
  aucuncompte: 'Aucun compte',

  avatar: 'Avatar',
  tribus: 'Tribu | Tribu | Tribus',
  comptable: 'Comptable',

  auja: 'aujourd\'hui à {0}',
  hiera: 'hier à {0}',
  lea: 'le {0} à {1}',
  nondate: '(non daté)',

  jour0: 'Dimanche',
  jour1: 'Lundi',
  jour2: 'Mardi',
  jour3: 'Mercredi',
  jour4: 'Jeudi',
  jour5: 'Vendredi',
  jour6: 'Samedi',
  jour7: 'Dimanche',
  jourc0: 'Di',
  jourc1: 'Lu',
  jourc2: 'Ma',
  jourc3: 'Me',
  jourc4: 'Je',
  jourc5: 'Ve',
  jourc6: 'Sa',
  jourc7: 'Di',

  RBL1: 'Comptable',
  RBL2: 'Volume',
  RBL3: 'Organisation',
  RBL4: 'Autre',

  comptes: 'Pas de compte | Un compte | {count} comptes',
  parrains: 'Pas de parrain | Un parrain | {count} parrains',

  // statuts couple
  STCP1: 'en attente',
  STCP2: 'hors délai',
  STCP3: 'refusé',
  STCP4: 'actif',
  STCP5: 'orphelin',

  // statuts membre
  STMB0: 'envisagé',
  STMB1: 'invité',
  STMB2: 'actif',
  STMB3: 'invitation refusée',
  STMB4: 'résilié',
  STMB5: 'disparu',
  
  MOdis: 'DISPARU',

  // Exceptions
  EX1: 'Interruption volontaire (appui sur le bouton rouge)',
  EX2: 'Erreur d`accès au serveur, réseau indisponible ?',
  EX3: 'Erreur d\'accès à la base locale',
  EX4: 'Erreur inattendue survenue dans le traitement sur le poste',
  EX5: 'Données saisies non conformes',
  EX6: 'Donnée absente ou corrompue détectée par le browser',
  EX7: 'Erreur inattendue survenue dans le traitement sur le serveur',
  EX8: 'Données transmises au serveur non conformes',
  EX9: 'Donnée absente ou corrompue détectée par le browser',

  EX1000: 'Interruption volontaire',

  EX2000: 'Erreur à l\'ouverture de la connexion avec le serveur ( {0} ).\nDétail: {1}',
  EX2001: 'Ouverture de la connexion avec le serveur impossible ( {0} ).',
  EX2002: 'Envoi d\'un message au serveur impossible ( {0} ).\nDétail: {1}',
  EX2003: 'Rupture de la liaison avec le serveur par le serveur ou URL mal configurée ( {0} ).',
  EX2004: 'ping / pong : pong non reçu ( {0} ).',
  EX2005: 'Erreur de transfert du fichier vers le serveur de fichier. Détail: {0}',
  EX2006: 'Erreur de transfert du fichier vers le serveur de stockage local de fichiers. Détail: {0}',
  EX2100: 'Session interrompue. Se déconnecter et tenter de se reconnecter',

  EX3001: 'Ouverture de la base locale impossible.\nDétail: {0}',
  EX3002: 'Erreur d\'accès à la base locale impossible.\nDétail: {0}',

  EX4000: 'Erreur inattendue.\nDétail: {0}',
  EX4001: 'Retour de la requête mal formé : parse JSON en erreur. Opération: {0}\nDétail: {1}',
  EX4002: 'Retour de la requête mal formé : désérialisation en erreur. Opération: {0}\nDétail: {1}',
  EX4003: 'Fichier {0} non accessible sur le serveur',
  EX4005: 'Plus de 5 tentatives de connexions. Bug ou incident temporaire. Ré-essayer un peu plus tard',
  EX4006: 'Compte anormalement sollicité, bug probable',
  EX4007: 'Echec d\'encryption. Buffer: {0} - Clé: {1} - Détail: {2}',
  EX4008: 'Echec de decryption. Buffer: {0} - Clé: {1} - Détail: {2}',
  EX4010: 'Crypter : cle incorrecte (pas Uint8Array ou longueur != 32)',
  EX4011: 'Crypter : buffer incorrect (pas Uint8Array)',
  EX4012: 'Décrypter : cle incorrecte (pas Uint8Array ou longueur != 32)',
  EX4013: 'Décrypter : buffer incorrect (pas Uint8Array)',
  EX4020: 'Echec de decryption RSA. Buffer: {0} - Clé: {1} - Détail: {2}',
  EX4021: 'Echec d\'encryption RSA. Buffer: {0} - Clé: {1} - Détail: {2}',
  EX4014: 'Crypter RSA : cle publique incorrecte (pas Uint8Array)',
  EX4015: 'Crypter RSA : buffer incorrect (pas Uint8Array)',
  EX4016: 'Décrypter RSA : cle publique incorrecte (pas Uint8Array)',
  EX4017: 'Dérypter RSA : buffer incorrect (pas Uint8Array)',
  EX4018: 'store {0} inconnu',

  EX5001: 'La phrase secrète a changé depuis l\'authentification du compte. Vous allez être déconnecté et vous pourrez vous reconnecter avec la nouvelle phrase secrète.',
  EX5003: 'Avatar déjà cité dans le groupe, ne pas pas être inscrit à nouveau',
  EX5004: `Base locale non trouvée<br>
  - soit la phrase secrète est incorrecte,<br>
  - soit aucune session synchronisée n'a été ouverte antérieurement avec cette phrase secète,<br>
  - soit la base locale a été détruite.<br>
  Resaisir la phrase secrète ou se connecter en mode synchronisé ou incognito.`,
  EX5005: `Base locale absente ou corrompue.<br>
  Code erreur: {0}<br>Se connecter en mode synchronisé ou incognito.`,
  EX5006: `Base locale corrompue.<br>Impossible d'en décrypter les données.`,

  EX6001: 'Clé RSA publique de l\'avatar non trouvée',
  EX6002: 'Base locale corrompue ?\nCompte non trouvé',
  EX6003: 'Base locale corrompue ?\nPréférences du compte non trouvé',
  EX6004: 'Base locale corrompue ?\nChat du compte non trouvé',
  EX6005: 'Base locale corrompue ?\nComptabilité du compte non trouvé',

  EX7000: 'Erreur de la requête non identifiable : {0}', // 0
  EX7001: 'Origine non autorisée', // 1
  EX7003: 'Opération inconnue', // 3
  EX7004: 'Session déconnectée', // 4
  EX7005: 'Version d\'API incompatble', // 5
  EX7006: 'Fichier non trouvé', // 6

  EX8001: 'Erreur fonctionnelle volontaire pour test.\nDétail: {0}',
  EX8002: 'Cette phrase secrète n\'est pas reconnue comme étant celle du comptable de l\'organisation',
  EX8003: 'Erreur d\'ID pour le compte Comptable',
  EX8004: 'Compte Comptable déjà créé',
  EX8005: 'Compte non authentifié : aucun compte n\'est déclaré avec cette phrase secrète',
  EX8006: 'Forfait V1 insuffisant pour l\'attribution souhaitée au nouvel avatar',
  EX8007: 'Cette phrase de parrainage / rencontre est trop proche d\'une déjà enregistrée.',
  EX8008: 'Phrase de parrainage / rendez-vous non trouvée.',
  EX8009: 'Forfait V1 insuffisant pour supporter les secrets du contact.',
  EX8010: 'Forfait V2 insuffisant pour supporter les secrets du contact.',
  EX8011: 'Phrase secrète probablement déjà utilisée. Vérifier que le compte n\'existe pas déjà en essayant de s\'y connecter avec la phrase secrète',
  EX8012: 'Une phrase secrète semblable est déjà utilisée. Changer a minima la première ligne de la phrase secrète pour ce nouveau compte',
  EX8013: 'Réserves de volume V1 insuffisantes de la tribu pour affectation au nouveau compte',
  EX8014: 'Réserves de volume V2 insuffisantes de la tribu pour affectation au nouveau compte',
  EX8015: 'Cet avatar n\'est pas l\'hébergeur actuel du groupe',
  EX8016: 'Groupe encore hébergé : un nouvel hébergeur ne peut se proposer que si le groupe n\'a plus de compte hébergeur',
  EX8017: 'Limite(s) de volume ({0}) insuffisante(s) pour héberger le volume actuel groupe.',
  EX8018: 'Groupe hébergé par un autre avatar',

  EX8055: 'Quota du compte dépassé pour le volume V1. Demande:{0} - Quota:{1}',
  EX8056: 'Quota du compte dépassé pour le volume V2. Demande:{0} - Quota:{1}',
  EX8065: 'Maximum de volume V1 pour les secrets du groupe dépassé (attribué par le compte hébergeur du groupe). Demande:{0} - Maximum:{1}',
  EX8066: 'Maximum de volume V2 pour les secrets du couple dépassé (attribué par le compte hébergeur du groupe). Demande:{0} - Maximum:{1}',
  EX8067: 'Groupe sans hébergeur {0} : augmentation de volumer interdit.',

  EX9001: 'Clé publique du comptable non disponible.',
  EX9002: 'Tribu non trouvée ({0})',
  EX9003: 'Compte non trouvé ({0})',
  EX9004: 'Ligne comptable non trouvée ({0})',
  EX9005: 'Chat non trouvé ({0})',
  EX9007: 'Secret non trouvé ({0})',
  EX9008: 'Avatar non trouvé ({0})',
  EX9009: 'Groupe non trouvé ({0})',
  EX9010: 'Membre non trouvé ({0})',
  EX9011: 'Ligne comptable de l\'avatar hébergeur non trouvée ({0})',
  EX9100: 'Données d\'authentification non trouvées dans la requête',
  EX9100: 'Données d\'authentification illisibles (détail: {0})',
  EX9101: 'Compte non authentifié',
  EX9102: 'Session inconnue du serveur: se reconnecter',

  LOGreinit: 'Ré-initialiser complètement la base locale',
  LOGrazbl: '<b>Attention:</b> la base locale sera effacée et rechargée totalement.' +
  '<BR>Ceci peut alonger <b>significativement</b> la durée d\'initialisation (comme le mode <i>incognito</i>).' +
  '<BR>Les fichiers attachés aux secrets conservés sur cet appareil ne seront plus accessibles en mode avion',

  LOGconn: 'Se Connecter',
  LOGpar: 'Un parrain vous a communiqué une phrase secrète pour créer vous-même votre compte ?',
  LOGphr: 'Phrase communiquée par le parrain',
  LOGcrea: 'Je créé mon compte ...',
  LOGcc: 'Création du compte du Comptable',
  LOGnopp: 'Cette phrase de parrainage est introuvable',
  LOGppinv: 'Cette phrase de parrainage n\'est plus valide',
  LOGppatt: 'Pas de parrainage en attente avec cette phrase',

  // DialogueHelp.vue
  HLPaide: 'Page d\'aide : ',
  HLPaidebd: 'Page d\'aide bientôt disponible',
  HLPfermer: 'Fermer l\'aide',
  HLPprec: 'Page d\'aide précédente',
  HLPvoir: 'Voir aussi ...',

  SHed: 'Editer',
  SHpe: 'Plein écran',
  SHre: 'Réduire',
  
  ERdec: 'Se déconnecter',
  ERrec: 'Tenter de se reconnecter',
  ERcont: 'Poursuivre la session quand-même',
  ERmod: 'Continuer pour modifier les données',
  ERsync: 'Rupture irrémédiable de la synchronisation des données.',

  OPok: 'Succès de l\'opération {0}',
  OPko: 'Echec de l\'opération {0}',

  OPmsg1: `La base locale du compte n'a pas été trouvée.<br>
  Aucune session synchronisée ne s'est préalablement exécutée sur ce poste avec cette phrase secrète.<br>
  Erreur dans la saisie de la ligne 1 de la phrase ?`,
  OPmsg2: `La base locale est absente ou corrompue.<br>
  Code erreur: {0}<br>Se connecter en mode synchronisé ou incognito.`,
  OPmsg3: `La base locale est corrompue et ne peut pas être décryptée.<br>
  Se connecter en mode synchronisé ou incognito.`,
  OPmsg4: 'Votre compte vient d\'être débloqué',
  OPmsg5: 'Votre compte vient d\'être complètement bloqué',
  OPmsg6: 'Vous allez être déconnecté et reconnecté afin de bénéficier de cette nouvelle situation.',
  OPmsg7: 'Code local à 3 lettres',
  OPmsg8: 'Ce code -par défaut "xxx"- facilite la gestion/ suppressions des bases locales obsolètes.',

  OPecho: 'Test d\'écho.',
  OPerreurFonc: 'Test d\'erreur fonctionnelle',
  OPpingdb: 'Test de ping de la base distante',
  OPsync: 'Opération de synchronisation',
  OPccc: 'Créer le compte du comptable',
  OPcnx: 'Se connecter à un compte',
  OPcps: 'Changer de phrase secrete de connexion',
  OPnch: 'Ajouter un item sur un "chat"',
  OPsch: 'Sélectionner des "chats"',
  OPrch: 'Ré-initialiser un "chat"',
  OPlch: 'Obtenir un "chat"',
  OPxch: 'Obtenir le statut de lecture d\'un "chat"',
  OPxco: 'Obtentir la comptabilité d\'un avatar',
  OPbtc: 'Enregistrer le blocage d\'une tribu ou d\'un compte',
  OPxtn: 'Obtenir le nom de la tribu d\'un compte',
  OPvtc: 'Vérifier qu\'un autre compte est parrain de la tribu du compte',
  OPntr: 'Créer une nouvelle tribu',
  OPmtr: 'Mettre à jour le commentaire et les réserves d\'une tribu',
  OPcct: 'Changer un compte de tribu',
  OPmqc: 'Mettre à jour les quotas d\'un compte',
  OPrqc: 'Répartir les quotas entre les avatars d\'un compte',
  OPccv: 'Obtenir des cartes de visite non trouvées dans la session',
  OPmpr: 'Mettre à jour la préférence d\'un compte',
  OPmcv: 'Mettre à jour une carte de visite',
  OPcsc: 'Créer un nouveau secret',
  OPmsc: 'Mettre à jour un secret',
  OPssc: 'Supprimer un secret',
  OPtfa: 'Télécharger un fichier attaché à un secret',
  OPnfa: 'Attacher un nouveau fichier à un secret',
  OPsfa: 'Supprimer un fichier attaché à un secret',
  OPsac: 'Supprimer l\'accès aux secrets d\'un contact',
  OPrac: 'Ré-activer l\'accès aux secrets d\'un contact',
  OPsuc: 'Supprimer un contact',
  OPpnc: 'Parrainer un nouveau compte',
  OPrdv: 'Prendre rendez-vous avec un avatar',
  OPprl: 'Prolonger une proposition (de contact, parrainage ou rendez-vous)',
  OPcco: 'Créer un nouveau contact',
  OPaco: 'Accepter la proposition de contact d\'un avatar',
  OPdco: 'Décliner la proposition de contact d\'un avatar',
  OPard: 'Accepter le rendez-vous d\'un avatar',
  OPdrd: 'Décliner le rendez-vous / parrainage d\'un avatar',
  OPapa: 'Accepter le parrainage d\'un nouveau compte',
  OPdpa: 'Décliner le parrainage d\'un nouveau compte',
  OPmco: 'Mettre à jour un contact',
  OPnpc: 'Basculer l\'indicateur d\'un contact d\'acceptation des invitations à un groupe',
  OPnav: 'Créer un avatar',
  OPmcg: 'Mettre à jour les mots clés d\'un groupe',
  OPblg: 'Bloquer les invitations d\'un groupe',
  OPdbl: 'Débloquer les invitations d\'un groupe',
  OPcgr: 'Créer un groupe',
  OPmcm: 'Mettre à jour les mots clés d\'un membre d\'un groupe',
  OParg: 'Mettre à jour l\'ardoise d\'un membre d\'un groupe',
  OPifg: 'Mettre à jour le commentaire d\'un membre à propos de son groupe',
  OPaig: 'Accepter l\'invitation à un groupe',
  OPdig: 'Décliner l\'invitation à un groupe',
  OPnpm: 'Basculer l\'indicateur d\'un membre d\'acceptation des invitations à un groupe',
  OPrmb: 'Résilier un membre d\'un groupe',
  OPfhb: 'Mettre fin à l\'hébergement d\'un groupe',
  OPdhb: 'Prendre l\'hébergement d\'un groupe',
  OPmvg: 'Mettre à jour les volumes maximum autorisés d\'un groupe',
  OPlaa: 'Mettre à jour le statut lecteur / auteur / animateur d\'un membre d\'un groupe',
  OPpmg: 'Proposer un nouveau membre candidat à un groupe',
  OPimb: 'Inviter un candidat proposé à être membre d\'un groupe',
  OPntl: 'Créer un nouveau texte local',
  OPmtl: 'Mettre à jour un texte local',
  OPstl: 'Supprimer un texte local',
  OPnfl: 'Créer un nouveau fichier local',
  OPmfl: 'Mettre à jour un fichier local',
  OPsfl: 'Supprimer un fichier local',
  OPlfl: 'Lire un fichier local',
  OPchgt: 'Chargement d\'un fichier pour accès en mode avion',
  OPiter: '({0})-Petit incident, nouvel essai en cours, merci d\'attendre',

  PSkb: 'Clavier virtuel',
  PSm0: 'Phrase secrète de connexion',
  PSm1: 'Phrase non confirmée, la re-saisir',
  PSm2: 'Confirmer la phrase secréte',
  PS16c: 'Au moins 16 caractères',
  PSl1: 'Première ligne de la phrase secrète',
  PSl2: 'Seconde ligne de la phrase secrète',
  PSren: 'Renoncer',
  PSval: 'Se connecter',

  UTIatt: 'Information importante',
  UTIac1: 'Action impossible',
  UTIac2: 'Action impossible en mode avion',
  UTImsi: 'Passer en mode synchronisé ou incognito.',
  UTIesp: 'En savoir plus sur le blocage',

  // App.vue / MainLayout
  MLAard1: 'Nouvelle information à lire sur votre ardoise de tribu.',
  MLAard2: 'Votre ardoise de tribu a des informations (toutes déjà lues).',
  MLAardb: 'Ardoise de tribu',
  MLAestc: 'Compte du Comptable',
  MLAcptn: 'Compte',
  MLAcptp: 'Compte (parrain)',
  MLAtri: 'Tribu : {0}',
  MLActc: 'Contacts',
  MLAfic: 'Fichiers-avion',
  MLAchat: 'Chat-Comptable',
  MLAclpb: 'Presse-papier',
  MLAdrc: 'Déconnexion / Reconnexion au compte',
  MLAdecon: 'Déconnexion du compte',
  MLArecon: 'Tentative de reconnexion au compte',
  MLAcont: 'J\'ai lu, la session continue',
  MLAregl: 'Réglages et outils',
  MLAinfm: 'A propos de la session en cours',
  MLAt1c: 'Compte',
  MLAt1a: 'Avatars du compte',
  MLAt1t: 'Tribus',
  MLAt2a: 'Avatar',
  MLAt2s: 'Secrets',
  MLAt2c: 'Contacts',
  MLAt2g: 'Groupes',

  SYtit: 'Chargement et synchronisation des données du compte',
  SYcpt: 'Compte et comptabilité',
  SYava: 'avatar : {0}',
  SYava2: 'avatar : {0} secrets:{1}/{2} chats:{3}/{4} sponsorings:{5}/{6}',
  SYgro: 'groupe : {0}',
  SYgro2: 'groupe : {0} secrets:{1}/{2} membres:{3}/{4}',
  SYcvs: 'cartes de visite : {0} requises, {1} mises à jour',
  /*
  SYcou: 'contact : {0}',
  SYas: 'avatar : {0} - {1} secret(s)',
  SYgr: 'groupe : {0} - {1} secret(s)',
  SYgrm: 'groupe : {0} - {1} secret(s) - {2} membre(s)',
  SYcs: 'contact : {0} - {1} secret(s)',
  SYcv: 'cartes de visite : {0} requises',
  SYcv2: 'cartes de visite : {0} requises, {1} à supprimer',
  SYcv3: 'cartes de visite : {0} requises, {1} rechargées, {2} supprimées',
  */

  IBec: 'Procédures de blocage en cours',
  IB0: 'Pas de procédure de blocage ouverte',
  IB1: 'Restrictions et blocages imminents mais sans conséquence pour l\'instant',
  IB2: 'Volumes des secrets contraints à toujours décroître',
  IB3: 'Consultation seulement, aucune mise à jour',
  IB4: 'Seul le "chat" avec le Comptable est possible (consultations et mises à jour bloquées).',

  IStit: 'Information à propos de la session',
  ISst: 'Statut de la session:',
  ISst0: 'Fermée, connexion possible',
  ISst1: 'Connexion en cours',
  ISst2: 'Session ouverte',
  ISdcs: 'A propos de la dernière session synchronisée',
  ISsy1: 'Début de la dernière terminée',
  ISsy2: 'Fin de la dernière terminée',
  ISsy3: 'Début de celle en cours',
  ISsy4: 'Dernière synchronisation',
  ISsy5: 'Dernier signe de vie du serveur',
  ISnc: 'Information disponible seulement après connexion',

  // PanelContacts
  PCnom: "Nom ...",
  PCti: 'Contacts / membres des groupes',
  PCvi: 'Aucun contact / membre ne répond aux crtières de sélection.',
  PCmb: 'Membre {1}({0}) du groupe:',
  PCav: 'Contact {1}({0}) de:',

  P10tit: 'Détail du compte',
  P10cep: 'Le compte est PARRAIN de la tribu',
  P10nbc: 'La tribu n\'a pas de compte | La tribu a un compte | La tribu a {count} comptes',
  P10par1: 'La tribu n\'a pas de parrain | La tribu a UN parrain | La tribu a {count} parrains',
  P10par2: 'La tribu n\'a pas d`autre parrain | La tribu a UN autre parrain | La tribu a {count} autres parrains',
  P10nvp: 'Parrainer un nouveau compte',

  P11tit: 'Avatar du compte | Avatar du compte | Avatars du compte',

  P12tit: 'Liste des tribus',
  P12fil: 'Filtre',
  P12ntr: 'Nouvelle tribu',
  P12trb: 'Tribus bloquées',
  P12not: 'Aucune tribu ne correspond au critère de recherche',
  P12att:  '{0} {1} attribués',
  P12res:  '{0} {1} réservés',

  P20tit: 'Détail de l\'avatar {0}',
  P20vc: 'Voir la comptabilité de l\'avatar',
  P20rdv: 'Rendez-vous avec un avatar extérieur',

  P22tit: 'Contacts de l\'avatar {0}',

  // Panel Tribu
  PTvide: 'Aucune tribu ne répond au critère de filtre',
  PTtit: 'Tribu {0}',
  PTptr: 'Parrain de la tribu | Parrain de la tribu | Parrains de la tribu',
  PTci: 'Commentaires / information',
  PTvat: 'Volumes déjà attribués aux comptes de la tribu',
  PTres: 'Réserves restantes de volumes à attribuer',
  PTpnc: 'Parrainer un nouveau compte',
  PTtrf: 'Transférer un compte et/ou changer son statut parrain',

  // PanelMenu.vue
  PMEtit: 'Préférences, etc.',
  PMEmod: 'Mode foncé / clair',
  PMEgbl: 'Gestion des bases locales',
  PMEtac: 'Tests d\'accès',
  PMEras: 'Rapport de Synchronisation',
  PMEcry: 'Outils de cryptographie',
  PMEbuild: 'Build: {0}',

  // TestPing
  TP1: 'La base n\'est pas accessible avant connexion à un compte en mode synchronisé ou avion',
  TP2: 'Possible seulement en mode incognito ou synchronisé',
  TP4: 'Possible seulement en mode avion ou synchronisé après connexion à un compte',
  TPt1: 'Test des accès',
  TPt2: 'Accès au serveur distant',
  TPt3: 'Accès à la base sur le serveur distant',
  TPt4: 'Accès à la base locale d\'un compte',

  // OutilsCrypto
  OCtit: 'Outils de cryptography',
  OCh1: 'Hash de la ligne 1',
  OCcx: 'Clé X (PBKFD de la phrase complète)',
  OChcx: 'Hash de la clé X',
  OCec: 'Test d\'écho - émis: [{0}] - reçu: [{1}] - délai:{2}s',
  OCer: 'Erreur simulée',
  OCt1: 'Test d\'écho',
  OCt2: 'Simulation d\'erreur',

  // Gestion des bases
  GBtit: 'Gestion des bases locales',
  GBnc: 'Aucune session ne doit être ouverte quand on veut gérer la suppression de bases locales inutiles',
  GBnb: 'Aucune base locale trouvée',
  GBcl: 'Cliquer sur la base à supprimer',

  // Fiche avatar
  FAnocv: 'Pas d\'autre information',

  IR0: '',
  IR1: 'Volumes des secrets contraints à baisser: blocage en cours',
  IR2: 'Lecture seulement: blocage en cours',
  IR3: 'Blocage complet en cours',
  IR4: 'Lecture seulement: mode avion',

  // Page10 (Compte) et NouvelAvatar
  CPTaptrib: 'A propos de ma tribu {0}',
  CPTimptrib: 'Les ressources du compte sont imputées à la tribu {0}',
  CPTmemo: 'Mémo du compte',
  CPTnomemo: 'pas de mémo enregistré',
  CPTkwc: 'Mots clés du compte',
  CPTnvav: 'Nouvel avatar',
  CPTnvav2: 'Création d\'un nouvel avatar',
  CPTchq: 'Quotas attribués',
  CPTrep: 'Répartir les quotas entre les avatars',
  CPTchps: 'Changer la phrase secrète',
  CPTchps2: 'Changement de la phrase secrète de connexion au compte',
  CPTchps2: 'Changement de la phrase secrète de connexion au compte',
  CPTvcp: 'Changer la phrase',
  CPTnvav3: 'Créer l\'avatar',
  CPTmx1: 'Maximum V1 attribuable : {0}',
  CPTmx2: 'Maximum V2 attribuable : {0}',
  CPTndc: 'Ce nom est déjà celui d\'un de vos avatars. En choisir un autre.',
  CPTfda: 'Quotas déjà attribués aux comptes',
  CPTrd: 'Réserves disponibles pour attribution aux comptes',
  CPTmdc: 'Mémo du compte',

  // choix forfaits
  CFOv1t: 'V1 : Textes - {0}',
  CFOv2f: 'V1 : Fichiers - {0}',
  CFOdiag1: 'Le forfait 1 choisi ne couvre pas le volume actuel ({0})',
  CFOdiag2: 'Le forfait 2 choisi ne couvre pas le volume actuel ({0})',

  EMOsearch1: 'Recherche',
  EMOnotfound: 'rien trouvé',
  EMOsearch2: 'Résultat de recherche',
  EMOrecent: 'Récents',
  EMOsmileys: 'Smileys / Emotions',
  EMOpeople: 'People & Corps',
  EMOnature: 'Animaux / Nature',
  EMOfoods: 'Nourriture / Boisson',
  EMOactivity: 'Activitée',
  EMOplaces: 'Voyages',
  EMOobjects: 'Objets',
  EMOsymbols: 'Symboles',
  EMOflags: 'Drapeaux',
  EMOcustom: 'Custom',

  // NomAvatar
  NAw1: 'Ce nom NE POURRA PLUS être changé.',
  NAw2: 'et caractères non imprimables (CR TAB ...) interdits.',
  NAng: 'Nom du groupe',
  NAnt: 'Nom / code de la tribu',
  NAna: 'Nom de l\'avatar',
  NAph0: 'Saisir un nom', 
  NAph1: 'Saisie non confirmée, re-saisir le nom',
  NAph2: 'Confirmer le nom',
  NAph3: 'Nom confirmé',
  NAe1: 'Entre 4 et 24 caractères',
  NAe2: 'Caractères interdits',

  // Ardoise Tribu
  ARDtit: 'Tribu {0} - Ardoise de {1}',
  ARDoat: 'Ouvrir son ardoise dans sa tribu',
  ARDafc: 'Afficher la comptabilité',
  ARDafb: 'Afficher le blocage',
  ARDtri: 'tribu inconnue',
  ARDnf: 'Pas d\'action proposée pour cet avatar',
  ARDm1: 'Aucun compte ne peut accéder à la comptabilité du comptable (qui ne peut pas être bloqué)',
  ARDm2: 'Seul un compte parrain peut accéder à la comptabilité ou au blocage des autres comptes (de la même tribu)',
  ARDm3: 'Cet avatar n`est pas de la même tribu. Un parrain ne peut pas accéder à la comptabilité ou au blocage d\'un compte d\'une autre tribu',
  
  // Fiche People
  FPEprim: 'primaire',
  FPEppa: 'Seul un parrain de la tribu peut ouvrir les ardoises tribu des comptes de sa tribu',


  CVgph: 'Garder la photo initiale',
  CVcph: 'Changer la photo',
  CVfph: 'Choisir un fichier photo',
  CVdwc: 'Démarrer la webcam',
  CVawc: 'Arrêter la webcam',
  CVpph: 'Prendre une photo',
  CVtop: 'La photo est trop top!',
  CVmav: 'C\'était mieux avant!',
  CVoff: 'Caméra non démarrée',
  CVedit: 'Editer la carte de visite',

  // Panel Comptabilité
  PCOtit: 'Comptabilité de {0}',

  // Nouveau Parrainage
  NPtit: 'Parrainage d\'un nouveau compte',
  NPphr: 'Phrase de parrainage',
  NPnpc: 'Phrase à ne communiquer qu\'au titulaire du compte parrainé',
  NPphl: 'Phrase libre',
  NPpe: 'Presser "Entrée" à la fin de la saisie',
  NPcry: 'Cryptage en cours ...',
  NPavp: 'Nom de l\'avatar primaire du compte',
  NPmot: 'Mot de bienvenue pour le futur compte',
  NP10s: 'De 10 à 140 signes ({0}',
  NPcpa: 'Compte parrain lui-même',
  NPcstd: 'Compte standard',
  NPnpi: 'Merci de ne pas m\'inviter à vos groupes',
  NPinv: 'Vous pouvez m\'inviter à vos groupes',
  NPmax: 'Maximum d\'espace attribués pour les secrets du couple',
  NPzero: 'Mettre 0 pour NE PAS PARTAGER de secrets',
  NPconf: 'Confirmation',
  NPnav: 'Nom de l\'avatar',
  NPmotc: 'Mot de bienvenue',
  NPquo: 'Quotas du compte',
  NPcp: 'C\'est un compte PARRAIN',
  NPmv: 'Volumes maximum attribués aux secrets avec le contact',
  NPbj: 'Bonjour {0} !',
  NP16: 'De 16 à 32 signes',

  // Acceptation de parrainage
  APAtit: 'Acceptation du parrainage de votre compte {0}',
  APApa: 'PARRAIN lui-même',
  APAfi: 'filleul (non parrain)',
  APApp: 'Proposition de parrainage',
  APAnc: 'Nom de votre compte (et de votre avatar primaire)',
  APAnpa: 'Nom du parrain',
  APAqdc: 'Quotas attribués à votre compte',
  APAtr: 'Votre compte est rattaché à la tribu : {0}',
  APAval: 'Validité de la proposition',
  APAps: 'Votre phrase secrète',
  APAps2: 'Saisir et confirmer votre phrase secrète de connexion qui permettra de vous authentifier.',
  APAess: 'Espace maximum attribué pour les secrets partagés avec votre parrain',
  APAesp: 'Votre parrain a de son côté attribuer l\'espace maximal suivant',
  APAnos: 'Votre parrain a opté POUR NE PAS PARTAGER de secrets avec vous',
  APAnos2: 'Mettre 0 pour NE PAS PARTAGER de secrets avec votre parrain',
  APAper: 'Votre parrain a demandé à NE PAS ETRE INVITE à vos groupes)',
  APAper2: 'Votre parrain accepte d\'être invité à vos groupes)',
  APAper3: 'Ce contact est PERSONNEL (le parrain ne peut pas m\'inviter à ses groupes)',
  APAper4: 'Le parrain peut m\'inviter à ce groupe',
  APAmer: 'Rermerciement et acceptation',
  APAconf: 'Confirmer la création du compte',
  APAdec: 'Remerciement et explication : pourquoi je décline la proposition',
  APAdec2: 'Décliner définitivement ce parrainage',

  EBLcs: 'Consultation seulement',
  EBLlc: 'le Comptable',
  EBLup: 'un parrain',
  EBLcp: 'Contrôlé par',
  EBLnbj: 'Nombre de jours passés sur un niveau avant de passer au suivant',
  EBLniv: 'Niveau',
}

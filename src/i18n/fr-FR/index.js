export default {
  nomDuComptable: 'Comptable',
  nomDeAdmin: 'Administrateur',
  nomPartitionPrimitive: 'Primitive',
  defhashtags: 'important indesirable alire archive',
  
  aide: 'Un peu d\'aide ... ', // PageAccueil

  sync: 'Synchronisé', // PageLogin Page Session
  incognito: 'Incognito',
  avion: 'Avion',

  oui: 'oui',
  non: 'non',
  oui1: 'OUI',
  non1: 'NON',

  jamais: 'jamais', // ApercuMembre
  depuis: 'depuis {0}', // ApercuMembre
  avant: 'avant {0}', // ApercuMembre
  entre: 'entre {0} et {1}', // ApercuMembre

  ok: 'OK',
  moi: 'moi', // ...
  jailu: 'J\'ai lu',
  vu: 'vu',
  continuer: 'Continuer',
  supprimer: 'Supprimer',
  retry: 'Ré-essayer', // MenuFichier PageFavicon
  ajouter: 'Ajouter', // PageInvitation
  changer: 'Changer', // PageAdmin
  valider: 'Valider',
  renoncer: 'Renoncer',
  afficher: 'Afficher', // PressePapier
  copier: 'Copier', // PressePapier
  enreg: 'Enregistrer', // PressePapier
  texte: 'Pur texte OU formaté mais non éditable', // EditeurMd
  corriger: 'Corriger', // NouveauSponsoring
  rafraichir: 'Rafraîchir', // PageAdmin
  confirm: 'Pour confirmer taper {0}', // BoutonConfirm
  rienconf: 'Rien à confirmer', // BoutonConfirm
  creer: 'Créer', // PageGroupes
  tous: 'Tous', // PageGroupes PanelCredits
  fermer: 'Fermer', // CarteVisite
  editer: 'Editer', // ApercuNotif ApercuCv
  confirmer: 'Confirmer', // ...
  gerer: 'Gérer', // PageGroupe
  suivant: 'Suivant', // NouveauSponsoring
  precedent: 'Précédent', // NouveauSponsoring NouveauFichier
  entree: 'Presser "Entrée" à la fin de la saisie', // FiltreNom FiltreTxt
  merci: 'Merci {0}', // InvitationAcceptation AcceptationSponsoring
  langue: 'Choix de la langue', // BoutonLangue PageAccueil
  clairfonce: 'Mode clair / foncé', // PageAccueil App.vue
  supprime: 'SUPPRIMÉ', // modele (chat chatgr)
  detail: 'Détails', // PageGroupes ApercuGenx
  details: 'Plus de détails', // PageGroupe
  sponsorise: 'sponsorise',
  sponsor: 'sponsor',

  avatar: 'Avatar {0}', // FiltreAvgr
  groupe: 'Groupe {0}', // FiltreAvgr
  avatar1: 'Avatar {0} - {1} / {2} note(s)', // PageNotes
  groupe1: 'Groupe {0} - {1} / {2} note(s)', // PageNotes
  avatar2: 'Avatar_{0}', // PageNotes
  groupe2: 'Groupe_{0}', // PageNotes
  existe: 'Changer le début de la phrase, il est trop proche de celui d\'une phrase déjà déclarée.', // ...
  nolimite: '(sans limite)', // FiltreVols
  delegue: 'Délégué', // ApercuGenx PagePartition
  test: 'Test', // PageNotes
  compteO: 'Compte de l\'organisation rattaché à la partition {0}.', // NouveauSponsoring
  compteD: 'Compte de l\'organisation, DÉLÉGUÉ par le Comptable pour la partition {0}.', // NouveauSponsoring
  compteA: 'Compte autonome', // ...
  don: 'Don de {0}c', // PageSponsoring NouveauSponsoring
  pasdon: 'Pas de don', // PageSponsoring NouveauSponsoring
  conf: 'Contact CONFIDENTIEL, sans "chat"', // ...
  total: 'Total', // PageEspace
  ping: 'Ping', // OutilsTests

  nbnotes: 'Nb notes', // PageGroupes
  nbnnncng: 'Nb notes, chats et groupes', // PageAdmin
  volv2: 'Volume fichiers', // ChoixQuotas PageAdmin PageGroupes
  limco: 'Plafond conso.', // PageAdmin
  dedh: 'De {0} à {1}', // modele (chat chatgr)
  supprime: '_[supprimé à {0}]_', // modele (chat chatgr)
  actif: 'actif', // MicroChat
  disparu: 'disparu', // App ApercuChat
  plustard: 'Plus Tard', // App
  compteKO: 'Le compte #{0} nommé "{1}" vient d\'être supprimé ou a changé de phrase secrète.', // PageClos
  sessionKO: 'Incident technique nécessitant l\'interruption immédiate de la session. Tenter de se reconnecter plus tard.', // PageClos
  inconnu: '(inconnu)', // PageGroupe
  hashtags: 'Hashtags', // PageNotes
  invitation: 'Invitation', // ApercuMembre
  inchange: 'inchangé', // MenuFichier
  ER404: 'Le serveur de fichier n\'a pas pu délivrer le contenu de fichier', // MenuFichier PageFicavion

  ECclos: 'L\'administrateur technique a fermé l\'application pour l\'organisation "{0}"', // PageClos
  ECmi: 'Message d\'information de sa part [{0}]', // PageClos

  // ApercuTicket MoisM PanelCompta
  mois: 'mois',
  mois1: 'Janvier',
  mois2: 'Février',
  mois3: 'Mars',
  mois4: 'Avril',
  mois5: 'Mai',
  mois6: 'Juin',
  mois7: 'Juillet',
  mois8: 'Août',
  mois9: 'Septembre',
  mois10: 'Octobre',
  mois11: 'Novembre',
  mois12: 'Décembre',

  // session-store
  condA: 'Action impossible, l\'application est en mode "avion".',
  condF: 'Action impossible, l\'application est figée.',
  condL: 'Action impossible, le compte a une restriction de "lecture seulement".',
  condM: 'Action impossible, le compte est restreint aux seules actions d\'urgence.',

  // Filtre notif
  gravite0: '(ignorer)',
  gravite1: 'normale ou importante',
  gravite2: 'importante',

  // Filtre stmb
  stmb0: '(n\'importe lequel)',
  stmb1: 'contact',
  stmb2: 'pré-invité',
  stmb3: 'invité',
  stmb4: 'actif',
  stmb5: 'animateur',

  // Filtre ambno
  ambno0: '(indifférent)',
  ambno1: 'aux membres seulement',
  ambno2: 'aux notes seulement',
  ambno3: 'aux membres et aux notes',
  ambno4: 'ni aux membres ni aux notes',
  ambno5: 'aux notes en écriture',

  // Filtre Rac
  rac0: 'actifs',
  rac1: 'INDESIRABLES',

  FLAGS0: 'a activé l\'accès aux membres', // AM
  FLAGS1: 'a activé l\'accès aux notes',  // AN
  FLAGS2: 'a accès de voir membres', // DM
  FLAGS3: 'a droit de voir les notes', // DN
  FLAGS4: 'a droit d\'éditer les notes', // DE
  FLAGS5: 'a pu voir les membres', // HM
  FLAGS6: 'a pu voir les notes', // HN
  FLAGS7: 'a pu éditer les notes', // HE
  
  // FiltreDel
  roledel0: '(ignorer)',
  roledel1: 'Compte de ma partition',
  roledel2: 'Délégué de ma partition',

  // util
  aujah: 'aujourd\'hui à {0}',
  auja: 'aujourd\'hui',
  hierah: 'hier à {0}',
  hiera: 'hier',
  leah: 'le {0} à {1}',
  lea: 'le {0}',
  jah: '{0} à {1}',
  ja: '{0}',
  nondate: '(non daté)',
  dansjours: 'aujourd\'hui | demain | dans {count} jours',

  // ui-store
  items: 'Aucun item | Un item | {count} items',

  // Exceptions
  EX1: 'Interruption volontaire (appui sur le bouton rouge)',
  EX2: 'Erreur d`accès au serveur, réseau indisponible ?',
  EX3: 'Erreur d\'accès à la base locale',
  EX4: 'Erreur inattendue survenue dans le traitement sur le poste',
  EX5: 'Données saisies non conformes',
  EX6: 'Donnée absente ou corrompue détectée par le browser',
  EX7: 'Erreur inattendue survenue dans le traitement sur le serveur',
  EX8: 'Données transmises au serveur non conformes',
  EX9: '"BUG" très probable: le serveur a lu une donnée corrompue ou n\'a pas trouvé une donnée qui aurait dû être présente.',

  // E_BRK = 1000 // Interruption volontaire de l'opération
  EX1000: 'Interruption volontaire',

  // E_WS = 2000 // Toutes erreurs de réseau
  EX2000: 'Erreur à l\'ouverture de la connexion avec le serveur ( {0} ).\nDétail: {1}',
  EX2001: 'Ouverture de la connexion avec le serveur impossible ( {0} ).',
  EX2002: 'Envoi d\'un message au serveur impossible ( {0} ).\nDétail: {1}',
  EX2003: 'Rupture de la liaison avec le serveur par le serveur ou URL mal configurée ( {0} ).',
  EX2005: 'Erreur de transfert du fichier vers le serveur de fichier. Détail: {0}',
  EX2006: 'Erreur de transfert du fichier vers l\'application locale de stockage de fichiers. Détail: {0}',

  // E_DB = 3000 // Toutes erreurs d'accès à la base locale
  EX3001: 'Ouverture de la base locale impossible.\nDétail: {0}',
  EX3002: 'Erreur d\'accès à la base locale impossible.\nDétail: {0}',

  // E_BRO = 4000 // Erreur inattendue trappée sur le browser
  EX4000: 'Bug probable de l\'application.\nDétail: {0}',
  EX4001: 'Retour de la requête mal formé : parse JSON en erreur. Opération: {0}\nDétail: {1}',
  EX4002: 'Retour de la requête mal formé : désérialisation en erreur. Opération: {0}\nDétail: {1}',
  EX4007: 'Echec d\'encryption. Buffer: {0} - Clé: {1} - Détail: {2}',
  EX4008: 'Echec de decryption. Buffer: {0} - Clé: {1} - Détail: {2}',
  EX4021: 'Bug probable de \'opération "{0}" après plusieurs tentatives aynat échoué.',
  EX4022: 'Fichier impossible à décrypter: {0}',
  EX4023: 'Echec de decryption RSA. Buffer: {0} - Clé: {1} - Détail: {2}',
  EX4024: 'Echec d\'encryption RSA. Buffer: {0} - Clé: {1} - Détail: {2}',

  // F_BRO = 5000 // Erreur fonctionnelle trappée sur le browser

  // A_BRO = 6000 Situation inattendue : assertion trappée par le browser

  // E_SRV = 7000 // Erreur inattendue trappée sur le serveur
  EX7000: 'Erreur de réseau ou de serveur non identifiable : HTTP:[{0}] - message:[{1}]',
  EX7001: 'Le serveur n\'accepte pas les requêtes d\'une application obtenue du site [{0}]',
  EX7003: 'Opération [{0}] inconnue du serveur',
  EX7004: 'Session déconnectée',
  EX7005: 'La version d\'API [{0}] gérée par le serveur est incompatble avec celle [{1}] de l\'application',

  EX7010: 'Trop d\'accès parallèles à la base de données. Réessayer plus tard. Message technique: {0}',
  EX7011: 'Incident technique d\'accès à la base de données. Peut-être de réessayer plus tard évitera ce problème. Message technique: {0}',
  EX7012: 'Code d\'habilitation du lancement du GC incorrect',
  EX7100: 'A priori c\'est une erreur de réseau (internet non joignable, etc.) mais ça peut aussi être le serveur distant qui n\'est pas joignable / lancé : HTTP:[{0}] - URL: [{1}] - message:[{2}]',
  EX7101: 'A priori c\'est une erreur de réseau (internet non joignable, etc.) mais ça peut aussi être le serveur distant qui n\'est pas joignable / lancé : HTTP:[{0}] - URL: [{1}] - message:[{2}]',

  // F_SRV = 8000 // Erreur fonctionnelle trappée sur le serveur
  EX8001: 'Exception générique 1',
  EX8002a: 'Le groupe a disparu, opération impossible',
  EX8001a: 'L\'avatar a disparu, opération impossible',
  EX8010: 'Erreur fonctionnelle volontaire pour test.\nDétail: {0}',
  EX8011: 'Sponsoring non trouvée pour cette phrase.',
  EX8012: 'Ce sponsoring a déjà été accepté ou refusé ou est hors limite. ({0})',
  EX8013: '(BUG) Opération: [{0}] - argument incorrect: [{1}]',
  EX8014: 'Connexion bloquée par l\'Administrateur Technique à partir de {0}.',

  EX8055: 'Quota du compte dépassé pour le nombre de notes, chats, groupes. Demande:{0} - Quota:{1}',
  EX8056: 'Quota du compte dépassé pour le volume de fichiers. Demande:{0} - Quota:{1}',
  EX8065: 'Maximum de notes du groupe dépassé (attribué par le compte hébergeur du groupe). Demande:{0} - Maximum:{1}',
  EX8066: 'Maximum de volume de fichiers pour les notes du groupe dépassé (attribué par le compte hébergeur du groupe). Demande:{0} - Maximum:{1}',

  EX8101: 'L\'administrateur technique a restreint l\'application à la lecture seulement : {0}\nL\'opération ayant tenté une écriture, elle a échoué.',
  EX8102: 'Le code de l\`organisation n\'est pas reconnu.\nCorriger la saisie.',
  EX8104: 'Cette phrase secrète de correspond pas celle du Comptable.',
  EX8105: 'Le compte du Comptable a déjà été créé.',
  EX8106: 'La phrase de sponsoring de l\'Administrateur Technique pour le Comptable de cette organisation n\'est pas celle saisie.',

  EX8203: 'Création impossible de l\'espace [{0 / 1}], numéro déjà attribué.',
  EX8204: 'Création impossible de l\'espace [{0 / 1}], code d\'organisation déjà attribué.',
  EX8205: 'Données d\'authentification absentes.',
  EX8206: 'Données d\'authentification illisibles (détail: {0})',
  EX8207: 'Phrase de sponsoring trop proche d\'une phrase existante.',
  EX8209: 'Compte [{1}] inconnu dans la partition [{0}].',
  EX8210: 'Compte [{1}] pas délégué de la partition [{0}].',
  EX8215: 'Le don est  [{0}c] trop important vis à vis du solde du compte du donateur [{1}c].',
  EX8217: 'Phrase de sponsoring non reconnue.',
  EX8218: 'Seuls le Comptable ou un Délégué peut consulter la comptabilité d\'un autre compte que le leur.',
  EX8219: 'Un délégué ne peut consulter la comptabilité que des comptes de la partition dont il est délégué.',
  EX8220: 'Un compte "A" ne peut pas accéder aux partitions',

  EX8319: 'Le quota de calcul de la partition [{0}] est insuffisant pour accepter ce compte [{1}]',
  EX8320: 'Le quota de nombre de documents de la partition [{0}] est insuffisant pour accepter ce compte [{1}]',
  EX8321: 'Le quota de volume de fichiers de la partition [{0}] est insuffisant pour accepter ce compte [{1}]',
  EX8323: 'Le quota de nombre de documents pour les comptes A [{0}] est insuffisant pour accepter ce compte [{1}]',
  EX8324: 'Le quota de volume de fichiers pour les comptes A [{0}] est insuffisant pour accepter ce compte [{1}]',
  EX8331: 'Le quota global de nombre de documents [{0}] fixé pour l\'espace ne permet pas d\'attribuer ce quota [{1}].',
  EX8332: 'Le quota global de volume de fichiers [{0}] fixé pour l\'espace ne permet pas d\'attribuer ce quota [{1}].',
  EX8333: 'Le quota global de calcul [{0}] fixé pour l\'espace ne permet pas d\'attribuer ce quota [{1}].',

  EX8401: 'L\'avatar sponsor est introuvable (probablement résilié).',
  EX8402: 'Le compte de l\'avatar sponsor est introuvable (probablement résilié).',

  EX8801: 'Action impossible du fait de la restriction "lecture seulement"',
  EX8802: 'Action impossible du fait de la restriction "accès minimal"',

  EX8996: 'Cette organisation n\'est pas reconnue.',
  EX8997: 'Le compte a été radié pour non utilisation prolongée.',
  EX8998: 'La phrase secrète fournie ne correspond à aucun compte enregistré',
  EX8999: 'Cette phrase secrète n\'est pas celle de l\'administrateur technique.',

  // A_SRV = 9000 // Situation inattendue : assertion trappée sur le serveur
  EX9010: 'Erreur fonctionnelle volontaire pour test.\nDétail: {0}',

  EX9016: '(BUG) Accès impossible au document "synthese" [{0}]',
  EX9017: '(BUG) Compteurs de comptabilité corrompus: {0} - {1}',
  EX9019: '(BUG) Mode d\'autorisation non reconnu [{0}]',
  EX9020: 'Mise à jour [{2} / {1}] d\'un document obtenu autrement que par un getXXX ({0})',

  EX9215: 'Le don est  [{0}c] trop important vis à vis du solde du compte du donateur [{1}c].',

  EX9221: '(BUG) Hash de la phrase de contact incorrect',
  EX9222: '(BUG) L\'interlocuteur du chat n\'est pas délégué de la partition',
  EX9223: '(BUG) L\'interlocuteur du chat n\'est pas membre du groupe cité',
  EX9224: '(BUG) L\'avatar n\'est pas un avatar du compte.',
  EX9225: '(BUG) L\'interlocuteur du chat n\'est pas le Comptable',
  EX9226: '(BUG) Il n\'est pas possible de créer un chat avec soi-même (entre deux avatars du même compte)',
  EX9227: '(BUG) L\'avatar cible du rafraîssement des cartes de visite des chats n\'est pas un avatar du compte.',
  EX9228: '(BUG) Numéro de partition déjà attribué',
  EX9229: '(BUG) Numéro de partition inconnu',
  EX9230: '(BUG) Compte A, partition non définie',
  EX9231: '(BUG) Accès interdit à l\'Alerte d\'un compte par un non délégué',
  EX9232: '(BUG) Compte non enregistré dans sa partition',
  EX9233: '(BUG) Compte déjà enregistré dans sa partition future',
  EX9234: '(BUG) Le Comptable ne peut ni changer de partition ni changer son statut de délégué',
  EX9235: '(BUG) Une Alerte de partition ne peut être éditée que par un délégué pour sa partition ou le Comptable',
  EX9237: '(BUG) Un délégué ne peut pas surcharger / supprimer une Alerte émise par le Comptable',
  EX9238: '(BUG) Une Alerte de compte ne peut être éditée que par un délégué de la partition du compte ou le Comptable',
  EX9239: '(BUG) Doublon de numéro de ticket (déjà enregistré)',
  EX9240: '(BUG) Ticket inconnu',
  EX9241: '(BUG) Ticket déjà réceptionné',
  EX9242: '(BUG) Mise à jour d\'une CV d\'un avatar qui n\'est du compte.',
  EX9243: '(BUG) Le compte n\'a pas d\'avatar membre actif animateur du groupe dont la CV est à mettre à jour',
  EX9244: '(BUG) Le compte n\'a de chat avec le titulaire de la carte de visite',
  EX9245: '(BUG) Conflit d\'id d\'avatar.',
  EX9246: '(BUG) Groupe déjà créé.',
  EX9247: '(BUG) Le compte n\'a pas accès aux membres du groupe',
  EX9248: '(BUG) Contact déjà inscrit, doublon',
  EX9249: '(BUG) L\'avatar demandeur n\'est pas un avatar du compte',
  EX9250: '(BUG) L\'avatar demandeur n\'est pas animateur du groupe',
  EX9251: '(BUG) L\'avatar n\'est pas membre du groupe',
  EX9252: '(BUG) L\'avatar n\'est pas "ni pré-invité, ni invité", suppression d\'invitation impossible',
  EX9254: '(BUG) L\'avatar demandeur n\'est pas animateur du groupe',
  EX9255: '(BUG) Un avatar invitant est requis en mode simple',
  EX9256: '(BUG) L\'avatar invité n\'est pas un "contact", impossible de créer une invitation pour lui',
  EX9257: '(BUG) L\'avatar invité n\'est "ni pré-invité, ni invité", impossible de modifier son invitation ni de voter pour',
  EX9258: '(BUG) Le groupe est en mode simple, impossible de "voter"',
  EX9259: '(BUG) L\'avatar n\'est pas invité',
  EX9260: '(BUG) Contact en liste noire compte',
  EX9261: '(BUG) Contact en liste noire groupe',
  EX9262: '(BUG) L\'avatar n\'est pas actif (mise à jour des droits impossible)',
  EX9263: '(BUG) Un des avatars du compte doit être animateur, pour rendre un membre animateur',
  EX9264: '(BUG) Supprimer le statut d\'animateur d\'un membre ne peut être fait que par lui-même',
  EX9265: '(BUG) Les accès membre / note ne peuvent être changés que par l\'avatar lui-même',
  EX9266: '(BUG) Les droits membre / note / écriture ne peuvent être changés que par un animateur',
  EX9267: '(BUG) Seul un animateur du groupe peut radier un autre membre',
  EX9268: '(BUG) Un animateur du groupe doit avoir accès aux membres pour radier un autre membre que lui-même',
  EX9269: '(BUG) Un animateur du groupe ne peut être radié que par lui-même',
  EX9271: '(BUG) Il n\'est pas possible de supprimer une partition ayant encore des comptes',
  EX9272: '(BUG) L\'avatar n\'est pas "contact" du groupe',
  EX9273: '(BUG) L\'avatar n\'est pas "actif" ayant accès aux membres du groupe',
  EX9274: '(BUG) Le compte n\'a pas d\'avatar animateur du groupe',
  EX9275: '(BUG) Le compte n\'a pas d\'avatar membre actif du groupe',
  EX9276: '(BUG) Fin d\'hébergement demandé, mais le compte n\'est pas l\'hébergeur actuel',
  EX9277: '(BUG) Reprise d\'hébergement impossible, le groupe n\'était pas hébergé',
  EX9278: '(BUG) Reprise d\'hébergement impossible, le groupe était déjà hébergé par le compte',
  EX9279: '(BUG) Reprise d\'hébergement impossible, l\'avatar proposé n\'a pas accès aux notes en écriture',
  EX9280: '(BUG) Reprise d\'hébergement impossible, l\'avatar proposé n\'est pas animateur alors que l\'hébergeur actuel l\'est',
  EX9280: '(BUG) Reprise d\'hébergement impossible, l\'avatar proposé n\'est pas animateur alors que l\'hébergeur actuel l\'est',
  EX8281: '(BUG) Reprise d\'hébergement impossible, le quota de nombre de notes / chats / groupes du compte est trop faible pour héberger ce groupe',
  EX8282: '(BUG) Reprise d\'hébergement impossible, le quota de volume de fichiers du compte est trop faible pour héberger ce groupe',
  EX9283: '(BUG) Reprise d\'hébergement par un autre avatar impossible, le compte n\'est pas hébergeur',
  EX9284: '(BUG) Reprise d\'hébergement par un autre avatar impossible, l\'avatar proposé n\'a pas accès aux notes en écriture',
  EX9285: '(BUG) Mise à jour des maximum de notes / fichiers impossible, le compte n\'est pas hébergeur',
  EX9286: '(BUG) Suppression d\'avatar demandée mais ce n\'est pas un avatar secondaire',
  EX9287: '(BUG) La mutation d\'un compte "A" en "O" ou "O" en "A" ne peut être demandée que par un délégué pour sa partition ou le Comptable',
  EX9288: '(BUG) Le compte à muter en compte "O" est déjà un compte O.',
  EX9289: '(BUG) Le compte à muter en compte "A" est déjà un compte A.',
  EX9290: '(BUG) Aucun avatar du compte n\'est membre du groupe de la note.',
  EX9291: '(BUG) Aucun avatar du compte n\'a accès aux notes du groupe de la note.',
  EX9292: '(BUG) L\'avatar de la note n\'est pas avatar du compte.',
  EX9293: '(BUG) L\'avatar du compte auteur de la note n\'a le droit d\'écrire des notes.',
  EX9294: '(BUG) La note "parent" -de rattachement- n\'existe pas.',
  EX9295: '(BUG) Cycle détecté de rattachement [{0}].',
  EX9296: '(BUG) Rattachement d\'une note d\'avatar à une note d\'un autre avatar.',
  EX9297: '(BUG) Rattachement d\'une note de groupe à une note d\'un autre groupe ou d\'un avatar.',
  EX9298: '(BUG) Une note de groupe rattachée à une racine ne peut l\'être qu\'à celle du sien.',
  EX9299: '(BUG) Une note d\'avatar ne peut pas être rattachée à la racine d\'un autre avatar.',
  EX9300: '(BUG) Note ou racine de rattachement non identifiée',
  EX9301: '(BUG) Le compte n\'a pas d\'avatar ayant droit d\'édition sur cette note.',
  EX9303: '(BUG) Seule une note de groupe peut recevoir une exclusivité.',
  EX9304: '(BUG) Pour attribuer l\'exclusité d\'écriture d\'une note, il faut, a) soit être animateur, b) soit l\'avoir soi-même, c) soit que personne ne l\'ait déjà.',
  EX9305: '(BUG) On ne peut attribuer l\'exclusité d\'écriture d\'une note qu\'à un membre ayant droit d\'écriture sur les notes.',
  EX9306: '(BUG) Pour supprimer l\'exclusité d\'écriture d\'une note, il faut, a) soit être animateur, b) soit l\'avoir soi-même.',
  EX9307: '(BUG) Fichier inconnu pour cette note.',
  EX9308: '(BUG) L\'avatar sponsor n\'est pas un avatar du compte.',
  EX9310: '(BUG) Upload déjà validé pour ce fichier de cette note.',
  EX9311: '(BUG) Volume maximum autorisé pour le groupe dépassé.',
  EX9312: '(BUG) Groupe sans hébergeur, le volume de fichiers ne peut pas croître.',
  EX9313: '(BUG) L\'auteur de l\'édition (texte / fichiers) de la note n\'a pas droit d\'écriture.',
  EX9314: '(BUG) La note a un auteur exclusif et ce n\'est pas l\'auteur de l\'édition (texte / fichiers).',
  EX9315: '(BUG) Le compte n\'a pas d\'avatar, animateur ou ayant droit d\'écriture et ayant l\'exclusivité (s\'il y en a une).',
  EX9316: '(BUG) Le Comptable a déjà créé son compte, phrase de sponsoring sans utilité.',
  EX9317: '(BUG) La mutation d\'un compte "A" en "O" ou "O" en "A" ne peut être demandée qu\'en ayant eu l\'accord du compte à muter en donnant sa phrase de contact.',
  EX9318: '(BUG) Taille maximale du groupe atteinte',
  EX9319: 'Le quota de calcul de la partition [{0}] est insuffisant pour accepter ce compte [{1}]',
  EX9320: 'Le quota de nombre de documents de la partition [{0}] est insuffisant pour accepter ce compte [{1}]',
  EX9321: 'Le quota de volume de fichiers de la partition [{0}] est insuffisant pour accepter ce compte [{1}]',
  EX9323: 'Le quota de nombre de documents pour les comptes A [{0}] est insuffisant pour accepter ce compte [{1}]',
  EX9324: 'Le quota de volume de fichiers pour les comptes A [{0}] est insuffisant pour accepter ce compte [{1}]',
  EX9326: 'Le quota de nombre de documents pour les comptes A [{0}] est insuffisant pour accepter le nouveau quota [{1}]',
  EX9327: 'Le quota de volume de fichiers pour les comptes A [{0}] est insuffisant pour accepter le nouveau quota [{1}]',
  EX9328: 'Le quota de calcul de la partition [{0}] est insuffisant pour accepter le nouveau quota [{1}]',
  EX9329: 'Le quota de nombre de documents de la partition [{0}] est insuffisant pour accepter le nouveau quota [{1}]',
  EX9330: 'Le quota de volume de fichiers de la partition [{0}] est insuffisant pour accepter le nouveau quota [{1}]',
  EX9331: '(BUG) Argument qv mal formé. Source: [{0}] - Propriété:{1} Cause:{2}',

  // EX9100: 'Erreur de cryptage AES: {0}',
  // EX9101: 'Erreur de cryptage RSA: {0}',
  EX9999: 'L\'administrateur technique a fermé l\'application : {0}.',

  OP_ConnexionAdmin: 'Connexion en tant qu\'administrateur technique',
  OP_ConnexionCompte: 'Connexion d\'un compte standard',
  OP_McMemo: 'Changement des hashtags et mémo attachés à un contact ou groupe',
  OP_ExistePhrase: 'Test d\'existence d\'une phrase de connexion / contact / sponsoring',
  OP_ExistePhrase1: 'Test d\'existence d\'une phrase de connexion / contact / sponsoring',
  OP_MajCv: 'Mise à jour de la carte de visite d\'un avatar',
  OP_ChangementPS: 'Changement de la phrase secrete de connexion du compte',
  OP_ChangementPC: 'Changement de la phrase de contact d\'un avatar',
  OP_GetAvatarPC: 'Récupération d\'un avatar par sa phrase de contact',
  OP_AjoutSponsoring: 'Création d\'un sponsoring',
  OP_GetSponsoring: 'Recherche d\'un sponsoring',
  OP_PassifChat: 'Mise en état "passif" d\'un chat',
  OP_NouveauChat: 'Création d\'un "chat"',
  OP_MajChat: 'Mise à jour d\'un "chat".',
  OP_RafraichirCvsAv: 'Rafraichissement des CVs des chats de l\'avatar',
  OP_NouvelAvatar: 'Création d\'un nouvel avatar du compte',
  OP_NouvellePartition: 'Création d\'une nouvelle partition',
  OP_SetNotifE: 'Inscription d\'une Alerte générale',
  OP_SetNotifP: 'Inscription / mise à jour de l\'Alerte d\'une partition',
  OP_SetNotifC: 'Inscription / mise à jour de l\'Alerte d\'un compte',
  OP_SetQuotasPart: 'Mise à jour des quotas d\'une partition',
  OP_SetCodePart: 'Mise à jour du code d\'une partition',
  OP_DeleguePartition: 'Changement de statut délégué d\'un compte dans sa partition',
  OP_SetQuotas: 'Fixation des quotas d\'ùn compte dans sa partition',
  OP_ChangerPartition: 'Transfert d\'un compte O dans une autre partition',
  OP_SetDhvuCompte: 'Mise à jour de la date-heure de "vu" des Alertes d\'un compte',
  OP_GetEspace: 'Obtention de l\'espace du compte',
  OP_SetEspaceQuotas : 'Déclaration des quotas globaux de l\'espace par l\'administrateur technique',
  OP_NouveauGroupe: 'Création d\'un nouveau groupe',
  OP_HebGroupe: 'Gestion / transfert d\'hébergement d\'un groupe',
  OP_MajDroitsMembre: 'Mise à jour des droits d\'un membre sur un groupe',
  OP_RadierMembre: 'Radiation d\'un membre d\'un groupe',
  OP_ModeSimple: 'Demande de retour au mode simple ou unanime d\'invitation à un groupe',
  OP_ItemChatgr: 'Ajout ou effacement d\'un item "chat" d\'un groupe',
  OP_InvitationGroupe: 'Invitation à un groupe',
  OP_AcceptInvitation: 'Acceptation d\'une invitation à un groupe',
  OP_NouvelleNote: 'Création d\'une nouvelle note',
  OP_SupprNote: 'Suppression d\'une note',
  OP_MajNote: 'Mise à jour du texte d\'une note',
  OP_ExcluNote: 'Changement de l\'attribution de l\'exclusivité d\'écriture d\'une note',
  OP_HTNote: 'Changement des hashtags attachés à une note par un compte',
  OP_RattNote: 'Gestion du rattachement d\'une note à une autre',
  OP_NouveauFichier: 'Enregistrement d\'un nouveau fichier attaché à une note',
  OP_DownloadFichier: 'Téléchargement d\'un fichier attaché à une note',
  OP_SupprFichier: 'Suppression d\'un fichier attaché à une note',
  OP_SupprAvatar: 'Suppression d\'un avatar du compte',
  OP_SupprCompte: 'Suppression du compte',
  OP_GetSynthese: 'Obtention de la synthèse de l\'espace',
  OP_GetEspace: 'Obtention de l\'espace',
  OP_GetEspaces: 'Obtention de tous les espaces',
  OP_SetEspaceOptionA: 'Changement des options de l\'espace',
  OP_SetEspaceDlvat: 'Changement de la date limite de vie des comptes "O" par l\'administrateur',
  OP_PlusTicket: 'Génération d\'un ticket de crédit',
  OP_MoinsTicket: 'Suppression d\'un ticket de crédit',
  OP_StatutAvatar: 'Vérification que le bénéficiaire envisagé d\'un don est bien un compte autonome',
  OP_ReceptionTicket: 'Réception d\'un ticket par le Comptable',
  OP_AcceptationSponsoring: 'Acceptation d\'un sponsoring et création d\'un nouveau compte',
  OP_RefusSponsoring: 'Rejet d\'une proposition de sponsoring',
  OP_ProlongerSponsoring: 'Prolongation / annulation d\'un sponsoring',
  OP_CreationEspace: 'Création d\'un nouvel espace',
  OP_MajSponsEspace : 'Changement de la phrase de contact du Comptable',
  OP_CreationComptable: 'Ccréation du comptable d\'un nouvel espace.',
  OP_EchoTexte: 'Lancement d\'un test d\'écho',
  OP_ErreurFonc: 'Simulation d\'une erreur fonctionnelle',
  OP_PingDB: '"Ping" de la base distante',
  OP_AnnulerContact: 'Annulation du statut de contact d\'un groupe par un avatar',
  OP_RafraichirCvsGr: 'Rafraichissement des CVs des membres d\'un grouper',
  OP_MuterCompteO: 'Mutation d\'un compte A en compte O',
  OP_MuterCompteA: 'Mutation du compte O en compte A',
  OP_GetPub: 'Obtention d\'une clé publique',
  OP_GetPubOrg: 'Obtention d\'une clé publique',
  OP_GetAvatarPC: 'Récupération d\'un avatar par sa phrase de contact',
  OP_NouveauChat: 'Création d\'un nouveau chat',
  OP_ComptaStat : 'Enregistre en storage la statistique de comptabilité',
  OP_DownloadStatC: 'Téléchargement d\'un fichier statistique comptable mensuel',
  OP_DownloadStatC2: 'Téléchargement d\'un fichier statistique comptable mensuel déjà calculé',
  OP_GetPartition: 'Obtention d\'une partition',
  OP_GetCompta: 'Obtention dùne comptabilité',
  OP_GetNotifC: 'Obtention de l\'Alerte d\'un compte.',
  OP_NouveauContact: 'Ajout d\'un contact à un groupe',
  OP_InitTachesGC: 'Initialisation des tâches du GC',
  OP_StartDemon: 'Lancement immédiat du démon',
  OP_TicketsStat: 'Téléchargements en CSV de la liste des tickets d\'un mois',
  OP_GetTaches: 'Liste des tâches différées',
  OP_DelTache: 'Suppression d\'une tâche différée',
  OP_GoTache: 'Lancement immédiat d\'une tâche différée',
  OP_SetQuotasA: 'Mise à jour des quotas pour les comptes A',

  // Login
  LOGpubsub: 'Autoriser les "notifications" afin d\'avoir des données à jour en continu même suite aux actions des autres sessions',
  LOGcrec: 'Le compte du Comptable a été créé: vous pouvez vous y connecter.',
  LOGreinit: 'Ré-initialiser complètement la base locale',
  LOGrazbl: '<b>Attention:</b> la base locale sera effacée et rechargée totalement.' +
  '<BR>Ceci peut alonger <b>significativement</b> la durée d\'initialisation (comme le mode <i>incognito</i>).' +
  '<BR>Les fichiers attachés aux notes conservés sur cet appareil ne seront plus accessibles en mode avion',
  LOGconn: 'Se Connecter',
  LOGconn2: 'Se Connecter à son compte en mode ...',
  LOGconn3: 'Créer votre propre compte ...',
  LOGpar: 'Pour créer un compte, il faut qu\'un sponsor ait enregistré une phrase de reconnaissance spécifique au compte à créer. Saisir ci-après le nom de l\'organisation et cette phrase.',
  LOGphr: 'Phrase communiquée par le sponsor',
  LOGnopp: 'Phrase de sponsoring introuvable',
  LOGppinv: 'Date de validité de la phrase de sponsoring dépassée',
  LOGppatt: 'Pas de sponsoring en attente avec cette phrase',
  LOGsp1: 'Sponsoring dèjà refusé',
  LOGsp2: 'Sponsoring dèjà accepté',
  LOGsp3: 'Sponsoring annulé par le sponsor',
  LOGnosp: 'Le compte du Comptable ne peut pas être créé: la phrase d\'autorisation déclarée par l\'Administrateur Technique n\'est pas celle saisie.',
  LOGnosp2: '(BUG) Clé E non decryptable. Demander à l\'Administrateur Technique de décklarer une nouvelle phrase d\'autisation de compte Comptable.', 
  
  // Rapport Synchro
  RStit: 'Avatars et groupes du compte "{0}"',
  RScav: 'Avatars',
  RScgr: 'Groupes',
  RScno: 'notes',
  RScch: 'chats',
  RScsp: 'sponsor.',
  RSctk: 'tickets',
  RScmb: 'membres',
  RScbl: '-',

  // App.vue reload
  RLnvver: 'Nouvelle version disponible',
  RLnvver2: 'Une nouvelle version a été téléchargée et est prête à être installée',
  RLtit1: 'Il est important d\'en bénéficier le plus tôt possible en raison d\'éventuels correctifs d\erreurs qu\'ele peut inclure.',
  RLtit2: 'L\'installation initialise une nouvelle session et le besoin de se connecter à nouveau.', 
  RLopt: 'Option {0} :',
  RLopt1: 'presser le bouton ',
  RLopt2: 'presser CONTROL+F5',
  RLopt3: 'fermer la fenêtre / onglet puis appeler à nouveau l\'aplication dans une nouvelle fenêtre / onglet.',
  RLinstal: 'Installer',

  // OutilsTests.vue
  OTtit: 'Outils et tests',
  OTbuild: 'Build: {0}',
  OTcpt: 'Comptes synchronisés',
  OTtst: 'Tests d\'accès',
  OTps: 'Tester une phrase secrète',
  OTh1: 'Hash du PBKFD de la phrase réduite',
  OTcx: 'SHA256 du PBKFD de la phrase complète',
  OThcx: 'Hash du PBKFD de la phrase complète',
  OTec: 'Test d\'écho - émis: [{0}] - reçu: [{1}] - délai:{2}s',
  OTer: 'Erreur simulée',
  OTt1: 'Test d\'écho',
  OTt2: 'Simulation d\'erreur',
  OTt3: 'Hashtags',

  // TestPing
  TP1: 'La base n\'est pas accessible avant connexion à un compte en mode synchronisé ou avion',
  TP2: 'Possible seulement en mode incognito ou synchronisé',
  TP4: 'Possible seulement en mode avion ou synchronisé après connexion à un compte',
  TPt2: 'Accès au serveur distant',
  TPt3: 'Accès à la base sur le serveur distant',
  TPt4: 'Accès à la base locale d\'un compte',

  // Gestion des bases
  GBnc: 'Aucune session ne doit être ouverte quand on veut gérer la suppression de bases locales inutiles',
  GBnb: 'Aucune base locale trouvée',
  GBcl: 'Cliquer sur la base à supprimer',
  GBvol: 'Calcul du Volume',
  GBfi: 'Fichiers : {0}',
  GBm1: 'Cette base ne peut PLUS être accédée : elle peut être supprimée sans conséquences.',
  GBm2: 'Cette base peut encore être accédée par une phrase secrète: sa suppression interdira le mode "avion" pour ce compte.',
  GBcb: 'Je conserve la base',
  GBsb: 'Je supprime la base',
  GBprop: 'Propriétaire: {0}',
  GBnomb: 'Nom de la base:',

  // DialogueHelp.vue
  HLPaidebd: 'Page "{0}" bientôt disponible',
  HLPaidebd2: 'Cette page d\'aide n\'est pas encore disponible mais devrait l\'être bientôt.',
  HLPfermer: 'Fermer l\'aide',
  HLPprec: 'Page d\'aide précédente',
  HLPfiltre: 'Filtre sur les titres',
  HLPdg: 'Site de documentaion de l\'application',
  HLPmenu: 'Voir le détail dans le menu ci-dessus, rubrique _{0}_',

  // Page sponsorings - Nouveau sponsoring
  NPnouv: 'Sponsoriser un nouveau compte',
  NPnosp: 'Aucun sponsoring n\'est actuellement en cours ou récent',
  NPspex: 'Liste des sponsorings actuellement en cours ou récents',
  NPpro: 'Date limite de validité dans ...',
  NPpro7: '7 jours',
  NPpro20: '20 jours',
  NPpro30: '30 jours',
  NPprof: 'Profil du compte',
  NPpdon: 'Don au nouveau compte',
  NPphr: 'Phrase de sponsoring',
  NPdlv: 'Date limite de validité:',
  NPst0: 'Proposition en attente de réponse déposée {0}',
  NPst1: 'Proposition refusée {0}',
  NPst2: 'Proposition acceptée {0}',
  NPst3: 'Proposition annulée par l\'avatar sponsor {0}',
  NPnom: 'Nom de l\'avatar sponsorisé:',
  NPsponsor: 'Sponsor du compte:',
  NPacc: 'J\'accepte',
  NPdec: 'Je décline',
  NPann: 'Annuler',
  NPtit: 'Sponsoring d\'un nouveau compte',
  NPnpc: 'Phrase à ne communiquer qu\'au titulaire du compte sponsorisé',
  NPphl: 'les framboises sont bleues cette année',
  NPavp: 'Nom de l\'avatar primaire du compte',
  NPmot: 'Mot de bienvenue pour le futur compte',
  NPmota: 'Mot de remerciement pour le sponsor',
  NPmotc: 'Mot de bienvenue',
  NPmotd: 'Explication du refus de sponsoring pour le sponsor',
  NP10s: 'De 10 à 140 signes ({0}',
  NPquo: 'Abonement du nouveau compte',
  NPquo1: 'Quotas (notes...) et fichiers attribués au nouveau compte',
  NPconf: 'Confirmation',
  NPnav: 'Nom de l\'avatar',
  NPbj: 'Bonjour {0} !',
  NP16: 'Au moins {0} signes',
  NPcred: 'Solde insuffisant actuel {0}c pour un don de {1}c.',
  NPdon: 'Don de votre sponsor: {0}c',
  NPdon2: 'Don au sponsorisé: {0}c',

  // Showdown
  SHed: 'Editer',
  SHpe: 'Plein écran',
  SHre: 'Réduire',
  
  // DialogueErreur
  ERdec: 'Se déconnecter',
  ERfige: 'Voir les Alertes',
  ERrec: 'Tenter de se reconnecter',
  ERcont: 'Poursuivre la session quand-même',
  ERmod: 'Continuer pour modifier les données',
  ERrlog: 'Reprendre la procédure de connexion',

  // synchro
  OPok: 'Succès de l\'opération {0}',
  OPko: 'Echec de l\'opération {0}',
  OPmsg1: `La base locale du compte n'a pas été trouvée.<br>
  Aucune session synchronisée ne s'est préalablement exécutée sur ce poste avec cette phrase secrète.<br>
  Erreur dans la saisie de la phrase ?`,
  OPmsg2: `La base locale est absente ou corrompue.<br>
  Code erreur: {0}<br>Se connecter en mode synchronisé ou incognito.`,
  OPmsg3: `La base locale est corrompue et ne peut pas être décryptée.<br>
  Se connecter en mode synchronisé ou incognito.`,
  OPmsg7: 'Code local à 3 lettres',
  OPmsg8: 'Ce code -par défaut "xxx"- facilite la gestion / suppressions des bases locales obsolètes.',

  PSkb: 'Clavier virtuel',
  PSorg1: 'Organisation:',
  PSorg2: '3 à 12 minuscules / chiffres / moins',
  PSorg3: 'monasso-94',
  PSm0: 'Phrase secrète de connexion',
  PSm1: 'Phrase non confirmée, la re-saisir',
  PSm2: 'Confirmer la phrase secréte',
  PSnbc: 'Au moins {0} caractères',
  PSl1: 'les sanglots longs de ...',
  PSctc1: 'Phrase de contact',
  PSctc3: 'Le code de l\'organisation est requis',

  // App.vue : nom des pages
  Pnull: '',
  Plogin: 'Connexion à un compte',
  Pclos: 'Application fermée',
  Plogin666: 'Création du compte du comptable',
  Padmin: 'Administration technique',
  Paccueil: 'Accueil',
  Psession: 'Etat de la session ouverte',
  Pcompte: 'Ce compte et ses avatars',
  Psponsorings: 'Sponsorings de {0}',
  Pchats: 'Tous les "chats"',
  Pespace: 'Espace {0}',
  Ppartition: 'Partition {0}',
  Ppartition2: 'Sponsors de ma partition',
  Pcompta: 'Alertes & abonnement ...',
  Pgroupes: 'Tous les groupes',
  Pgroupesac: 'Groupes de {0}',
  Pgroupe: 'Groupe {0}',
  Pinvitation: 'Invitation au groupe {0}',
  Ppeople: 'Tous les contacts',
  Pnotes: 'Toutes les notes',
  Pficavion: 'Fichiers visibles en avion',

  // App.vue
  MLAntfg: 'Le navigateur "accepte" les notifications pour l\'application.',
  MLAntfd: 'Le navigateur "bloque les notifications" pour l\'application.',
  MLAntfr1: 'Demander au navigateur d\'autoriser les notifications',
  MLAntfr2: 'Vous devez modifier les autorisations du navigateur pour cette application afin qu\'il accepte les notifications',
  MLAhbKO: 'Le service de publication des mises à jour par les autres est temporairement HORS-SERVICE.',
  MLAhbKO2: 'Tentative de reconnexion #{0}',
  MLAhbOK: 'Le service de publication des mises à jour par les autres est a priori en service',
  MLAraf: 'Rafraîchir les données',
  MLAmajok: 'Les données de la session sont mises à jour en continu, même suite aux actions des autres sessions.',
  MLAnotif: 'Notifications des maj',

  MLAbrk: 'Opération en cours',
  MLAatt: 'Information importante',
  MLAcf: 'Voulez-vous vraiement arrêter l\'opération en cours "{0}"',
  MLAcf3: 'Non, je la laisse se poursuivre',
  MLAcf4: 'Oui, je veux l\'interrompre (si possible)',
  MLAsfer: 'pas de compte connecté',
  MLAout: 'Outils et tests techniques',
  MLAntf: 'Alertes',
  MLAabo: 'Abonnement / Conso.',
  MLAcred: 'Gestions des crédits',
  MLAchats: 'Chats d\'urgence',
  MLAchat: 'Chat-Comptable',
  MLAdrc: 'Déconnexion / Reconnexion au compte',
  MLAdrc2: 'Déconnexion / Reconnexion',
  MLAdecon: 'Déconnexion du compte',
  MLArecon: 'Tentative de reconnexion au compte',
  MLAcont: 'J\'ai lu, la session continue',
  MLAinfm: 'Résumé de la session en cours',
  MLAsync: 'Synchro Auto',
  MLAcptz: 'La suppression du compte est en cours | Suppression du compte demain | Suppression du compte dans {count} jours',
  MLAcptzA: 'Le crédit du compte est presque épuisé',
  MLAcptz0: 'L\'organisation ne participe plus aux coûts d\'hébergement des comptes "O"',
  MLAnot: 'Alertes, abonnement et consommation, chats d\'urgence',
  MLAfiltre: 'Ouvrir les paramètres du filtre',
  MLArech: 'Recherche ...',
  MLApp: 'Presse-papier notes/fichiers',
  MLAfav: 'Fichiers visibles en avion',

  // Nom des filtres
  FInom: 'Début du nom du contact',
  FIngr: 'Début du nom du groupe',
  FInomc: 'Début du nom du compte',
  FInmb: 'Début du nom du membre',
  FInote: 'Texte de la note contenant',
  FIinfmb: 'Texte dans les mémos attachés aux groupes',
  FItxt: 'Texte cherché dans les chats',
  FItxtt: 'Texte cherché dans les commentaires',
  FItxtn: 'Texte cherché dans les Alertes',
  FImcp: 'Ayant les mots-clés ...',
  FImcn: 'Mais N\'ayant PAS les hashtags ...',
  FIvf: 'Taille totale des fichiers > ...',

  FIjours: 'Modifiés dans les N jours',
  FIinvits: 'Groupes ayant des invitations en cours',
  FIavecsp: 'Seulement les délégués',
  FIchel: 'Chats en ligne seulement', // ???
  FIavecgr: 'Membre d\'un groupe',
  FInotif: 'Ayant une Alerte ... {0}',
  FIstmb: 'Ayant un statut ... {0}',
  FIambno: 'Accès aux notes / membres...',
  FIrac: 'Actifs / Indésirables...', // ???
  FIpart: 'Comptes de ma partition ... {0}',
  FIsansheb: 'Groupes sans hébergement',
  FIexcesvol: 'Groupes en excédent de volume',
  FItri: 'Tier par ...',
  FItavgr: '(tous avatars et groupes)',
  FIavgrt: 'Filtrer sur UN avatar / groupe',

  // PressePapier
  PPnotes: 'Notes',
  PPfic: 'Fichiers',
  PPnno: '(aucune note dans le presse-papier)',
  PPnfi: '(aucun fichier dans le presse-papier)',
  PPano: 'Ajouter une note',
  PPafi: 'Ajouter un fichier',
  PPsuppn: 'Supprimer vraiment la note ci-dessous ?',
  PPsuppf: 'Supprimer vraiment le fichier ci-dessous ?',
  PPerrb: 'Contenu du fichier non disponible (corrompu ? effacé ?)',
  PPndf: 'Nom du fichier',
  PPapf: 'A propos du fichier (facultatif)',
  PPphf: 'monfic.jpg',
  PPmaj: 'Remplacer',
  PPajo: 'Ajouter',
  PPl1: 'Modifier un fichier existant',
  PPl2: 'Ajouter un nouveau fichier',
  PPl3: 'Choisir un fichier local (50Mo max)',
  PPminmax: 'Au plus {0} signes.',
  PPci: 'et non imprimables (CR TAB ...) interdits.',
  PPnoi: '(sans commentaires)',
  PPnv1: 'Edition d\'une note existante',
  PPnv2: 'Création d\'une nouvelle note',

  // Critères de tri
  TRIespace0: 'Numéro de tranche ↑',
  TRIespace1: 'Nb d\'Alertes de partition ↑',
  TRIespace2: 'Nb d\'Alertes de partition ↓',
  TRIespace3: 'Nb d\'Alertes de compte ↑',
  TRIespace4: 'Nb d\'Alertes de compte ↓',
  TRIespace5: 'Quota Q1 (textes des notes) ↑',
  TRIespace6: 'Quota Q1 (textes des notes) ↓',
  TRIespace7: 'Quota Q2 (fichiers des notes) ↑',
  TRIespace8: 'Quota Q2 (fichiers des notes) ↓',
  TRIespace9: '% attribution de Q1 ↑',
  TRIespace10: '% attribution de Q1 ↓',
  TRIespace11: '% attribution de Q2 ↑',
  TRIespace12: '% attribution de Q2 ↓',
  TRIespace13: '% utilisation de Q1 ↑',
  TRIespace14: '% utilisation de Q1 ↓',
  TRIespace15: '% utilisation de Q2 ↑',
  TRIespace16: '% utilisation de Q2 ↓',
  TRIespace17: 'Nombre de comptes ↑',
  TRIespace18: 'Nombre de comptes ↓',

  TRIpartition0: '(non trié)',
  TRIpartition1: 'Quota nb notes, chats ↑',
  TRIpartition2: 'Quota nb notes, chats ↓',
  TRIpartition3: 'Quota fichiers des notes ↑',
  TRIpartition4: 'Quota fichiers des notes ↓',
  TRIpartition5: '% util. quota nb notes... ↑',
  TRIpartition6: '% util. quota nb notes... ↓',
  TRIpartition7: '% util. quota fichiers ↑',
  TRIpartition8: '% util. quota fichiers ↓',

  // MenuAccueil
  SAVtit: 'Avatar sélectionné',
  SGRtit: 'Groupe sélectionné',
  ACgr: 'Détail du groupe',
  ACgroupes: 'Ses groupes',
  ACchats: 'Tous les "chats"',
  ACseschats: 'Ses "chats"',
  ACsponsorings: 'Ses sponsorings',
  ACmesav2: 'Ce compte, ses avatars',
  ACmesav1: 'Ce compte (délégué), ses avatars',
  ACmesgr: 'Pas encore de participation à des groupes | Participation à un groupe ( | Participations à {count} groupes (',
  ACmesgra: 'actif',
  ACmesgri: 'invité',
  ACmesgrc: 'simple contact',
  ACmesctc: 'Tous les contacts',
  ACgpart: 'Gestion de ma partition',
  ACpartitions: 'Partitions de l\'espace',
  ACmesnotes: 'Toutes les notes',
  ACbloc: 'Le compte est "en accès restreint" : les seules actions possibles sont l\'échange de chats avec le Comptable et, pour un compte "O" les délégués de sa partition.',
  ACtgr: 'Détail du groupe',
  ACtmb: 'Membres',

  // PageAdmin et ApercuEspace
  EStabe: 'Liste des Espaces',
  EStabt: 'Tâches en cours',
  ESfta: 'Filtre sur le code espace :',
  ESencrea: 'Comptable pas encore créé.',
  ENnpspc: 'Nouvelle phrase de sponsoring du Comptable',
  ESinitgc: 'Tâches du GC initialisées: {0} existante(s), {1} créées',
  ESgc: 'Lancer un GC',
  ESgcin: 'Init. tâches GC',
  ESstartd: 'Start Démon',
  ESgcop: 'Tester GC op',
  ESdms: 'Dernière stat: {0}',
  ESne: 'Org.',
  ESne2: 'Organisation à héberger',
  ESlo: 'Aucune organisation hébergée | Une organisation hébergée | {count} organisations hébergées',
  ESns: 'ID de l\'espace attribué',
  ESgccode: 'Code d\'habilitation',
  ESnsh: '0...9 OU a...z OU A...Z',
  ESnsh2: '* OU 0...9 OU a...z OU A...Z',
  ESdlvat: 'Connexions des comptes acceptés jusqu\'à :',
  ESchg: 'Changer les quootas globaux de l\'espace',
  ESdlc: 'Rapport du mois :',
  ESnbmi: 'Comptes supprimés après N mois sans connexion',
  ESnbmi2: 'Comptes supprimés après {0} mois sans connexion',
  ESorg: 'Organisation',
  ESquotas: 'Quotas totaux de l\'espace fixés par l\'administrateur technique:',
  ESreq: 'Valeur requise',
  ESnum: 'Numéro d\'espace non disponible',
  ESorg1: 'Au moins 4 caractères/chiffres',
  ESorg2: 'Au plus 8 caractères/chiffres',
  ESorg3: 'Minuscules (a-z), chiffres (0-9) et tiret (moins)',
  ESorg4: 'Nom d\'organisation déjà attribué',
  EStabe: 'Espaces',
  EStabt: 'Tâches',

  // Page people et ApercuPeople
  APnb: 'Aucun contact sur {0} ne répond au critère de recherche',
  APtit: 'Détail du contact {0}',

  // Micro chat
  CHnxco: 'Il n\'existe pas de chat avec le Comptable, mais il est possible d\'en créer un maintenant.',
  CHnxdel: '[{0}] est délégué de la partition: il n\'existe pas de chat avec lui, mais il peut être crée maintenant.',
  CHnxmb: '[{0}] est membre du groupe [{1}]: il n\'existe pas de chat avec lui, mais il peut être crée maintenant.',
  CHnxpc: 'Il n\'existe pas de chat avec [{0}]: pour en créer un maintenant, il faut connaître SA PHRASE DE CONTACT.',
  CHech1: 'Texte du premier échange:',
  CHbtncr: 'Créer le chat',
  CHbtnov: 'Ouvrir le chat',
  CHde: 'Entre {0} et ...',
  CHgr: 'Dans le groupe ...',
  CHavdisp: '[l\'interlocuteur a disparu]',
  CHnch2: 'Aucun chat ne répond au critère de recherche | Un chat répond au critère de recherche | {count} chats répondent au critère de recherche',
  CHnchtot: ' sur {0}.',
  CHoch2: 'Chat dans le groupe {0}',
  CHoch3: 'Chat entre {0} et {1}',
  CHexp: 'Exporter la sélection des "chats"',
  CHexpok: 'Fichier sauvé dans votre répertoire de Téléchargements.',
  CHopt: 'Photos intégrées au fichier',
  CHdhc: 'Dernière mise à jour: {0}',
  CHerr: 'Incident technique lors de l\'afficage du résultat',
  CHrac: 'Classer "INDÉSIRABLE"',
  CHrac2: 'Tous les échanges vont être supprimés pour vous (pas pour {0}).' +
  ' Le chat sera classé "INDÉSIRABLE". Si {0} écrit un échange il apparaîtra.' +
  ' Le chat cessera d\'être indésirable à la prochaine écriture.',
  CHraccroche: 'INDÉSIRABLE',
  CHraccroche2: '[INDÉSIRABLE pour {0}]',
  CHnbit: 'aucun échange | un échange | {count} échanges',
  CHeff: 'Effacement définitif du contenu de cet échange ?',
  CHeffa: '(effacé {0})',
  CHeffcf: 'Je confirme l\'effacement',
  CHadd1: 'Nouvel échange',
  CHadd2: 'Faire un don',
  CHzombi: 'Ce chat n\'existe plus',
  CHdisp: 'L\'avatar a DISPARU (résilié, auto-résilié, inactivité prolongée): le "chat" avec lui ne peut plus être mis à jour.',
  CHsuppr: 'L\'avatar a DISPARU (résilié, auto-résilié, inactivité prolongée): le "chat" avec lui n\'existe plus.',
  CHmdon: 'Montant du don (en €)',
  CHconfid: 'confidentiel',
  CHdonde: '### Don de {0}€',
  CHcred: 'Solde du compte ({0}c) insuffisant pour supporter ce don ({1}c).',
  CHcdon: 'Ne pas mettre le montant du don dans le texte',
  CHGtit: 'Chat du groupe {0}',
  CHGadd: 'Ajouter un item',
  CHGnot: 'Aucun avatar du groupe a accès aux membres (donc au chat).',

  // PageSession
  ISst: 'Statut de la session: {0}. Mode: {1}',
  ISconso: 'Consommation depuis le début de la session: {0}',
  ISst0: 'fermée, connexion possible',
  ISst1: 'connexion en cours',
  ISst2: 'ouverte',
  
  // App et PageAccueil
  PNCntf: 'Alertes',
  PNCabo: 'Abon. / Conso.',
  PNCcre: 'Crédits',
  PNCurg: 'Chats d\'urgence',

  // PageNotes
  PNOdep: 'Déplier',
  PNOrep: 'Replier',
  PNOnosel: 'Pas de note sélectionnée',
  PNOnf: 'Aucun fichier attaché. | Un fichier attaché de | {count} fichiers occupant ',
  PNOexclu: '{0} a l\'exclusivité d\'écriture. ',
  PNOexclu3: 'Exclusivité d\'écriture',
  PNOnoexclu: 'Pas d\'exclusivité d\'écriture.',
  PNOnv: 'Nouvelle',
  PNOnvtit1: 'Nouvelle note de {0}',
  PNOnvtit2: 'Nouvelle note du groupe {0}',
  PNOsupp: 'Supprimer',
  PNOratt: 'Rattacher',
  PNOratta: 'Rattacher à:',
  PNOratt2: 'Choisir un autre rattachement',
  PNOrattpos: 'Aucun rattachement possible. | Un ratachement possible. | {count} ratachements possibles.',
  PNOrattinfo: 'Cliquer ci-dessous sur l\'icône "étoile verte" du groupe, avatar ou note à laquelle vous voulez rattacher la note courante.',
  PNOcfratt: 'Confirmer ce rattachement',
  PNOanratt: 'Renoncer au rattachement',
  PNOauts: ' Pas d\'auteur. | Auteur: | Auteurs: ',
  PNOauts2: 'Votre compte est le seul éditeur',
  PNOattach: 'Fichiers attachés',
  PNOtype3: 'Le compte a été actif dans ce groupe, MAIS NE L\'EST PLUS. Le groupe "peut" avoir disparu.',
  PNOtype67: 'Cette note "n\'existe plus" mais des notes existantes lui ayant été rattachées, elle subsite juste pour permettre de voir ces dernières.',
  PNOro: 'CONSULTATION SEULEMENT',
  PNOro1: 'Aucune mise à jour possible : la session est en mode "avion".',
  PNOro2: 'Aucune mise à jour possible : l\'administyrateur technique a figé le serveur pour maintenance.',
  PNOro3: 'Aucune mise à jour possible : le compte a une restriction d\'accès minimale.',
  PNOro4: 'Aucune mise à jour possible : le compte est bloqué en lecture seulement.',
  PNOro5: 'La note est "archivée", aucune mise à jour / suppression n\'est autorisée.',
  PNOro6: 'Aucun des avatars du compte n\'a de droit d\'écriture sur les notes du groupe.',
  PNOro7: 'Un autre membre du groupe a le droit exclusif de mise à jour de la note, édition impossible pour les autres.',
  PNOred: 'RÉDUCTION DE VOLUME DES FICHIERS REQUISE',
  PNOpasheb: 'Le groupe n\'a pas de compte hébergeur.',
  PNOvgr2: 'Le volume occupé par les fichiers des notes du groupe dépasse le maximum déclaré par l\'hébergeur du groupe.',
  PNOvgr1: 'Le volume occupé par les fichiers des notes du groupe dépasse 90% de maximum déclaré par l\'hébergeur du groupe.',
  PNOvcpt1: 'Le volume maximum des fichiers des notes du compte (et de celles des groupes qu\'il héberge) dépasse 90% du quota attribué au compte.',
  PNOvcpt2: 'Le volume maximum des fichiers des notes du compte (et de celles des groupes qu\'il héberge) dépasse le quota attribué au compte.',
  PNOnoedit: 'Aucun avatar du compte n\'a l\'autorisation de modifier cette note.',
  PNOdetail: 'Fichier "{0}"',
  PNOapropos: 'A propos de la note ...',
  PNOlstfic: 'Aucun fichier actuellement | Un Fichier actuellement | {count} fichiers actuellement',
  PNOdlc: 'Téléchargement des notes affichées',
  PNOdlc1: 'Prochaine note à télécharger',
  PNOdlc2: 'Note en cours de téléchagement',
  PNOdlst1: 'GO ! notes et leurs fichiers',
  PNOdlst2: 'GO ! notes SANS leurs fichiers',
  PNOdls: 'Arrêter le téléchargement',
  PNOdlp: 'Mettre le téléchargement en pause',
  PNOdlpath: 'Path:',
  PNOdlr: 'Reprendre le téléchargement',
  PNOdlnbr: '{0} notes restantes sur {1}',
  PNOdlok1: 'Chargement local terminé avec succès:',
  PNOdlok2: '{0} note(s), {1} fichier(s), {2} byte(s)',
  PNOdlok3: 'Par sécurité, arrêter le serveur de téléchargement local.',
  PNOdltok: 'Le serveur local de téléchargement "{0}" a bien répondu au test de disponibilité [{1}]',
  PNOdltko: 'Le serveur local de téléchargement "{0}" N\'A PAS REPONDU au test de disponibilité. Erreur: [{1}]<br>Ce serveur a-t-il été lancé ?',
  PNOdlvide: 'Aucune note sélectionnée, pas de téléchargement',
  PNOdlv12: 'Volume fichiers:',
  PNOdlhp: 'Port d\'écoute de l\'application de stockage local',
  PNOdldir: 'Répertoire local dans cette application',
  PNOecrko1: 'N\'est pas autorisé à l\'écriture de notes dans le groupe',
  PNOecrko2: 'N\'a pas l\'exclusivité sur cette note et n{est pas animateur',
  PNOecrko3: 'N\'a pas accès à la liste des membres du groupe',
  PNOer1: 'Il n\'est pas possible d\'ajouter une nouvelle note tant que le nombre total des notes, chats, participations aux groupes, excède le quota attribué au compte.',
  PNOer2: 'Le nombre de notes du groupe excède le maximum autosisé par son compte hébergeur : l\'ajout de notes est bloquée.',
  PNOer3: 'Le groupe n\'a plus de compte hébergeur: l\'ajout de notes est bloqué.',
  PNOer10: 'La nouvelle taille de la note ferait dépasser le quota attribué au compte.',
  PNOer11: 'La nouvelle taille de la note ferait dépasser le volume maximal attribué par le compte hébergeur du groupe aux textes des notes du groupe.',
  PNOrav: 'Rattachée à la note de {0}',
  PNOrav2: 'Attachée directement à l\'avatar {0}',
  PNOrgr: 'Rattachée à la note du groupe "{0}"',
  PNOrgr2: 'Aattachée directement au groupe "{0}"',
  PNOaut1: 'Note écrite par {0}',
  PNOaut1a: 'Fichier ajouté par {0}',
  PNOaut1m: 'Fichier modifié par {0}',
  PNOaut2: 'Aucun avatar ne peut écrire cette note',
  PNOaut3: 'Le compte n\'est pas actif sur ce groupe',
  PNOngr: 'Note du groupe "{0}"',
  PNOnper: 'Note personnelle de {0}',
  PNOdeft: 'Nouvelle note ...',
  PNOext1: 'Aucune exclusivité d\'écriture attribuée actuellement.',
  PNOext2: 'Exclusivité d\'écriture attribuée actuellement:',
  PNOracgr: 'attachée à la racine du groupe "{0}"',
  PNOht0: 'Hashtags attachés à la note',
  PNOht1: 'Hashtags privés du compte',
  PNOht2: 'Hashtags publics au groupe des animateurs',
  PNOht3: 'Les anaimateurs n\'ont pas déclaré de hashtags publics.',
  PNOperdre1: 'Perdre mon exclusivité sans la transmettre',
  PNOperdre2: 'Retirer cette exclusivité sans la transmettre',
  PNOamb: 'Gérer / transmettre l\'exclusivité d\'écriture sur la note, SANS avoir accès aux membres du groupe, restreint les possibilités.',
  PNOex: 'Choisir pour "auteur exclusif"',
  PNOlex: 'Membres du groupe pouvant recevoir l\'exclusivité d\'écriture',
  PNOpeut: 'Pour attribuer l\'exclusité d\'écriture d\'une note, il faut, a) soit être animateur, b) soit l\'avoir soi-même, c) soit que personne ne l\'ait déjà.',

  // MenuFichier
  DFavion: 'ACCESSIBILTÉ en mode AVION...',
  DFavn: 'de la révision la plus récente pour ce nom de fichier :',
  DFav: 'de cette révision spécifiquement :',
  DFchgdl: 'Contenu disponible localement.',
  DFchgdem: 'Téléchargement pour disponibilté locale demandé {0}.',
  DFchgatt: 'En attente ...',
  DFchgec: 'En cours.',
  DFretry: 'Tentative #{0}',
  DFnoret: 'Abandon, plus de nouvelles tenatives automatiques jusqu\'à appui sur le bouton "RE-ESSAYER".',
  DFretaut: 'Une nouvelle tentative sera automatiquement effectuée très bientôt (environ 1 minute).',
  DFerr: 'La dernière tentative s\'est terminée en erreur : {0}',
  DFerr2: 'Détail de l\'erreur: {0}.',
  DFdispm: 'Pour information: le contenu est déjà en mémoire.',

  // NoteConfirme
  NCFm0: 'Droits insuffisants pour exécuter cette opération', 
  NCFm1: 'C\'est une note de groupe: au moins un des avatars du compte doit avoir le droit d\'écriture sur les notes du groupe.',
  NCFm2: 'Cette note de groupe a une exclusivité d\'écriture pour {0} qui n\'est pas un des avatars du compte. Pour cette opération, il faudrait que un de vos avatars ait pouvoir d\'animateur.',

  // NotePlus
  NPLnote: 'Note {0}',

  FAVnone: 'Aucun fichier visible en mode avion',

  // PanelAlerte
  PALdlvat: 'L\'Administrateur Technique a fixé une date au delà de laquelle toute connexion sera bloquée. Normalement la raison de cette limite est exprimée plus avant dans cette page ("Alerte de l\'Administrateur Technique").',
  PALdlvc: 'Le compte va s\'auto-détruire bientôt, l\'alerte "ACCÈS RESTREINT" n\'ayant pas été résolue.',
  PALdlv: 'Pour information, sauf connexion ultérieure le compte s\'auto-détruira à la date ci-dessous.',
  PALar: 'Le compte est en "ACCÈS RESTREINT": les données ne sont plus NI VISUALISABLES, NI MODIFIABLES. Toutefois il reste possible d\'accéder NORMALEMENT aux autres onglets de cette page "Abonnements, Crédits, Chats d\'Urgence".',
  PALars: 'Solde négatif (défaut de crédit). Voir l\'onglet "Abonnement".',
  PALarc: 'Alerte spécifiquement sur le compte levée par le Comptable ou un délégué. Voir plus avant dans cette page ("Alerte spécifique du compte").',
  PALarp: 'Alerte à tous les comptes de la partition levée par le Comptable ou un délégué. Voir plus avant dans cette page ("Alerte aux comptes de la partition").',
  PALls: 'Le compte est en "LECTURE SEULEMENT": les données sont VISUALISABLES MAIS PAS MODIFIABLES. Toutefois il reste possible d\'accéder NORMALEMENT aux autres onglets de cette page "Abonnements, Crédits, Chats d\'Urgence".',
  PALnred: 'Le quota du nombre de documents (notes, chats, groupes) est dépassé. Il \'est plus possible d\'en ajouter jusqu\'à rescente en-dessus du quota.',
  PALvred: 'Le quota du volume des fichiers attachés aux notes est dépassé. Il \'est plus possible d\'augmenter ce volume jusqu\'à rescente en-dessus du quota.',
  PALralA: 'La moyenne mensuelle de la consommation de calcul sur le mois en cours et le précédent excède le quota que VOUS avez fixé.',
  PALralO: 'La moyenne mensuelle de la consommation de calcul sur le mois en cours et le précédent excède le quota fixé par le Comptable ou un de ses délégués.',
  PALr: 'Les opérations sont ralenties jusqu\'à passage en dessous du quota.',
  PALratt: 'Ralentissement: {0} seconde(s) par opération et par méga-octet de fichier transféré.',
  PALesp: 'Alerte de l\'Administrateur Technique pour tous les comptes.',
  PALpart: 'Alerte du Comptable ou d\'un de ses délégués pour tous les comptes de la partition.',
  PALcpt: 'Alerte du Comptable ou d\'un de ses délégués spécifiquement pour ce compte.',

  // NouveauFichier MenuFichier
  PNFcop: 'Copier dans le "presse-papier',
  PNFaff: 'Afficher dans un nouvel onglet',
  PNFenreg: 'Enregistrer une copie locale',
  PNFsuppr: 'Supprimer définitivement',
  PNFvoirn: 'Voir la note ...',
  PNFdetail: 'Accessibilité en avion ...',
  PNFnv: 'Nouveau fichier attaché',
  PNFnvr: 'Nouvelle révision du fichier #{0}',
  PNFnvf: 'Fichier',
  PNFnvr: 'Révision',
  PNFnv1: 'Sélection du fichier',
  PNFnv2: 'Choisir un fichier dans le presse-papier',
  PNFnv2b: 'OU choisir un fichier local',
  PNFnv3: 'Fichier local (50Mo max)',
  PNFnv4: 'Attribution d\'un nom au fichier',
  PNFnv5: 'ainsi que les "non imprimables CR BS FF ..." ne sont pas autorisés afin que ce nom puisse servir comme nom de fichier.',
  PNFnv6: 'Caractères interdits',
  PNFnv6b: 'Valeur requise',
  PNFnv7: 'Nom du fichier',
  PNFnv8: 'Code court (facultatif) de cette révision',
  PNFnv9: 'Au plus 20 signes',
  PNFnv13: 'Cliquer les révisions à SUPPRIMER : elles ne le seront effectivement QU\'EN cas de succès de l\'enregistrement de la nouvelle.',
  PNFnv13b: 'Aucun fichier n\'est attaché à cette note.',
  PNFnv14r: 'Volume réduit de {0}. {1} ajouté, {2} supprimé',
  PNFnv14a: 'Volume augmenté de {0}. {1} ajouté, {2} supprimé',
  PNFrevsuppr: 'Autres fichiers et révisions à supprimer éventuellement',
  PNFnv15: 'Suivi de l\'opération',
  PNFnv15a: 'Opération impossible : le compte dépasserait son quota de volume de fichiers de {0} bytes.',
  PNFnv15a: 'Opération impossible : le groupe dépasserait le volume maximum de fichiers déclaré par l\'hébergeur de {0} bytes.',
  PNFnvs0: 'Compression éventuelle et cryptage', 
  PNFnvs1: 'Transfert vers le serveur de fichiers',
  PNFnvs2: 'Validation',
  PNFgetEr: 'Contenu du fichier non disponible (corrompu ? effacé ?)',
  PNFsf: 'Confirmer ou infirmer la suppression du fichier',
  PNFcpp: 'Fichier copié dans le presse-papier',
  PNFrevx: 'ne voir que les révisions pour ce nom',

  //EditeurMd
  EMDqss: 'Les modifications n\'ont pas été validées. En quittant cette fenêtre elles seront perdues.',
  EMDjr: 'Je reste sur cette fenêtre',
  EMDjq: 'Je quitte la fenêtre et perd mes modifications',
  EMDph: 'texte ici ...',
  
  // ContactChat
  CChtit: 'Créer un chat',
  CChnopc: 'Aucun avatar n\'a enregistré cette phrase de contact',
  CChself: 'Il n\'est pas possible de créer un chat avec soi-même (entre deux avatars du même compte)',
  CHcrpc: 'Créer un chat depuis la phrase de contact de l\'avatar',

  // PanelCompta
  PCPtabalertes: 'Alertes et restrictions',
  PCPtabcredits: 'Gestion des crédits',
  PCPtabcompta: 'Abonnement et consommation',
  PCPsynth: 'Synthèse à {0}',
  PCPnoex: 'Le compte n\'existait pas à cette date.',
  PCPdet: 'Détail par mois',
  PCPref0: 'Crée {0} - Compte "O" depuis la création.',
  PCPref1: 'Crée {0} - Compte "A" depuis la création.',
  PCPref2: 'Crée {0} - Passage en compte "O" {1}.',
  PCPref3: 'Crée {0} - Passage en compte "A" {1}.',
  PCPqmn: 'Quota moyen de nombre de documents',
  PCPnbdoc: '{0} documents: {1} note(s) + {2} chat(s) + {3} groupe(s)',
  PCPnbdoc2: '{1} note(s) + {2} chat(s) + {3} groupe(s)',
  PCPqmv: 'Quota moyen de volume de fichiers / utilisé',
  PCPqmc: 'Quota moyen de calcul / consommé',
  PCPcabo: 'Coût d\'abonnement / Facturé(1)',
  PCPccon: 'Coût de la consommation / facturé(2)',
  PCPnlne: 'Nombre de lectures / écritures',
  PCPvdvm: 'Volume de transfert descendant / montant',
  PCPcrdb: 'Somme des crédits(3) / dons(4)',
  PCPsoldes: 'Soldes au début(5) / à la fin(5+3-4-2-1)',
  PCPnbjours: 'moins d\'un jour | un jour | {count} jours',
  PCPcent: 'Les montants sont en centimes',
  PCPabo1: 'Coût mensuel d\'abonnement',
  PCPaboqn: 'Quota du nombre de documents',
  PCPaboqv: 'Quota de volume de fichiers',
  PCPvolf: 'Volume des fichiers attachés',
  PCPqcal: 'Quota de calcul',
  PCPmoyc: 'Moyenne mensuelle sur M et M-1',
  PCPsoldac: 'Solde actuel',
  PCPnbjn: 'Au rythme des 2 derniers mois, le solde sera négatif ',
  PCPsneg: 'Date à laquelle le solde est devenu négatif: {0}.',
  PCPtarifs: 'Tarifs',
  PCPlec: 'Nombre de lectures',
  PCPecr: 'Nombre d\'écritures',
  PCPvd: 'Vol. desc. fichiers',
  PCPvm: 'Vol. montant. fichiers',

  // PanelPartition PageEspace
  PTnv: 'Nouvelle partition',
  PIqa: 'Quotas alloués aux compte "A"',
  PIqo: 'Quotas alloués aux compte "O" - Somme des quotas des partitions',

  PTtit1: 'Délégués',
  PTtit2: 'Délégués et comptes non délégués',
  PTqu: 'Ajustement des quotas du compte',
  PTqutp: 'Quotas de la partition {0}',
  PTquta: 'Quotas réservés pour les comptes "A"',
  PTinfo: 'Mise à jour du code de la partition',
  PTinfoh: 'De 0 à 16 signes',
  PTinfoph: 'potes de tom',
  PTnvc: 'Nouveau Sponsoring',
  PTcompta: 'Abonnement / consommation de {0}',
  PTdlvat: 'Mise à jour de la date limite de connexion restreinte par l\'administrateur',
  PTdlvatx: 'Dates limites de connexion des comptes',
  PTdlvata: 'ACTUELLLE : {0}',
  PTdlvatf: 'FUTURE : {0}',
  PTopt: 'Comptes "autonomes" autorisés',

  //////////////////////////////////////////
  // ChatsAvec
  CAVtit: 'Chats avec :',
  CAVtit2: 'Carte de visite inconnue, chat impossible',
  CAVmb: 'Membre des groupes :',

  // PageInvitation
  PIfi: 'Seulement ceux proposables',

  // Page groupe(s)
  PGinvitation: 'Ajouter un contact',
  PGvide: 'Aucun groupe (sur {0}) ne répond au critère de filtre',
  PGvut: 'Réellement utilisé',
  PGvq: 'Somme des maximum attribués',
  PGnh: 'Plus hébergé',
  PGstatsh: 'Pour les groupes hébergés',
  PGinv: 'Pas d\'invitation en cours | Une invitation encours | {count} invitations encours',
  PGnoamb: 'Le compte n\'a pas accès aux membres de ce groupe',
  PGrafcvs: 'Rafraîchir les cartes de visite',
  PGnope: 'Le groupe n\'a pas d\'autre membre que les avatars du compte',
  PGnomb: 'Aucun membre (sur {0}) ne répond au critère de sélection',
  PGcrea: 'Création d\'un nouveau groupe',
  PGctc: 'Déclaré "contact" du groupe {0}',
  PGctc1: 'Me retirer de la liste des contacts',
  PGctc2: 'Interdire définitivement à ce groupe de me contacter',
  PGnom: 'Nom du groupe à créer: {0}',
  PGquotas: 'Nombre maximum de notes et volume maximum pour leurs fichiers',
  PGvg: 'Voir le groupe',
  PGmesav: 'Ma participation au groupe | Ma participation au groupe | Mes participations au groupe',
  PGchat: 'Ouvrir le chat',

  // Aperçu Membre
  AMdpc: 'Date du premier contact:',
  AMddi: 'Date de la dernière invitation:',
  AMinv0: 'jamais invité',
  AMactif: 'En activité:',
  AMmembres: 'A accès aux membres:',
  AMlecture: 'A accès en lecture aux notes:',
  AMecriture: 'A accès en écriture aux notes:',
  AManimateur: 'Animateur',
  AMdroits: 'Détail des droits',

  etre: 'non | oui | l\'a été, ne l\'est plus',
  avoir: 'non | oui | l\'a eu, ne l\'a plus',

  AMinvit3: 'Invitation en attente de réponse avec droits:',
  AMinvit2: 'Invitation en cours de vote avec droits:',
  AMinvittg: 'Invitation impossible, le groupe a déjà atteint sa taille maximale de {0} membres actifs / invités.',
  AMinvitbtn1: 'Invitation',
  AMinvitbtn2: 'Accepter / décliner l\'invitation',
  AMinvitbtn3: 'Droits d\'accès',
  AMinvitbtn4: 'Radiation',
  AMinvan: 'd\'animation',
  AMinvam: 'd\'accès aux membres',
  AMinvln: 'de lecture des notes',
  AMinven: 'de lecture / écriture aux notes',
  AMdroitstit:'Ajuster les droits de {0} au groupe {1}',
  AMradtit: 'Radier {0} du groupe {1}',
  AMinvtit: 'Invitation de {0} au groupe {1}',
  AMcas1: 'Création de l\'invitation',
  AMcas1b: 'Simple contact',
  AMcas2: 'Invitation en cours de vote',
  AMcas3: 'Invitation lancée',
  AMcas4: 'Membre actif',
  AMcas5: 'Animateur',
  AMopt1: 'Laisser cette invitation telle quelle',
  AMopt2: 'Modifier cette invitation',
  AMopt3: 'Supprimer cette invitation',
  AMopt4: 'Voter cette invitation telle quelle',
  AMoptSupp1: 'Remettre l\'invité comme simple "contact"',
  AMoptSupp2: 'Radier l\'invité, n\'apparaîtra plus dans le groupe',
  AMoptSupp3: 'Radier l\'invité et le mettre en liste noire pour qu\'il n\'apparaisse plus jamais dans le groupe',
  AMoptRad1a: 'Fin d\'activité du membre : il redevient simple "contact"',
  AMoptRad2a: 'Radier le membre, il disparaîtra du groupe',
  AMoptRad3a: 'Radier le membre et le mettre en liste noire pour qu\'il n\'apparaisse plus jamais dans le groupe',
  AMoptRad1b: 'Je mets fin à mon activité : je redeviens simple "contact"',
  AMoptRad2b: 'Je m\'auto-radie, je disparaitrai du groupe',
  AMoptRad3b: 'Je m\'auto-radie et me mts en liste noire afin de ne plus jamais y apparaître',
  AMconf0: 'Confirmer l\'invitation',
  AMconf2: 'Confirmer la modification',
  AMconf3: 'Confirmer la suppression',
  AMconf4: 'Confirmer le vote',
  AMconf5: 'Confirmer le changement des droits',
  AMconf6: 'Confirmer la radiation',

  AMnbanim: 'Nombre d\'animateurs après l\'opération: {0}',
  AMnbanim1: 'Le groupe n\'a pas d\'animateur.',
  AMnbanim2: 'ATTENTION: Le groupe n\'AURA PLUS d\'animateur.',
  AMradheb: 'ATTENTION: Le groupe n\'AURA PLUS D\'HEBERGEUR.',
  AMnbactifs: 'ATTENTION: Le groupe n\'AURA PLUS DE MEMBRE ACTIF: il sera SUPPRIME.',
  AMinvan: 'animateur',
  AMinvdm: 'accès aux membres',
  AMinvdn: 'lecture des notes',
  AMinvde: 'écriture des notes',
  AMbienv: 'Message de bienvenue pour l\'invité:',
  AMinvvp: 'Invité par:',
  AMinvvc: 'N\'ont pas encore voté:',
  AMinvpar: 'Actuellement invité par {0}',
  AMinvpar2: 'Sera invité par {0}',
  AMchinv: 'Quel avatar est "invitant" ?',
  AMchg: 'Les droits ont changé : les validations des autres animateurs seront effacées.',
  AMlng: 'en liste noire (par un animateur)',
  AMlnc: 'en liste noire (par lui-même)',  

  AMm0: 'Radié',
  AMm1: 'Contact',
  AMm2: 'Pré-invité',
  AMm3: 'Invité',
  AMm4: 'Actif',
  AMm5: 'Animateur',
  AMmh: 'Hébergeur',
  AMmf: 'Fondateur',
  AMmm: 'A accès aux membres',

  AMn1: 'Peut voir les notes',
  AMn2: 'Peut éditer les notes',

  // PageGroupes InvitationAcceptation
  ICtita: 'Invitations en attente',
  ICtitc: 'Citations en tant que contact',
  ICtit2: 'Invitation de {0} au groupe {1}',
  ICti1: 'Groupe et invité',
  ICti2: 'Animateur du groupe invitant | Animateurs du groupe invitants',
  ICti3: 'Détail de l\'invitation',
  ICflags: 'Droits attribués: {0}',
  ICcflm: 'J\'accède aux membres et au chat du groupe (quand le droit m\'en ait donné)',
  ICcfln: 'J\'accède aux notes du groupe (quand le droit m\'en ait donné)',
  ICcflmb: 'Accède aux membres et au chat du groupe (quand le droit en ait donné)',
  ICcflnb: 'Accède aux notes du groupe (quand le droit en ait donné)',
  ICbienv: 'Message d\'invitation',
  ICrem1: 'Remerciement ...',
  ICrem2: 'Raison du refus ...',
  ICacc: 'J\'accepte l\'invitation', 
  ICdec: 'Je décline l\'invitation ...', 
  ICd2: 'Me conserver comme contact, je pourrai plus tard être à nouveau invité',
  ICd3: 'Me radier de ce groupe, je n\'y apparaîtrai plus',
  ICd4: 'Me radier de ce groupe ET me mettre en "liste noire"',

  // Page Invitation
  PItit: 'Contact du groupe {0}',
  PItx1: 'Voulez-vous inscrire cet avatar comme contact du groupe ?',

  // Aperçu groupe
  AGstm: 'Statuts des membres:',
  AGheb: 'Hébergeur du groupe: ',
  AGhebvol: 'Quotas et volumes',
  AGnheb: 'N\'est PLUS hébergé. Date de disparition du groupe : {0}',
  AGfond: 'Fondateur: {0}',

  // PageGroupe
  AGnfond: 'Le fondateur du groupe a disparu',
  AGsimple: 'Invitations sur demande d\'UN SEUL animateur',
  AGunanime: 'Invitations sur UNANIMITÉ des animateurs',
  AGuna: 'Gérer le mode simple / unanime de {0}',
  AGgerh: 'Gérer l\'hébergement du groupe {0}',

  AGsts1: 'contacts',
  AGsts2: 'pré-invités',
  AGsts3: 'invités',
  AGsts4: 'actifs',
  AGsts5: 'animateurs',

  AGcas1: 'Il n\'y a pas d\'hébergeur pour ce groupe: disparition prévue le {0}.',
  AGcas2: 'Je suis hébergeur de ce groupe',
  AGcas3: 'Il y a un hébergeur mais ce n\'est pas un avatar de mon compte.',
  AGhko1: 'Je ne peux pas être hébergeur, aucun de mes avatars n\'a accès aux notes du groupe.',
  AGhko2: 'Je suis hébergeur, mais je ne peux pas transférer l\'hébergement à un autre de mes avatars, aucun n\'ayant accès aux notes du groupe',
  AGhko3: 'L\'hébergeur actuel étant animateur, je ne peux pas me substituer à lui aucun de mes avatars ayant accès aux notes du groupe n\'est animateur.',

  AGselac: 'Que voulez-vous faire ?',
  AGselav: 'Au nom de mon avatar ...',
  AGselav2: 'Au nom de mon avatar "{0}"',
  AGac1: 'Je prends l\'hébergement à mon compte',
  AGac2: 'Je cesse d\'héberger ce groupe',
  AGac3: 'Je reprends l\'hébergement de ce groupe par un autre de mes avatars',
  AGac4: 'Je met à jour les nombres de notes et volumes de fichiers maximum attribués au groupe',
  AGac5: 'Je reprends l\'hébergement de ce groupe par un de mes avatars',

  AGaln: 'Nombre de notes excédant le maximum autorisé par l\'hébergeur: création de notes impossible, leur nombre ne peut être QUE réduit.',
  AGalv: 'Volume de fichiers des notes excédant le maximum autorisé par l\'hébergeur: l\'ajout de fichiers à des notes est impossible, le remplacement ne peut s\'effectuer qu\'à volume inférieur.',
  AGdisp1: 'SI le nombre de notes du groupe atteint le maximum autorisé, il restera au compte {0} notes / chats / groupes disponibles.',
  AGdisp2: 'SI le volume des fichiers attachés aux notes du groupe atteint le maximum autorisé, il restera au compte {0} disponibles pour les fichiers attachés.',

  AGmu: 'Mode actuel : UNANIME',
  AGms: 'Mode actuel : SIMPLE',
  AGmx: 'Impossible d\'allouer des quotas supérieurs aux volumes libres sur le compte.',


  AGu1: 'Mode "simple" : un seul des animateurs peut "inviter" un contact à être membre du groupe.',
  AGu2: 'Mode "unanime" : if faut que TOUS les animateurs "invitent" un contact à être membre du groupe pour que l\'invitation soit effective.',
  AGu3: 'Pour revenir au mode "simple", il faut que TOUS les animateurs l\'aient demandé.',
  AGu4: 'Pour passer au mode "unanime", il suffit qu\'UN animateur le demande',
  AGu5: 'Etat des demandes des animateurs',

  AGupasan: 'Seul un animateur peut agir sur ce mode.',
  AGumu: 'Passer en mode UNANIME',
  AGums: 'Je vote pour passer au mode "SIMPLE"',
  AGrumu: 'Annuler les votes et rester en mode UNANIME',

      
///////////////////////////////////
  // ApercuAvatar AcceptationSponsoring
  FAnocv: 'Pas de carte de visite',
  FAphc: 'Déclaration de la phrase de contact',
  FApc: 'Phrase de contact',
  FAnpc: 'Pas de phrase de contact ',
  FAerr1: 'Cette phrase est déjà celle de l\'avatar : rien n\'est changé',
  FAerr2: 'Cette phrase a déjà choisie par un autre avatar. En attribuer une autre',
  FAerr3: 'Cette phrase est trop proche de celle déjà choisie par un autre avatar. En attribuer une autre',

  // Page (Compte) et NouvelAvatar
  CPTchps: 'Changer la phrase secrète',
  CPTedq: 'Quotas du compte',
  CPTdel: 'Délégué de la partition [{0}]',
  CPTnvav: 'Nouvel avatar',
  CPTnvav2: 'Création d\'un nouvel avatar',
  CPTchps2: 'Nouvelle phrase secrète de connexion',
  CPTndc: 'Ce nom est déjà celui d\'un de vos avatars. En choisir un autre.',
  CPTtitchO: 'Chats avec le Comptable et ses délégués',
  CPTtitchA: 'Chat avec le Comptable',


  // ChoixQuotas
  CQconso: 'Consommation mensuelle plafond:',
  CQconsocalc: 'par mois',
  CQnbdocs: 'Pas de document | Un document | {count} documents',
  CQvolfics: 'de fichiers',

// ChoixEmoji
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
  NAw1: 'Le nom est le début de la première ligne du texte de la carte de visite.',
  NAw2: 'et caractères non imprimables (CR TAB ...) interdits.',
  NAng: 'Nom du groupe',
  NAna: 'Nom de l\'avatar',
  NAph0: 'Saisir un nom', 
  NAe1: 'Entre {0} et {1} caractères',
  NAe2: 'Caractères interdits',
  
  // CarteVisite
  CVtit: 'Édition de la carte de visite',
  CVsil: 'Clic silencieux',
  CVgph: 'Garder la photo initiale',
  CVcph: 'Changer la photo',
  CVdwc: 'Démarrer la webcam',
  CVawc: 'Arrêter la webcam',
  CVpph: 'Prendre une photo',
  CVtop: 'La photo est trop top!',
  CVmav: 'C\'était mieux avant!',
  CVoff: 'Caméra non démarrée',
  CVedit: 'Editer la carte de visite',
  CVraf: 'Rafraîchir les cartes de visite',
  CVraf2: '{0} carte(s) de visite mises à jour, {1} étaient à jour.',

  // AcceptationSponsoring
  APAconf: 'Confirmer la création du compte',
  APAdec2: 'Décliner définitivement ce sponsoring',
  APAcf2: 'Ne pas ouvrir de "chat" avec {0}', 

  ///////////////////////////////////
  // Aperçu Alerte
  ANrntfA: 'La consommation excède le plafond attribué.',
  ANrntfB: 'La consommation dépasse 90% du plafond attribué.',
  ANrntfC: 'Le crédit est épuisé.',
  ANrntfD: 'Le crédit sera épuisé dans quelques jours.',
  ANrntfE: 'Le volume occupé dépasse celui autorisé.',
  ANrntfD: 'Le volume occupé dépasse 90% de celui autorisé.',

  ANcible1: 'générale',
  ANcible2: 'collective sur la tranche de quotas',
  ANcible3: 'sur le compte',
  ANcible1b: 'générale',
  ANcible2b: 'affectant les comptes dont les quotas sont pris sur la tranche #{0} ',
  ANcible3b: 'affectant le compte {0}',
  ANcourt0: 'Pas d\'alerte {0}',
  ANcourt1: 'Alerte {0}',
  ANcourt2: 'Alerte grave {0}',
  ANcourt3: 'Alerte {0}, écritures bloquées',
  ANcourt4: 'Alerte {0}, lectures bloquées',
  ANcourt5: 'Alerte {0}, résiliation en cours',

  ANlong0: 'Tout est OK, aucune Alerte.',
  ANlong1: 'A minima une alerte informative / contraintes fortes possibles.',
  ANlong2: 'ACCES RESTREINT, mises à jour et consultations interdites (SAUF pour les actions d\'URGENCE)',
  ANlong3: 'Suppression IMMINENTE du compte ou impossibilité IMMINENTE de s\'y connecter',

  ANlon0: 'Pas d\'alerte en cours',
  ANlon1: 'Alerte en cours, sans blocage planifié',
  ANlon2: 'Alerte en cours, blocage planifié',
  ANlon3: 'Blocage des écritures',
  ANlon4: 'Blocage des lectures et écritures',
  ANlon5: 'Résiliation',
  ANle: 'le {0} (dans {1} jour(s))',

  ANcre: 'En créer une',
  ANauc0: 'Pas d\'Alerte générale',
  ANauc1: 'Pas d\'Alerte à tous les comptes de la partition',
  ANauc2: 'Pas d\'Alerte spécifique du compte',
  ANnot0: 'Alerte générale pour tous les comptes',
  ANnot1: 'Alerte à tous les comptes de la partition',
  ANnot2: 'Alerte spécifique du compte',
  ANadmin: 'de l\'adimistrateur technique',
  ANnotc: 'L\'Alerte a été émise par la Comptable: il est seul autorisé à la modifier / supprimer.',
  ANcomptable: 'du Comptable',
  ANdel1: 'de {0}, délégué sur la partition',
  ANrestr: 'Restriction d\'accès',
  ANnr02: 'Application "figée" par l\'administrateur technique: aucune mise à jour possible',
  ANnr03: 'Application "bloquée" par l\'administrateur technique',
  ANnr12: 'Mises à jour bloquées pour tous les comptes de la partition',
  ANnr13: 'Ni mises à jour, ni visualisations (actions d\'urgence seulement) pour tous les comptes de la partition',
  ANnr22: 'Mises à jour bloquées pour ce compte',
  ANnr23: 'Ni mises à jour, ni visualisations (actions d\'urgence seulement) pour ce compte',
  ANnr3: 'Application en lecture seulement',
  ANnr4: 'Accès minimal très restreint à l\'application',
  ANnospon: 'L\'Alerte provient du Comptable, lui seul peut l\'éditer (pas un sponsor).',
  ANer1: 'Seul l\'administrateur technique peut créer et éditer une Alerte générale pour l\'organisation.',
  ANer2: 'Seuls le Comptable ou un sponsor de cette tranche peuvent créer et éditer une Alerte portant sur tous les comptes rattachés à cette tranche.',
  ANer3: 'Seuls le Comptable ou un sponsor de cette tranche peuvent créer et éditer une Alerte portant sur un compte rattaché à cette tranche.',
  ANer4: 'Les Alertes de dépassement des limites de l\'abonnement et de surveillance de la consommation, sont automatiques et ne sont pas éditables.',
  ANer5: 'Un sponsor d\'une tranche ne peut pas créer ou éditer une Alerte concernant un autre sponsor.',
  ANer10: 'Un sponsor ne peut pas déclarer une Alerte portant sur tous les comptes de sa tranche ce qui le restreindrait lui-même.',
  ANer11: 'Le Comptable ou un sponsor ne peut pas déclarer une Alerte qui restreindrait son propre compte.',

  ANplus: 'Plus d\'info',
  ANtxt: 'Texte de l\'alerte',
  ANpasp: 'Simple alerte, pas de procédure de blocage engagée',
  ANpec: 'Procédure de blocage engagée',
  ANpf: 'Une procédure de blocage sera engagée le {0} (dans {1} jour(s))',

  ANdg1: 'Un compte ne peut pas ouvrir une procédure de blocage collective qui le viserait.',
  ANdg2: 'Un compte ne peut pas ouvrir une procédure de blocage sur son propre compte.',

  AN365: '0..365',
  ANed0: 'La procédure de blocage actuelle débute le {0}',
  ANed4: 'Engager une procédure de blocage',
  ANed3: 'Engager une nouvelle procédure de blocage',
  ANed2: 'Annuler la procédure de blocage',
  ANed1: 'Ajuster la procédure actuelle',

  ANdp: 'Débutant dans N jours (le {0}). N : ',
  ANd4: '"Lectures interdites" N jours après le début. N : ',
  
  ANemet: 'Alerte émise par {0}',

  // PanelPeople et apercu compte
  PPchats: 'Chats avec ...',
  PPgroupes: 'Participations aux groupes',
  PPndel: 'Compte non délégué',
  PPdel: 'Compte délégué',
  PPpaschat: 'chat pas encore initialisé',
  PPchpart: 'Changer de partition',
  PPchdel: 'Changer le statut de "délégué"',
  PPcompta: 'Abon. et conso.',
  PPmuterO: 'Mutation en compte "O"',
  PPmuterA: 'Mutation en compte "A"',
  PPnopart: 'Ce compte est AUTONOME, il \'est pas associé à une partition (et ne peut donc pas en être délégué).',
  PPmutpc: 'Cette phrase de contact n\'est pas celle de l\'AVATAR PRINCIPAL DU COMPTE.',
  PPmutpc2: 'Donner la phrase de contact de l\'AVATAR PRINCIPAL DU COMPTE pour s\'assurer que c\'est bien sa volonté.',
  PPchatreq: 'Un "chat" avec le compte doit avoir été établi avant de le passer en compte "O".',
  PPmutO: 'Passer ce compte en "COMPTE DE L\'ORGANISATION"',
  PPmutA: 'Passer ce compte en "COMPTE AUTONOME"',
  // PPmutA2: 'Avant de confirmer, consulter l\'aide ci-après: une fois votre compte rendu "autonome" vous ne bénéficierez plus de quotas d\'abonnement et de consommation gratuit (payés par l\'organisation).',
  PPmutmc: 'Ligne de chat à ajouter pour information',
  PPmut1: 'Le compte de cet avatar est déjà un compte "O" (d\'organisation).',
  PPmutO: 'Le compte {0} est de type "COMPTE DE L\'ORGANISATION"',
  PPmutO2: 'Passer ce compte en "COMPTE DE L\'ORGANISATION"',
  PPmsgo: 'Votre compte est désormais de type "COMPTE DE L\'ORGANISATION" attaché à la tranche de quotas #{0}',
  PPmsga: 'Votre compte est désormais de type "AUTONOME"',
  PPmutv: 'Vérifier soigneusement les quotas à attribuer',
  PPmutm: 'Message informatif à écrire sur le "chat"',
  PPkodel: 'Retirer au compte le statut de "délégué"',
  PPokdel: 'Conférer au compte le statut de "délégué"',
  PPchgpart: 'Départ de {0} de sa partition {1}',
  PPqvn: 'Quota de notes+chats+groupes : {0} - ({1}) - Occupé à {2}%',
  PPqvv: 'Quota de volume de fichiers: {0} - ({1}) - Occupé à {2}%',
  PPqvc: 'Quota de calcul: {0}c - Utilisé à {1}%',
  PPc0: 'Couples (quota disponible / quota total de la partition)',
  PPc1: 'Code',
  PPc2: 'Calc. ({0})',
  PPc3: 'Nb n..({0})',
  PPc4: 'Vol.f ({0})',
  PPc5: 'Dispo.',
  PPnt: 'Dont le code contient',
  PPact: 'Actions sur le compte',
  PPtit: 'Membre {0} du groupe {1}',
  PPctc: 'Ajouter {1} comme contact du groupe {0}',
  PPquot: 'Corriger les valeurs non admissibles dans les quotas c-dessus',

  PPctc4: 'Le compte n\'a pas d\'avatar ayant accès aux membres du groupe. Impossible de choisir un nouveau contact pour ce groupe.',
  PPctc5: 'Cet avatar est déjà connu du groupe.',
  PPctc6: 'Cet avatar a été mis en liste noire du groupe par un animateur. Il n\'est plus possible de l\'inviter.',
  PPctc7: 'Cet avatar s\'est inscrit lui-même en liste noire du groupe. Il n\'est plus possible de l\'inviter.',
  PPctcok: 'Choisir',

  SAVtit1: 'Suppression de l\'avatar {0}',
  SAVtit2: 'Résiliation du COMPTE {0}',
  SAVer1: 'La suppression du compte ne peut intervenir qu\'après la suppression de ses avatars secondaires',
  SAVst1: 'disparaîtra',
  SAVst2: 'ne sera plus hébergé',
  SAVst3: 'n\'aura plus d\'animateurs',
  SAVret1: 'D\'autres sessions se sont exécutées en parallèle et ont modifié les données. Vérifier ce nouvel état et confirmer à nouveau la suppression de cet avatar (ou renoncer).',
  SAVret2: 'D\'autres sessions se sont exécutées en parallèle et ont modifié les données. Vérifier ce nouvel état et confirmer à nouveau la résiliation du compte (ou renoncer).',
  SAVval1: 'Valider cette suppression',
  SAVval2: 'Valider la résiliation du compte',
  SAcptdisp: 'LE COMPTE A DÉJA ÉTÉ RÉSILIÉ. Retour à la page de connexion.',
  SAVcf1: 'Toutes les données seront définitivement effacées du serveur sans AUCUNE possibilité de récupération technique. Supprimer vraiment cet avatar ?',
  SAVcf2: 'Toutes les données seront définitivement effacées du serveur sans AUCUNE possibilité de récupération technique. RÈSILIER vraiment ce compte ?',
  SAVnotes: 'Aucune note ne va disparaître | Une note va disparaître: | {count} notes vont disparaître: ',
  SAVvlib: 'Volume de fichiers libéré : {0}',
  SAVvlib3m: 'Volume de fichiers libéré dans 3 mois: {0}',
  SAVvlib1: 'Aucune note dans le groupe. | Une note sera détruite. | {count} notes détruites.',
  SAVvlib2: 'Aucune note dans le groupe. | Une note sera inaccessible. | {count} note(s) seront inaccessible(s).',
  SAVchats: 'Aucun "chat" ne va disparaître | Un "chat" va disparaître : | {count} "chats" vont disparaître : ',
  SAVgr1: ' ? | Un groupe va disparaître (pas d\'autre membre) : | {count} groupes vont disparaître (pas d\'autre membre actif) :',
  SAVgr2: ' ? | Un groupe hébergé par cet avatar va disparaître dans 3 mois : | {count} groupes hébergés par cet avatar vont disparaître dans 3 mois :',
  SAVgr3: ' ? | Cet avatar est le dernier animateur d\'un groupe | Cet avatar est le dernier animateur de {count} groupes :',
  SAVgr0: ' ? | Cet avatar est membre d\'un groupe : | Cet avatar est membre de {count} groupes :',
  SAVdspt:  'Ce compte est le dernier délégué de sa partition.',
  SAVspons: 'Aucun "sponsoring" en attente ne sera annulé | Un "sponsoring" en attente sera annulé | {count} "sponsorings" en attente seront annulés',
  SAVvol: 'Volumes rendus disponibles pour le compte par la suppression de l\'avatar :',
  SAVvola: '{0} notes supprimées de l\'avatar. {1} de fichiers',
  SAVvolg: '{0} notes des groupes détruits. {1} de fichiers',
  SAVabo: 'Baisse des ressources occupées dans l\'abonnement:',
  SAVabo1: '{4} document(s): {0} note(s) + {1} chat(s) + {2} participation(s) à des groupes',
  SAVabo2: 'Volume des fichiers: {0}',

  TUtqc: '',
  TUtqn: 'Abon. nombre notes...',
  TUtqv: 'Abon. volume fichiers',
  TUaff: 'Affecté',
  TUuti: 'Utilisé',
  TUntfp: 'Notif. partition',
  TUntfc: 'Notif. comptes',
  TUsim: 'OK',
  TUlec: 'Lec.',
  TUmin: 'Min.',
  TUpart: 'Partition {0}',
  TUnopart: 'Partition non disponible.',
  TUtrb: 'Nb partitions',
  TUco: 'Nb comptes',
  PEnbc: 'aucun compte | un compte | {count} comptes',
  PEnbd: 'pas de délégué | un délégué | {count} délégués',
  PEedn: 'Editer le nom',
  PEabo: 'Abon. & max conso.',
  PEstm: 'Téléchargement de la statistique CSV d\'abonnement / consommation du mois',
  PEsttk: 'Téléchargement du fichier CSV des tickets d\'un mois ...',
  PEnd1: 'Statistique non trouvée',
  PEnd2: 'La statistique ne peut pas être décryptée: a) soit elle est destinée à un autre compte, b) soit elle est ancienne et la clé fixée par l\'administateur du site a été changée.',
  PEsd: 'Statistique téléchargée sous le nom [{0}]',

  // PanelCredits
  PCRgen: 'Générer un ticket de crédit',
  PCRref: 'Référence à joindre au paiemnet: "{0} {1}"',
  PCRc1: 'Numéro du ticket',
  PCRc2: 'Montant en euros',
  PCRc3: 'Commentaire',
  PCRc4: 'Enregistré le',
  PCRc5: 'Crédité par le compte',
  PCRc5n: 'Pas encore crédité',
  PCRd1: 'Un ticket a 13 chiffres',
  PCRd2: 'Numéro non généré par l\'application',
  PCRd3: 'Entre 0,50€ et 100€',

  // Ticket
  TKrefp: 'Référence à joindre au paiemnet: "{0} {1}"',
  TKdel: 'Ticket définitivement perdu ? Détruire ce ticket empêche de bénéficier d\'un crédit le référençant lors d\'un enregistrempent par le Comptable.',
  TKdel2: 'Oui, je détruis ce ticket',
  TKenreg1: 'Valider tel quel',
  TKenreg2: 'Ajuster l\'enregistrement',
  TKnv: 'Générer un nouveau ticket de crédit',
  TKrec: 'Enregistrer le paiement',
  TKgen: 'Générer',
  TKmnt: 'Montant:',
  TKrefx: 'Référence:',
  TKer3: 'Entre 0,50€ et 100€',
  TKrefh: 'Facultatif, de 0 à 20c',
  TKdeb: 'Ticket commençant par ...',
  TKdebh: '1 à 6 majuscules',

  TK1: 'En attente',
  TK2: 'Reçu',
  TKdons: 'Dons reçus / donnés',
  TKdb: 'Donné: {0}c',
  TKcr: 'Reçu: {0}c',
  TKdg: 'Génération le: {0}',
  TKdr: 'Réception le: {0}',
  TKdi: 'Incorporation le: {0}',
  TKmd: 'Montant déclaré:',
  TKmr: 'reçu par le Comptable:',
  TKrefa: 'Référence du compte:',
  TKrefc: 'Référence du Comptable:',
  TKatt: 'Tickets en attente',
  TK1A: 'Tickets en attente de réception',
  TK1T: 'Tous les tickets en ligne (en attente ou enregistrés)',
  TK2A: 'Mes tickets en attente de réception',
  TK2T: 'Tous mes tickets en ligne (en attente ou enregistrés)',
  TKinc: 'Crédits reçus par le Comptable',
  TKverif: 'Dernière récupération {0}.',
  TKnbt: 'Pas de nouveau ticket incorporé | Un nouveau ticket incorporé | {count} nouveaux tickets incorporés',
  TKbtnv: 'Vérifier s\'il y en a de nouveaux',

  HTtit: 'Sélectionner des hashtags',
  HTfil: 'Filtre',
  HThint: '1 à 12 [a-z 0-9]',
  HTe1: 'Entre {0} et {1} caractères',
  HTe2: 'Minusules a-z et chiffres 0-9',
  MMCnomc: 'Pas de hashtags déclarés',
  MCaucun: 'Pas de hashtags déclarés',
  MMCnomemo: 'Pas de mémo déclaré',
  MMCap: 'Mémo et hastags personnels attachés à {0}',
  MMCnomaj: 'Mise à jour impossible : {0}',
  MMCcom: 'Mon mémo',

  SINGL10: 'Récupération des fins d\'hébergement',
  SINGL11: 'Récupération des membres disparus et des groupes devenant orphelins',
  SINGL12: 'Purge des avatars et groupes',
  SINGL13: 'Purge des fichiers (et des transferts) des transferts abandonnés',
  SINGL14: 'Purges des fichiers détruits accumulés dans fpurges',
  SINGL15: 'Purges des versions ayant une dlv de plus d\'un an',
  SINGL20: 'Statistiques "mensuelles" comptas',
  SINGL21: 'Statistiques "mensuelles" tickets (avec purges)',
  
  SBf: `### Aucune mise à jour n\'est possible, mais la consultation n'est pas limitée (comme en mode avion):
- Le compte est considéré comme **inactif** depuis la dernière connexion avant que la cette restriction ne soit enplace.
- Au bout de 365 jours d'inactivité, le compte sera automatiquement désactivé.
`,
  SBfm: `### Aucune mise à jour n\'est possible et la consultation est restreinte à cette page:
- Les _alertes et restrictions_ et _le détail de l'abonnement et de la consommation_ sont visibles.
- Les _chats_ avec le comptable et le cas échéant les sponsors, sont visibles mais il n'est pas possible d'y répondre.
- Le compte est considéré comme **inactif** depuis la dernière connexion avant que la cette restriction ne soit enplace.
- Au bout de 365 jours d'inactivité, le compte sera automatiquement désactivé.
`,

  SBm: `### La consultation est restreinte à cette page:
- Les _alertes et restrictions_ et _le détail de l'abonnement et de la consommation_ sont visibles.
- Les _chats_ avec le comptable et le cas échéant les sponsors, sont visibles et actifs, il est possible d'y répondre ou d'en ouvrir.
- Les autres pages n'étant pas accessibles, aucune autre donnée n'est, ni visible, ni modifiable.
`,

  SBl: `### Aucune mise à jour n\'est possible, mais la consultation n'est pas limitée (comme en mode avion):
`,

  SBd: `### Les mises à jour augmentant _le volume des données_ sont bloquées:
- Ajouter une note, ouvrir un nouveau chat, participer à un nouveau groupe n'est pas autorisé.
- Tout fichier attaché à une note peut être supprimé ou remplacé par un autre de taille inférieure.
- Il n'est pas possible d'attacher un nouveau fichier à une note.
`,

  BULLEnr02: 'Application figée par l\'administrateur technique: aucune mise à jour possible',
  BULLEnr03: 'Application **bloquée** par l\'administrateur technique',
  BULLEnr3: 'Application en lecture seulement',
  BULLEnr4: 'Accès minimal très restreint à l\'application',
  BULLEnr12: `Tous les comptes de la partition sont restreints en lecture seulement:
- la visualisation est libre,
- les mises à jour sont bloquées,
- toutefois les opérations d'urgence ("chats", crédits) sont autorisées.
`,
  BULLEnr13: `Tous les comptes de la partition sont TRES restreints:
- la visualisation est bloquée,
- les mises à jour sont bloquées,
- toutefois les opérations d'urgence ("chats", crédits) sont autorisées.
`,
  BULLEnr22: `Compte restreint en lecture seulement:
- la visualisation est libre,
- les mises à jour sont bloquées,
- toutefois les opérations d'urgence ("chats", crédits) sont autorisées.
`,
  BULLEnr23: `Compte très restreint:
- la visualisation est bloquée,
- les mises à jour sont bloquées,
- toutefois les opérations d'urgence ("chats", crédits) sont autorisées.
`,
  BULLEclos: 'Application figée par l\'administrateur technique: aucune mise à jour possible',
  
  BULLEinv2: `Décliner l\'invitation et rester en tant que "contact" du groupe:
- je pourrai être ré-invité plus tard à des conditions éventuellemnt différentes, 
- je reste connu dans le groupe, en particulier vis à vis des notes que j'aurais pu écrire dans le passé`,

  BULLEinv3: `Décliner l\'invitation MAIS M'OUBLIER:
- je ne serai plus inscrit comme "contact" du groupe.
- je serai inconnu dans le groupe, en particulier vis à vis des notes que j'aurais pu écrire dans le passé et dans lesquelles je n'apparaîtrai plus comme auteur.
- toutefois, quelqu'un pourrait me réinscrie un jour dans le groupe: cette nouvelle existence dans le groupe ne pourra pas être corrélée avec mon passage antérieur dans le groupe, je n'y aurai pas le même numéro d'auteur.`,

  BULLEinv4: `Décliner l\'invitation MAIS M'OUBLIER DÉFINITIVEMENT:
- je ne serai plus inscrit comme "contact" du groupe.
- je serai inconnu dans le groupe, en particulier vis à vis des notes que j'aurais pu écrire dans le passé et dans lesquelles je n'apparaîtrai plus comme auteur.
- je serai inscrit en liste noire, personne ne pourra plus m'ajouter comme contact de ce groupe.`,

  BULLEoubla1: `OUBLIER un contact:
- il ne sera plus inscrit comme "contact" du groupe:
- il sera inconnu dans le groupe, en particulier vis à vis des notes qu'il aurait pu écrire dans le passé et dans lesquelles il n'apparaîtra plus comme auteur,
- toutefois, quelqu'un pourrait le réinscrie un jour dans le groupe: cette nouvelle existence dans le groupe ne pourra pas être corrélée avec son passage antérieur dans le groupe, il n'y aura pas le même numéro d'auteur.`,

  BULLEoubla2: `OUBLIER DÉFINITIVEMENT un contact:
- il ne sera plus inscrit comme "contact" du groupe:
- il sera inconnu dans le groupe, en particulier vis à vis des notes qu'il aurait pu écrire dans le passé et dans lesquelles il n'apparaîtra plus comme auteur,
- il sera inscrit en liste noire, personne ne pourra plus l'ajouter comme contact de ce groupe.`,

  BULLEoublc1: `Ne plus être "actif" mais rester connu dans le groupe en tant que "contact":
- le groupe n'apparaîtra plus dans la liste de mes groupes.
- je reste inscrit comme "contact" du groupe et pourrai être ré-invité plus tard à des conditions éventuellemnt différentes, 
- je reste connu dans le groupe, en particulier vis à vis des notes que j'aurais pu écrire dans le passé`,

  BULLEoublc2: `Ne plus être "actif" ET M'OUBLIER:
- le groupe n'apparaîtra plus dans la liste de mes groupes.
- je ne serai plus connu dans le groupe, en particulier vis à vis des notes que j'aurais pu écrire dans le passé et dans lesquelles je n'apparaîtrai plus comme auteur.
- toutefois, quelqu'un pourrait me réinscrie un jour dans le groupe: cette nouvelle existence dans le groupe ne pourra pas être corrélée avec mon passage antérieur dans le groupe, je n'y aurai pas le même numéro d'auteur.`,

  BULLEoublc3: `Décliner l\'invitation MAIS M'OUBLIER DÉFINITIVEMENT:
- le groupe n'apparaîtra plus dans la liste de mes groupes.
- je ne serai plus connu dans le groupe, en particulier vis à vis des notes que j'aurais pu écrire dans le passé et dans lesquelles je n'apparaîtrai plus comme auteur.
- je serai inscrit en liste noire, personne ne pourra plus m'ajouter comme contact de ce groupe.`,

  BULLEexclu: `Pour attribuer l\'exclusivité d\'écriture d\'une note, un compte doit:
- soit avoir lui-même l\'excluvité d\'écriture sur la note,
- soit avoir un pouvoir d\'animateur dans le groupe,
- soit, quand aucune exclusivité n\'est attribuée, avoir été le seul compte à écrire dans cette note.`,

  BULLEmcgr: `Pour attribuer des mots-clés "du groupe" à une note de groupe, un compte doit:
- soit avoir lui-même l\'excluvité d\'écriture sur la note,
- soit avoir un pouvoir d\'animateur dans le groupe,
- soit, quand aucune exclusivité n\'est attribuée, avoir un droit d\'écriture des notes du groupe.`,

  BULLErl1: `Mais ça ne marche pas avec tous les navigateurs.
- si l'installation n'a pas eu lieu, utiliser l'option 2 ou l'option 3.
`,

  BULLErl2: `En général c'est efficace, mais sur smartphone il n'y a ni touche CONTROL, ni touche de fonction F5
`,

  BULLErl0: `Si l'application s'exécute dans plus d'une fenêtre du navigateur (ce qui est licite bien que peu usuel) le changement de version ne peut pas avoir lieu, même pour une nouvelle fenêtre. 
 
Fermer TOUTES les fenêtres / onglets où s'exécute l'application.
`,

  BULLEhashtags: `A droite les hashtags déjà utilisés, à gauche ceux de la sélection. 
  - Ajouter un hashtag non trouvé à droite: le saisir et <ENTREE>
  - Ajouter un hashtag présent à droite: cliquer dessus
  - Enlever un hashtag sélectionné à gauche: cliquer dessus
  `,

  BULLEquotas: ` Le nombre de "documents" correspond au nombre total,
- de chats, les "indésirables" n'étant pas comptés,
- de notes personnelles et de celles des groupes dont le compte est hébergeur,
- de participations "actives" à des groupes.

Le "volume des fichiers" est celui total de ceux attachés aux notes personnelles et à celles des groupes dont le compte est hébergeur.

La "consommation mensuelle" de calcul est en centimes et est la somme des coûts des lectures, écritures et de transfert de volume montant et descendant.
`,

  A_DOCpg: 'L\'application "a-social"',

  A_pages: 'Disposition générale d\'une page',
  A_page_accueil: 'Page d\'accueil',
  A_top_bar: 'Barre du haut',
  A_bottom_bar: 'Barre du bas',
  A_menu_navigation: 'Menu de navigation',
  A_page_admin: 'Page de l\'Administrateur Technique',
  A_page_chats: 'Page des _chats_',
  A_page_clos: 'Clôture immédiate de la connexion',
  A_compta_notif: 'Alertes sur le compte',
  A_compta_compta: 'Abonnement et consommation',
  A_compta_credits: 'Gestion des crédits',
  A_compta_chats: '"Chats" en cas d\'urgence',
  A_page_compte: 'Page du compte',
  A_page_espace: 'Page de gestion de l\'espace',
  A_page_ficav: 'Page des fichiers accessibles en mode avion',
  A_page_groupe: 'Page de détail d\'un groupe',
  A_page_groupes: 'Page des participations aux groupes',
  A_page_invitation: 'Page des contacts _invitables_ à un groupe',
  A_page_notes: 'Page des notes',
  A_page_partition: 'Page des comptes d\'une partition',
  A_page_people: 'Page des contacts du compte',
  A_page_session: 'Page de résumé de l\état de la session',
  A_page_sponsorings: 'Page des sponsorings d\'un avatar',
  A_boite_automaj: 'Etat de maj automatique des données',
  A_panel_outils: 'Boîte à outils',

  A_page_login: 'Se connecter / créer son compte',
  A_page_login_m: 'Modes synchronisé / incognito / avion',
  A_page_login_fa: 'Fichiers accessibles en mode avion',
  A_page_login_pp: 'Le "presse-papier" de notes et fichiers',
  A_nouvelle_version: '"Nouvelle version disponible"',

  A_sponsoring: 'Sponsoriser des comptes',
  A_sponsoring_d: 'Déclarer un sponsoring',
  A_sponsoring_a: 'Accepter ou refuser un sponsoring',

}

## TODO le 10 oct.

**Lorsque le compte A va sur sa page de gestion de ses crédits,** 
- les tickets dont il possède une version plus ancienne que celle détenue dans tickets du Comptable sont mis à jour.
- les tickets émis un mois M toujours non réceptionnés avant la fin de M+1 sont supprimés.
- les tickets de plus de 2 ans sont supprimés. 
gérer les restrictions - fait en partie pour figé

Résiliation avatar dnn dnc dng dv2 

GC d'espace figé

Révision complète groupe et actions possibles

_Arrêtés mensuels_ (**CSV**)
- tickets réceptionnés dans le mois. gérer pour le Comptable le "dernier mois archivé".
  - une ligne par ticket dont l'ids débute par le mois.
  - une fois archivé dans un secret du Comptable, opération du serveur pour détruire tous les tickets du mois et antérieurs.
- une ligne par comptas d'extrait des compteurs relatifs au mois M-1 (dès qu'il est figé).


## Components

### Les boutons
Ils n'importent aucune autre vue et sont des "span" destinés à figurer au milieu de textes.
- **BoutonHelp**: ouvre une page d'aide.
- **BoutonLangue**: affiche la langue courante et permet de la changer.
- **NotifIcon**: affiche le statut de notification de restriction et ouvre PageCompta. 

Les mots clés sont attachés:
- à des contacts ou des groupes connus du compte par McMemo,
- à des notes par NoteMc.

Ils sont affichés par ApercuMotscles qui permet d'éditer le choix par ChoixMotscles.

### ApercuMotscles (3)
Liste les mots clés sur une ligne. 
- ouverture du choix des mots clés sur bouton d'édition.

Import: ChoixMotscles

### McMemo (4)
Attache des mots clés et un mémo à n'importe quel avatar-people, ou groupe dont l'id est connu.

Plusieurs components ApercuMotscles peuevent être apparents simultannément à l'écran. Toutefois on ne peut éditer qu'un seul ChoixMotscles à la fois : le dialogiue interne MMedition ne doit en conséquence n'est ouvert qu'une seule fois à un instant donné. C'est la propriété `ui.mcmemoId` qui prévient l'ouverture de plusieurs MMedition.

Import: EditeurMd, ApercuMotscles

**Dialogue interne:**
- MMedition : gère un ApercuMotscles et un EditeurMd pour afficher / éditer les mots clés et le commentaire à attacher au contact ou groupe.

### ChoixMotscles (1)
Permet de sélectionner une liste de mots clés à attacher à un contact / groupe ou une note.

### ApercuGenx (5)
Présente un aperçu d'un avatar du compte, d'un contact ou d'un groupe.
- ouvre le panel détail d'un contact si ce n'est ni un avatar du compte, ni un groupe. Toutefois si un détail de contact est déjà ouvert, le bouton ne s'affiche pas afin d'éviter des ouvertures multiples.
- ouvre le dialogue ApercuCv sur le bouton zoom.

Import: McMemo

### ApercuAvatar (6)
Affiche les données d'un avatar du compte.
- importé **uniquement* depuis PageCompte.
- édition de la pharse de contact.
- importé **uniquement** depuis PageCompte.

Ce component peut être visible plusieurs fois simultannément (autant qu'un compte a d'avatars).

Import: PhraseContact, ApercuGenx

Dialogue:
- AAeditionpc: édition de la phrase de contact. Afin de n'avoir qu'une seule instance ouverte à un instant donné, le dialogue n'opère **que** sur l'avatar courant.

### NomAvatar (1)
Saisie d'un nom d'avatar avec contrôle de syntaxe.

### ApercuNotif ()

## Dialogues

### ApercuCv (4)
Affiche une carte de visite d'un avatar, contact ou groupe:
- pour un contact, le bouton refresh recharge la carte de visite depuis le serveur.
- pour un avatar ou un groupe, le bouton d'édition permet de l'éditer. Pour un groupe, il faut que compte en soit animateur.

Import: ShowHtml, CarteVisite

### CarteVisite (3)
Dialogue d'édition d'une carte de visite, sa photo et son information.
- est importé **uniquement** depuis ApercuCv (la photo et l'information y étant présente).
- sauvegarde les cartes de visite (avatar et groupe).

Import: EditeurMd

### MotsCles (2)
Edite les mots clés, soit d'un compte, soit d'un groupe.

N'est importé **que** par PageCompte et ApercuGroupe (une seule édition à un instant donné).

Import: ChoixEmoji

## Panels

### DialogueHelp (3)
Affiche les pages d'aide.
- la table des matières, le titre de chaque page, les pages à trouver en bas de chaque page d'aide, sont configurés dans `src/app/help.mjs`
- chaque page d'aide est un fichier par langue dans `src/assets/help`
- les images dans ces pages sont dans `public/help`
- ce dialogue est ouvert / géré par `ui-store pushhelp pophelp fermerhelp`.
- l'ouverture est déclencher par BoutenHelp.

### ApercuChatgr (3)
Affiche le chat d'un groupe.
- ajout d'items et supression d'items.

Import: EditeurMd, NoteEcritepar

### ApercuChat (3)
Affiche le chat d'un avatar du compte avec un contact.
- ajout d'items et supression d'items.
- raccrocher le chat/

Import: EditeurMd, NoteEcritepar

### SupprAvatar (2)
Panel de suppression d'un avatar.
- affiche les conséquences en termes de pertes de secrets, de groupes et de chats avec les volumes associés récupérés.
- importé **uniquement* par PageCompte.

### OutilsTests (2)
Trois onglets:
- **Tests d'accés**: tests d'accès au serveur, ping des bases locales et distantes.
- OTrunning:
  - présente la liste des bases synchronisées.
  - sur demande calcul de leur volume (théorique pour le volume V1).
  - propose la suppression de la base.
- **Phrase secrète**: test d'une phrase avec affichage des différents cryptages / encodages associés.

Invoqué par un bouton de la page d'accueil / App.vue

Import: PhraseSecrete

Dialogues:
- OTrunning: affiche la progression du calcul de la taille de la base.
- ORsupprbase: dialogue de confirmation de la suppression.

## Pages

### PageCompte
Affiche les avatars du compte et les opérations du compte:
- création d'un nouvel avatar,
- édition des mots clés du compte,
- changement de la phrase secrète.

Import: NomAvatar, ApercuAvatar, PhraseSecrete, MotsCles, SupprAvatar

Dialogues:
- PCnvav: nouvel avatar
- PCchgps: changement de la phrase secrète

### PageChats
Affiche la liste des chats des contacts et des groupes.
- si le filtre filtre.filtre.chats.tous est false, les stores avatar et groupe ne délivrent que ceux de l'avatar courant positionné sur la page d'accueil.
- exporte les chats sélectionnés dans un fichier MarkDown.

Import: ApercuChat, ContactChat, ApercuChatgr, ApercuGenx

### PageCompta (7)
Quatre onglets donnant l'état de la comptabilité et des blocages.
- **Notifications**: liste des notifications en cours (avec leurs blocages éventuels).
- **Comptabilité**: abonnement et consommation (PanelCompta).
- **Crédits**: pour les comptes autonomes seulement (PanelCredits).
- **Chats**: chats d'urgence avec le Comptable et les sponsors.

Import: SdAl, ApercuGenx, ApercuNotif, PanelCompta, PanelCredits, ApercuChat

### PageSession (2)
Page qui s'affiche pendant l'initilisation de la session, après login et avant la page d'accueil.
- **Etat général** de la session.
- **RapportSynchro**: son contenu est dynamique lors du chargement de la session, puis fixe après (synthèse du chargement initial).
- **Téléchargements en cours**: zone passive d'affichage sans action. En fin d'intialisation d'une session, les chargements des fichiers accessibles en mode avion et qui ne sont pas disponibles dans la base locale, sont chargés en tâche de fond. Cet zone liste les téléchargements restant à effectuer.
- **Téléchargements en échec**: erreurs survenues dans ces téléchargements. Actions possibles sur chaque fichier en échec: _ré-essai abandon_.

Import: RapportSynchro

### PageEspace (4)
Affiche le découpage de l'espace en tranches:
- pour le Comptable, création de tribu et ajustement des paramètres de l'espace pour les transferts de compte O / A.

La page est également invoquée dans un dialogue interne de PageAdmin pour affichage des tranches (mais sans droit d'agir).

Import: ChoixQuotas, TuileCnv, TuileNotif, ApercuNotif

## PageAdmin (5)
C'est LA page de l'administrateur technique.
- 2 boutons techniques: lancer un GC, afficher le dernier rapport de GC.
- un boutons fonctionnel: créer une organisation.
- un bouton de rafraîchissement.

Liste les organisations existantes:
- affichage du détail de leurs tranches sur bouton.
- changement de profil.
- création / gestion de la notification sur l'espace.

Import: PhraseSecrete, ApercuNotif, PageEspace


En chantier PageTranche BarrePeople DialogueNotif

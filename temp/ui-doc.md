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
Les _components_, en général, peuvent avoir et souvent ont, plusieurs instances affichées à l'écran. Quand un component a un dialogue interne:
- une variable `idc` (id du component) est déclarée au `setup()` (numérotation croissante de `stores.ui.idc`). Chaque _instance_ du component reçoit donc une identification absolue unique: `const idc = ref(ui.getIdc())`.
- un dialogue interne `DXxx` est piloté par la variable modèle de `stores.ui.d.DXxx[idc]` où `idc` est le **numéro d'instance** du component. Cette variable dans stores.ui.d est déclarée comme un objet: ainsi chaque instance de dialogue interne a _une_ variable modèle de contrôle pour _chaque_ instance.
 
### Les boutons
Ils n'importent aucune autre vue et sont des "span" destinés à figurer au milieu de textes.
- **BoutonHelp**: ouvre une page d'aide.
- **BoutonLangue**: affiche la langue courante et permet de la changer.
- **NotifIcon**: affiche le statut de notification de restriction et ouvre PageCompta. 
- **BoutonMembre**: affiche le libelleé d'un membre, son statut majeur et optionnellment un bouton ouvrant un PanelMembre qui le détaille. N'est importé que dans ApercuGroupe.

Les mots clés sont attachés:
- à des contacts ou des groupes connus du compte par McMemo,
- à des notes par NoteMc.

Ils sont affichés par ApercuMotscles qui permet d'éditer le choix par ChoixMotscles.

### MenuAccueil (1)
Affiche le menu principal aussi inclus dans la page d'accueil.

### ApercuMotscles (3)
Liste les mots clés sur une ligne. 
- ouverture du choix des mots clés sur bouton d'édition.

Import: ChoixMotscles

Dialogue:
- AMmcedit: édition / zoom des mots clés

### McMemo (4)
Attache des mots clés et un mémo à n'importe quel avatar-people, ou groupe dont l'id est connu.

Import: EditeurMd, ApercuMotscles

Dialogue:
- MMedition: gère un ApercuMotscles et un EditeurMd pour afficher / éditer les mots clés et le commentaire à attacher au contact ou groupe.

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
- AAeditionpc: édition de la phrase de contact.

### NomAvatar (1)
Saisie d'un nom d'avatar avec contrôle de syntaxe.

### BarrePeople (3)
Affiche trois boutons ouvrant les dialogues / panels associés:
- changement de tranche d'un compte O,
- changement de statuts sponsor d'un compte,
- affiche des compteurs d'abonnements / consommation.

BarrePeople est importé par PanelPeople et PageTranche.

Import: PanelCompta

Dialogues:
- BPchgSp: changement de statut sponsor.
- BPcptdial: affichage des compteurs de compta du compte "courant".
- BPchgTr: changement de tranche.

### ApercuNotif (3)
Affiche une notification. Un bouton ouvre le dialogue DaliogueNotif d'édition d'une notification.

Import: ShowHtml

### PhraseContact (1)
Saisie contrôlée d'une phrase de contact.

### ShowHtml (2)
Ce composant affiche sur quelques lignes un texte en syntaxe MD. 
- un bouton permet de zoomer en plein écran le texte et de revenir à la forme résumé.
- un bouton d'édition est disponible sur option et se limite à émettre un évenement `edit`.

Import: SdDark, SdLight, SdDark1, SdLight1

Dialogue:
- SHfs: vue en plein écran.

### QuotasVols (1)
Affiche l'abonnement en nombre de noye + chat + groupes et de volume de fichier, ainsi que sur option le pourcentage d'utilisation de ces abonnments.
- affiche aussi le quota de consommation (en monétaire) fixé.

### PanelCompta (2)
Affiche les informations d'abonnement et de consommation d'un compte.
- importé par BarrePeople à propos d'un contact,
- importé pat PanelCompta pour les données du compte.

- **Synthèse**: "cumuls" d'abonnement et de consommation correspondant à la période de la création du compte [2023-11-17 17:09] à maintenant (9 jours).
- **Abonnement: nombre de notes + chats + groupes**
- **Abonnement: volume des fichiers attachés aux notes**
- **Contrôle de la consommation**
- **Récapitulatif des coûts sur les 18 derniers mois**
- **Tarifs**

Import: MoisM, PanelDeta

### MoisM (1)
Micro-component de commodité de PanelCompta affichant un bouton affichant 4 mois successifs.

### PanelDeta (1)
Micro-component de commodité de PanelCompta et PanelCredits affichant des compteurs.

### ApercuGroupe (8)
Données d'entête d'un groupe:
- carte de visite, commentaires du compte et mots clés associés par le compte,
- fondateur,
- mode d'invitation,
- hébergement,
- mots clés définis au niveau du groupe.

Import: MotsCles, ChoixQuotas, BoutonConfirm, BoutonHelp, ApercuMembre, ApercuGenx, BoutonMembre, QuotasVols

Dialogues:
- MCmcledit: édition des mots clés du groupe
- AGediterUna: gestion du mode simple / unanime
- AGgererheb: gestion de l'hébergement et des quotas
- AGnvctc: ouverture de la page des contacts pour ajouter un contact au groupe

### ApercuMembre (7)
Afiche une expansion pour un membre d'un groupe:
- repliée: son aperçu de contact et une ligne d'information sur son statut majeur dans le groupe (fondateur, hébergeur, statut).
- dépliée: ses flags et ses date-heures de changement d'état et des boutons pour changer cet état (invitation, configurer, oublier).

Import: InvitationAcceptation, BoutonConfirm, ApercuGenx, BoutonBulle2, BoutonBulle, EditeurMd

Dialogues:
- AMinvit: invitation d'un contact.
- AMconfig: configuration des flags du membre.
- AMoubli: oubli d'un contact jamais invité, ni actif.

### InvitationAcceptation (6)
Formulaire d'acceptation / refus d'une invitation:
- flags d'accès,
- message de remerciement.

Une fiche d'information à propos de l'invitation est obtenue du serveur et contient en particulier les données à propos du ou des invitants.
- on peut accepter une invitation SANS avoir accès aux membres du groupes;
- c'est la fiche invitation qui ramène le row membre correspondant spécifique, sans que la session n'ait eu besoin d'avoir accès aux membres du groupe.

Est invoqué comme dialogue par:
- ApercuMembre: pour les invitations des avatars du compte.
- PageGroupes: pour toutes les invitations en attente inscrites dans les avatars du compte.

Import: EditeurMd, ApercuGenx, BoutonConfirm, BoutonBulle

## Dialogues

### PhraseSecrete (1)
Saisie contrôlée d'une phrase secrète et d'une organisation (sur option), avec ou sans vérification par double frappe.

Ce composant héberge *simple-keyboard* qui affiche et gère un clavier virtuel pour la saisie de la phrase. Il utilise pour s'afficher un `<div>` de classe "simple-keyboard" ce qui pose problème en cas d'instantiation en plusieurs exemplaires.
- Ceci a conduit a avoir une seule instance du dialogue hénergée dans App et commandée par la variable sorres.ui.d.PSouvrir
- les propritées d'instantiation sont dans stores.ui.ps, dont ok qui est la fonction de callback à la validation de la saisie.
le dialogue est positionné au *top* afin de laisser la place au clavier virtuel de s'afficher au dessous quand il est sollicité.

PhraseSecrete est ouverte pat :
- PageLogin: saisie de la pharse de connexion.
- AcceptationSponsoring: donnée de la phrase par le filleul juste avant sa connexion.
- PageCompte: changement de phrase secrète.
- PageCompta: saisie de la phrase secrète du Comptable à la création d'un espace.
- OutilsTests: pour tester la saisie d'une phrase secrète et la récupération de ses cryptages.

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

### DialogueNotif (3)
Affichage / saisie d'une notification, texte et niveau.
- enregistrement / suppression selon que la notification est générale, tranche de quoas ou compte.

Import: EditeurMd

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

### ApercuChat (6)
Affiche le chat d'un avatar du compte avec un contact.
- ajout d'items et supression d'items.
- raccrocher le chat/

Import: SdDark1, EditeurMd, ApercuGenx

### SupprAvatar (2)
Panel de suppression d'un avatar.
- affiche les conséquences en termes de pertes de secrets, de groupes et de chats avec les volumes associés récupérés.
- importé **uniquement* par PageCompte.

### OutilsTests (1)
Trois onglets:
- **Tests d'accés**: tests d'accès au serveur, ping des bases locales et distantes.
- OTrunning:
  - présente la liste des bases synchronisées.
  - sur demande calcul de leur volume (théorique pour le volume V1).
  - propose la suppression de la base.
- **Phrase secrète**: test d'une phrase avec affichage des différents cryptages / encodages associés.

Invoqué par un bouton de la page d'accueil / App.vue

Dialogues:
- OTrunning: affiche la progression du calcul de la taille de la base.
- ORsupprbase: dialogue de confirmation de la suppression.

### NouveauSponsoring (3)
Panel de saisie d'un sponsoring par un compte lui-même sponsor.
- importé par PageSponsorings et PageTranche.

Import: PhraseContact, ChoixQuotas, NomAvatar, EditeurMd, QuotasVols

### AcceptationSponsoring (4)
Saisie de l'acceptation d'un sponsoring, in fine création du compte (si acceptation).
- saisie du nom,
- saisie du mot de remerciement.

Import: EditeurMd, ShowHtml, BoutonHelp, QuotasVols

## PanelPeople (7)
Affiche tout ce qu'on sait à propos d'un contact:
- sa carte de visite et son commentaire / mots clés du compte à son propos.
- la liste des chats auquel il participe, ouvert ou non.
- la liste des groupes (dont le compte a accès aux membres) dont il est membre et son statut.

Si le panel a été ouvert pour ajouter le contact comme membre du groupe courant, un cadre donne le statut de faisabilité de cet ajout et un bouton l'ajoute.

Import: ApercuGenx, ApercuMembre

### PanelMembre (8)
Affiche en panel,
- l'aperçu du contact / avatar membre,
- l'aperçu membre qui donne le détail de son rôle dans le groupe.

N'est ouvert que par un BoutonMembre (depuis ApercuGroupe seulement donc). Est hébergé dans App pour éviter des instantiations multiples.

Import: ApercuGenx, ApercuMembre

## Pages

### PageLogin (5)
Login pour un compte déjà enregistré ou auto-création d'un compte depuis une phrase de sponsoring déclarée par un sponsor.

Import: PhraseContact, AcceptationSponsoring

### PageAccueil (3)
Affiche:
- un bloc avec tous les accès aux pages s'ouvrant par des icônes de App.
- un second bloc qui est le menu d'accueil accessible depuis la App.

Import: MenuAccueil, BoutonLangue, NotifIcon2, QueueIcon 

### PageCompte (7)
Affiche les avatars du compte et les opérations du compte:
- création d'un nouvel avatar,
- édition des mots clés du compte,
- changement de la phrase secrète.

Import: NomAvatar, ApercuAvatar, MotsCles, SupprAvatar

Dialogues:
- PCnvav: nouvel avatar
- PCchgps: changement de la phrase secrète

### PageChats (7)
Affiche la liste des chats des contacts et des groupes.
- si le filtre filtre.filtre.chats.tous est false, les stores avatar et groupe ne délivrent que ceux de l'avatar courant positionné sur la page d'accueil.
- exporte les chats sélectionnés dans un fichier MarkDown.

Import: ApercuChat, ContactChat, ApercuChatgr, ApercuGenx

### PageClos (3)
Page ouverte sur clôture immédiate de la session:
- blocage intégral par l'administrateur technique,
- compte résilié par une autre session ou celle courante,
- ressort toujours par la déconnexion inconditionnelle.

Import: BoutonBulle, ShowHtml

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

Import: ApercuNotif, PageEspace

### PageTranche (6)
Affiche en tête la tranche courante,
- celle du compte
- pour le comptable celle courante sélectionnée depuis la PageEspace.
- pour le comptable ouvre le panel NouveauSponsoring pour sponsoriser un compte dans n'importe quelle tranche.

Affiche en dessous les sponsors et pour le Comptable les autres comptes de la tranche.

Import: TuileCnv,TuileNotif, ApercuNotif, ChoixQuotas, ApercuGenx, PanelCompta, QuotasVols, NouveauSponsoring, BarrePeople

Dialogues: 
- PTcptdial : affichage des compteurs comptables du compte sélectionné
- PTedq: mise à jour des quotas du compte sélectionné

### PageSponsorings (4)
Liste les sponsorings actuellement en cours ou récents:
- boutons de prolongation des sponsorings en cours et d'annulation.

Bouton général pour créer un nouveau sponsoring.

Import: NouveauSponsoring, ShowHtml, QuotasVols

### PageGroupes (8)
Liste les groupes accédés par le compte, dans lesquels il est actif.
- synthèse des volumes occupés par les groupes hébergés,
- bouton de création d'un nouveau groupe,
- une carte par groupe avec :
  - un bouton pour ouvrir le chat du groupe,
  - un bouton pour accéder à la page du groupe.

Import: ChoixQuotas, NomAvatar, ApercuGenx, InvitationsEncours, ApercuChatgr

Dialogue:
- PGcrgr: création d'un groupe.

### PageGroupe (10)
Affiche les détails d'un groupe:
- onglet **Détail du groupe**: entête et participations des avatars du compte au groupe.
  - bouton d'ajout d'un contact comme contact du groupe.
- onglet **Membres**: liste des contacts membres du groupe si le compte a accès aux membres.

Import: ApercuMembre, ApercuGroupe

### PagePeople (6)
Affiche tous les contacts connus avec une courte fiche pour chacun (pouvant ouvrir sur le détail du contact).
- un bouton rafraîchit les cartes de viste qui en ont besoin.

Import: ApercuGenx

## En chantier
- EditeurMd
- PageFicavion
- PageNotes NoteEdit NoteExclu NotePlus NoteMc NoteFichier NouveauFichier NoteConfirme
- ListeAuts
- PressePapier
- PanelCredits
- ContactChat
- ApercuTicket

## Bugs / vérifications



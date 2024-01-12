# Application UI
Une première partie décrit la structure visuelle de l'application en App et pages, panels / dailogues / components.

La seconde partie décrit les données qui sont affichées, le _modèle_ et les données le cas échéant persistentes localement.

La trosième partie décrit les opérations de connexion, synchronisation et les autres opérations d'échanges avec le serveur.

# Structure visuelle
**App** est LE layout unique décrivant LA page de l'application. Elle est constituée des éléments suivants:
- **headaer**
  - _boutons à gauche_: aide, notifications, menu, accueil.
  - _titre de la page courante_. Le cas échant une seconde barre affiche les onglets pour les pages ayant des onglets.
  - _boutons à droite_: fichiers visibles en avion, presse-papier, ouverture du drawer de recherche.
- **footer**:
  - _boutons à gauche_: aide, langue, mode clair / foncé, outils, statut de la session,
  - _information du compte_ connecté et son organisation,
  - _bouton de déconnexion_.
- **drawer de filtre à droite** affichant les filtres de recherche pour les pages en ayant. 
  - il s'affiche par appui sur le bouton de recherche (tout en haut à droite).
  - quand la page est assez large, le drawer de filtre reste affiché à côté de la page principale, sinon sur la page principale qui en est partiellement recouverte.
- **container de la page principale**: 
  - il contient à un instant donné une des pages listées dans la section "Pages". 
  - celles-ci sont formées par un tag `<q-page>` qui s'intègre dans le tag `<q-page-container>` de App.

**App inclut quelques dialogues singletons** afin d'éviter leurs inclusions trop multiples:
- ces dialogues n'ont pas de propriétés, c'est le contexte courant qui fixe ce qu'ils doivent afficher.
- chaque dialogue dans App est gardée par un `v-if` de la variable modèle qui l'ouvre.
- `DialogueErreur DialogueHelp PressePapier PanelPeople PanelMembre OutilsTests ApercuCv PhraseSecrete`

**App a quelques dialogues internes simples:**
- _ui.d.aunmessage_ : Gestion d'un message s'affichant en bas
- _ui.d.diag_ : Affiche d'un message demandant confirmation 'j'ai lu'
- _ui.d.confirmFerm_ : demande de confirmation d'une fermeture de dialogue avec perte de saisie
- _ui.d.dialoguedrc_ : choix de déconnexion. Déconnexion, reconnexion, continuer

La logique embarquée se limite à:
- détecter le changement de largeur de la page pour faire gérer correctement l'ouverture du drawer de filtre dans stores.ui,
- gérer le titre des pages,
- se débrancher vers les pages demandée.

### Pages, panels, dialogues, components
Chaque page au sens ci-dessus peut importer des _panels, dialogues, components_.

#### Panels
Ce sont dialogues qui s'affichent sur la gauche en pleine hauteur avec une largeur qui peut être `'sm md lg'`.
- ils se ferment par appui sur le chevron gauche en haut à gauche.

#### Dialogues
Ce sont des dialogues qui s'affichent sur une partie de la page avec une largeur `'sm md lg'` et pas en pleine hauteur.
- ils se ferment par appui sur la croix en haut à gauche.

#### Components
Ils sont simplment incrustés dans le flow d'affichage de la page / panel / dailogue qui les importent.

#### Maîtrise des cycles d'importation
Un tel cycle est une faute de conception que Webpack détecte (il ne sait pas comment faire) mais n'indique malheureusement pas clairement.

Pour chaque composant un numéro de couche est géré:
- les composants n'important rien ont pour numéro de couche 1.
- tous composants a pour numéro de couche le plus des numéros de couche des composants importés + 1.
- la feuille Excem Dépendances.xls en tien attachement ce qui ermet de s'assurer qu'un cycle n'a pas fortuitement été introduit dans la conception.

## Styles clairs et foncés
Le style global peut être clair ou foncé selon la variable de Quasar `$q.dark.isActive`

Quand il y a des listes à afficher, il est souhaiatble d'afficher une ligne sur deux avec un fond légérement différent, donc avec un style dépendant de l'index `idx` de l'item dans la liste qui le contient. D'où les classes suivantes:
- `sombre sombre0`: fond très sombre, fonte blanche pour les idx pairs (ou absents).
- `sombre1`: fond un peu moins sombre, fonte blanche pour les idx impairs.
- `clair clair0`: fond très clair, fonte noire pour les idx pairs (ou absents).
- `clair1`: fond un peu moins clair, fonte noire pour les idx impairs.

Dans util.js les fonctions suivantes fixent dynamiquement le fond à appliquer selon que le mode sombre est activé ou non et l'index idx éventuel:
- `dkli (idx)` : fond _dark_ ou _light_ selon idx
- `sty ()` : fond _dark_ ou _light_
- `styp (size)` : pour un dialogue, fond _dark_ ou _light_, largeur fixée par size (`'sm' 'md' 'lg'`) et ombre claire ou foncée.

### L'affichage MarkDown par VueShowdown
Le component VueShowdown affiche le contenu d'un texte MD dans un `<div>`. 

Sa classe de style principal `markdown-body` porte un nom **fixe** de manière assez contraignante (ne supporte pas un nom de class dynamique). Ceci oblige à un avoir un component distinct pour chaque style désiré:
- `SdBlanc [texte]`: la fonte du texte est blanche (pour des fonds foncés).
- `SdNoir [texte]`: la fonte du texte est noire (pour des fonds clairs).
- `SdRouge [texte]`: la fonte du texte est rouge (pour des fonds clairs ou foncés).

Dans ces components le fond N'EST PAS fixé, il est transparent, et suivra celui de l'environnement. Mais celui de la fonte doit l'être, d'où le component suivant:
- `SdNb [texte idx]`: il choisit entre SdBlanc et SdNoir selon, a) que le mode Quasar _dark_ est actif ou non, b) que idx passé en propriété est absent ou pair ou impair.

> Remarque: de facto seul SdNb est utilisé dans les autres éléments. Et encore car l'affichage d'un MD s'effectue quasiment tout le temps par le component ShowHtml qui englobe SdNb. Toutefois il existe des cas ponctuels d'utilisation de SdBlanc et SdRouge.

### Les mots clés
Les mots clés sont attachés:
- à des contacts ou des groupes connus du compte par **McMemo**,
- à des notes par **NoteMc**.

Ils sont affichés par **ApercuMotscles** qui permet d'éditer le choix par **ChoixMotscles**.

### Gestion des dialogues
Les objectifs de cette gestion sont:
- de gérer une pile des dialogiues ouverts et en conséquence de pouvoir les fermer sans avoir à se rappeler de leur empilement éventuel,
- pouvoir fermer tous les dialogiues ouverts à l'occasion d'une déconnexion.

On distingue les dialogues,
- **singletons**: une seule instance à un instant donné.
  - leur variable modèle de contrôle est un **booléen** `stores.ui.d.DLxxx`
  - ils s'ouvrent par `stores.ui.oD('DLxxx')`
- **dialogues internes de components** pouvant avoir plusieurs instances à un instant donné:
  - leur variable modèle de contrôle est un `{}` `stores.ui.d.DLxxx`
  - ils s'ouvrent par `stores.ui.oD('DLxxx', this.idc)`

Dans les deux cas ils se ferment par `stores.ui.fD()`

#### Dialogues internes des components
Les _components_ peuvent avoir et en général ont, plusieurs instances affichées à l'écran à un instant donné. 

Quand un component a un dialogue interne:
- une variable `idc` (id du component) est déclarée au `setup()` (numérotation croissante de `stores.ui.idc`). Chaque _instance_ du component reçoit une identification absolue unique: `const idc = ref(ui.getIdc())`.
- un dialogue interne `DXxx` est piloté par la variable modèle de `stores.ui.d.DXxx[idc]` où `idc` est le **numéro d'instance** du component. Cette variable dans `stores.ui.d` est déclarée comme un objet: ainsi chaque instance de dialogue interne a _une_ variable modèle de contrôle pour _chaque_ instance.

## Components

### Les filtres
La page principale App a un drawze à droite réservé à afficher les filtres de sélection propres à chaque page et permettant de restreindre la liste des éléments à afficher dans la page (par exemple les notes).

Chaque filtre est un component simple de saisie d'une seule donnée: la valeur filtrée étant stockée en store.

- **FiltreNom**: saisie d'un texte filtrant le début d'un nom ou un texte .contenu dans un string.
- **FiltreMc**: liste de mots clés (qui peuvent être soit requis, soit interdits).
- **FiltreNbj**: saise d'un nombre jours 1, 7, 30, 90, 9999.
- **FiltreAvecgr**: case à cocher 'Membre d\'un groupe' pour filtre des contacts.
- **FiltreTribu**: menu de sélection de:
  - '(ignorer)',
  - 'Compte de ma tranche de quotas',
  - 'Sponsor de ma tranche de quotas',
- **FiltreAvecsp**: case à cocher 'Comptes "sponsor" seulement'.
- **FiltreNotif**: menu de sélection de la gravité d'une notification:
  - '(ignorer)',
  - 'normale ou importante',
  - 'importante'
- **FiltreRac**: menu de sélection d'unstatut de chat:  
  - '(tous, actifs et raccrochés)',
  - 'Chats actifs seulement',
  - 'Chats raccrochés seulement'
- **FiltreSansheb**: case à cocher 'Groupes sans hébergement'.
- **FiltreEnexcedent**: case à cocher 'Groupes en excédent de volume'.
- **FiltreAinvits**: case à cocher 'Groupes ayant des invitations en cours'.
- **FiltreStmb**: menu de sélection du statut majeur d'un membre.
  - '(n\'importe lequel)',
  - 'contact',
  - 'invité',
  - 'actif',
  - 'animateur',
  - 'DISPARU',
- **FiltreAmbno**: filtre des membres d'un groupe selon leurs drots d'accès:
  - '(indifférent)',
  - 'aux membres seulement',
  - 'aux notes seulement',
  - 'aux membres et aux notes',
  - 'ni aux membres ni aux notes',
  - 'aux notes en écriture'
- **FiltreVols**: menu permettant de sélectionner un volume de fichiers d'une note 1Mo, 19Mo, 100,Mo 1Go
- **FiltreTri**: sélectionne un crtière de tri dans une des deux listes TRIespace et TRItranche définies au dictionnaire. 
  - sur tranche: stores.avatar.ptLcFT tri selon l'une des 9 propriétés des tranches listées en tête de stores.avatar.
  - sur espace: PageEspace effectue un tri selon 17 propriétés des synthèses.
 
### Les boutons
Ils n'importent aucune autre vue et sont des "span" destinés à figurer au milieu de textes.
- **BoutonHelp**: ouvre une page d'aide.
- **BoutonLangue**: affiche la langue courante et permet de la changer.
- **NotifIcon**: affiche le statut de notification de restriction et ouvre PageCompta. 
- **BoutonMembre**: affiche le libelleé d'un membre, son statut majeur et optionnellment un bouton ouvrant un PanelMembre qui le détaille. N'est importé que dans ApercuGroupe.
- **BoutonBulle** (3): affiche en bulle sur clic, un texte MD figurant dans le dictionnaire des traductions.
- **BoutonBulle2** (3): affiche en bulle sur clic, un texte MD qui a été composé dynamiquement en respectant les traductions.
- **BoutonUndo**: affiche une icône undo, disable ou non selon la condition passée en propriété.
- **BoutonConfirm**: active la foncion de confirmation quand l'utilisateur a frappé le code aléatoire de 1 à 255 qui lui est proposé.
- **QueueIcon**: petit rond de couleur au-dessus d'une icöne pour marquer l'existence d'une queue de fichiers en téléchargement.

### ChoixQuotas (1)
Saisie des quotas d'abonnement / consommation à affecter à une tranche, un compte, un groupe.

### TuileCnv (1)
Affiche dans une tranche ou un espace le taux d'occupation.

### TuileNotif (1)
Affiche dans une tranche ou un espace les notifications.

### MenuAccueil (1)
Affiche le menu principal aussi inclus dans la page d'accueil.

### ApercuMotscles (3)
Liste les mots clés sur une ligne. 
- ouverture du choix des mots clés sur bouton d'édition.

Import: ChoixMotscles

Dialogue:
- AMmcedit: édition / zoom des mots clés

### EditeurMd (3)
Editeur de texte en syntaxe MD, visible soit en HTML soit en texte pur.
- zoom en plein écran possible,
- insertion d'emoicones,
- undo,
- le texte a une valeur initiale (pour permettre le undo) et un v-model pour la valeur courante.

Import: ShowHtml, ChoixEmoji

Dialogue:
- EMmax: vue en plein écran

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

### ApercuNotif (5)
Affiche une notification. Un bouton ouvre le dialogue DaliogueNotif d'édition d'une notification.

Import: BoutonBulle, ShowHtml, DialogueNotif

Dialogue:
- DNdialoguenotif: dialogue-notif

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

### ListeAuts (1)
Affiche en ligne la liste des auteurs d'une note avec leur nom ou leur indice memebre et ouvre leur carte de visite sur click.

### NotePlus (6)
Apparaît soit comme un bouton menu, soit comme un bouton proposant l'ajout d'une note selon l'auteur sélectionné.

N'est importé que par PageNotes.

Import: NoteNouvelle

### NoteEcritepar (1)
Bouton dropdown proposant des auteurs possibles:
- pour une note de groupe en création, en édition, pour un fichier,
- pour un item de chat de groupe, l'auteur de l'item

### PanelDialtk (1)
Affiche un ticket de paiement dans laperçu d'un ticket et le panel credits.

### NomGenerique (1)
Saisie d'un nom, de fichier ...

### DialogueNotif (4)
Affichage / saisie d'une notification, texte et niveau.
- enregistrement / suppression selon que la notification est générale, tranche de quoas ou compte.

Import: EditeurMd, BoutonBulle

## Dialogues

### DialogueErreur (1)
Affiche une exception AppExc et gère les options de sortie selon sa nature (déconnexion, continuation ...).

### ChoixEmoji (1)
Dialogue de saisie des émojis à insérer dans un input / textarea.
- se ferme à la fin de la saisie.
- singleton, du fait de son inclusion soit dans EditeurMd soit dans Motscles qui n'ont qu'une seule instance en édition à un instant donné (toujours inclus dans des dialogues).

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

### ContactChat (2)
Dialogue de saisie de la phrase de contact d'un avatar, puis création, éventuelle, d'un nouveau chat avec lui.

Import: PhraseContact

### PanelCredits (3)
C'est l'onglet "crédits" de PageCompta:
- affiche les tickets en cours,
- rafraîchit leur incorporation,
- bouton de génération d'un nouveau ticket.

Import: ApercuTicket, PanelDeta, PanelDialtk

### ApercuTicket (2)
Affiche un ticket,
- plié: donnée synthétique,
- déplié: son détail et les actions possibles.

Import: PanelDialtk

### NoteConfirme (2)
Dialogue de confirmation d'une action sur une note:
- ne s'applique qu'à la suppression d'une note.
- vérifie l'autorisation d'écriture, dont l'exclusivité d'accès pour une note de groupe.

Import: BoutonConfirm

### NouveauFichier (2)
Dialogue d'acquisition d'un nouveau fichier, local ou depuis le presse-papier, pour une note.
- permet de changer son nom,
- liste les versions antérieures de même nom devant être purgées.

Import: NomGenerique

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

### PressePapier (3)
Affiche en panel dans deux onglets,
- les notes gardées en presse-papier,
  - ajout, édition, suppression
- les fichiers gardés en presse-papier
  - ajout, remplacement, suppression, affichage, enregistrement, copie.

Import: ShowHtml, EditeurMd, NomGenerique

### NoteNouvelle (4)
Créé une nouvelle note avec le texte saisi:
- pour un groupe l'auteur de la note est à choisir.

Le rattachement de la note a été défini dans la PageNotes selon l'endroit d'où la nouvelle note a été demandée.

Import: BoutonUndo, EditeurMd, NoteEcritepar

### NoteEdit (6)
Affiche le texte d'une note pour édition:
- pour une note de groupe permet de choisir l'auteur.

Import: EditeurMd, ListeAuts, NoteEcritepar, ApercuGenx

### NoteExclu (6)
Gère l'affichage, l'attribution et le retrait d'exclusivité d'écriture d'une note de groupe à un des membres du groupe.

Import: BoutonBulle, ApercuGenx, ListeAuts

### NoteFichier (3)
Affiche les fichiers attachés à une note:
- gère leur affichage, téléchargement local, suppression.
- gère la gestion en visibilité en mode avion, soirt d'une version spécifique, soit de la version la plus récente.

Import: NouveauFichier, NoteEcritepar

Dialogue:
- NFsupprfichier: confirmation de suppression de fichier
- NFconfirmav1: confirmation visible en mode avion par nom
- NFconfirmav2: confirmation visible en mode avion par version

### NoteMC (6)
Affiche et attribue les mots clés d'une note, personnelle et du groupe.

Import: BoutonBulle, ApercuGenx, ChoixMotscles, ListeAuts

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

### PageNotes (7)
Affiche l'arbre des notes avec pour racines les avatars et les groupes:
- en tête affiche le détail de la note courante, avec les actions qu'elle peut subir.
- la barre séparatrice petmet de lancer le chragment local des notes sléctionnées et le plier / déplier global de l'arbre.
- en bas l'arbre des notes selon leur rattachemnt.

Import: ShowHtml, ApercuMotscles, NoteEdit, NoteMc, NotePlus, NoteExclu, NoteFichier, NoteConfirme, ListeAuts

Diaalogue:
- PNdl: dialogue gérant le chargement des notes en local.

### PageFicavion (2)
Affiche la liste des fichiers visible en mode avion et pour chacun,
- permet de l'afficher et de l'enregistrer localement,
- de voir la note à laquelle il est attaché.

# Données en mémoire _modèle_ et persistantes localement IDB

# Opétrations, connexions, synchronisation et autres

# En chantier

### A développer / revisiter
- blocage des accroissements de volume: vérifier le blocage
- GC à réviser
- permutation de mode autonome / organisation d'un compte

_Arrêtés mensuels_ (**CSV**)
- tickets réceptionnés dans le mois. gérer pour le Comptable le "dernier mois archivé".
  - une ligne par ticket dont l'ids débute par le mois.
  - une fois archivé dans un secret du Comptable, opération du serveur pour détruire tous les tickets du mois et antérieurs.
- une ligne par comptas d'extrait des compteurs relatifs au mois M-1 (dès qu'il est figé).

### Features à développer
_Arrêtés mensuels des Tickets_ (**CSV**)
- tickets réceptionnés dans le mois pour le Comptable (gestion des archives mensuelles).
  - une ligne par ticket dont l'ids débute par le mois.
  - une fois archivé dans un secret du Comptable, appel d'opération du serveur pour détruire tous les tickets du mois et antérieurs.

_Photos périodiques / sur demande_ des abonnements / consommation des comptes
- une ligne par comptas d'un extrait des compteurs relatifs au mois M-1 (dès qu'il est figé).

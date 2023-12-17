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


### Page: `PageLogin`
Page initiale de connexion et / ou de création d'un compte sponsorisé.

Opérations: connecterCompte, GetEstFs

Dialogues: 
- Dialogue d'acceptation d'un nouveau sponsoring: AcceptationSponsoring

Composants: PhraseContact, PhraseSecrete,

### Page: `PageCompte`
Page affichant l'état du compte et ses avatars.

Opérations: ChangementPS, MemoCompte, MotsclesCompte, NouvelAvatar, ExistePhrase

Dialogues:
- Dialogue de création d'un nouveau sponsoring : NouveauSponsoring
- Dialogue de suppression d'un avatar: SupprAvatar
- Dialogue de changement de la phrase secrète
- Dialogue d'édition des mots clés du compte
- Dialogue de création d'un nouvel avatar
- Dialogue d'édition du mémo du compte
- Dialogue de changement de la phrase secrète

Composants: NomAvatar, ApercuAvatar,
    PhraseSecrete, EditeurMd, ShowHtml, MotsCles

### Dialogue pleine hauteur / large: `NoteFichier`
Dialogue présentant en accordéon les fichiers de la  note courante avec la possibilité de créer un nouveau fichier ou d'en supprimer.

Invoqué par PageNotes.

Opération: SupprFichier

Dialogues:
- Dialogue de création d'un nouveau fichier: NouveauFichier
- Confirmation de suppression
- Confirmation visible en mode avion 1
- Confirmation visible en mode avion 2

### Dialogue grande hauteur / moyenne: `NouveauFichier`
Dialogue en 4 étapes de création d'un nouveau fichier ou d'une nouvelle version d'un fichier existant.
- (1) acquisition du fichier :
  - soit par sélection dans le presse-papier: le fichier sélectionné revient par l'écoute de l'invocation de l'action `copiercollerfic` du store `pp` une fois éffectuée par le dialogue `PressePapier` (hébergé par `App.vue`).
  - soit un fichier local du poste.
- (2) acquisition / correction du nom.
- (3) présentation de la liste des versions existantes avec possibilité de choisir celles à supprimer.
- (4) suivi de l'exécution de l'opération qui peut être longue avec ses 3 phases et clôture finale `Vu`.

Invoqué par NoteFichier.

Opération: NouveauFichier.

## Panels

### ApercuChat (6)
Affiche les échanges d'un chat.

Import: EditeurMd, ApercuGenx

## Components

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

### ApercuChatgr (3)
Affiche le chat d'un groupe.
- ajout d'items et supression d'items.

Import: EditeurMd, NoteEcritepar

### ApercuChat (3)
Affiche le chat d'un avatar du compte avec un contact.
- ajout d'items et supression d'items.
- raccrocher le chat/

Import: EditeurMd, NoteEcritepar

### MotsCles (2)
Edite les mots clés, soit d'un compte, soit d'un groupe.

N'est importé **que** par PageCompte et ApercuGroupe (une seule édition à un instant donné).

Import: ChoixEmoji

### SupprAvatar (2)
Panel de suppression d'un avatar.
- affiche les conséquences en termes de pertes de secrets, de groupes et de chats avec les volumes associés récupérés.
- importé **uniquement* par PageCompte.

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


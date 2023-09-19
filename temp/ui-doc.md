## TODO le 16 sept.
Revoir dans page compta les périodes de référence et cumuls etc.

gérer les restrictions - fait en partie pour figé

Comptable : gérer les options sur espace

Créer / MAJ Tribu : q1 q2, ajouter qc

Gérer compte d'une tribu : q1 q2, ajouter qc

Sponsoring : compte A et qc sur compte O

Vue compte estA et sponsor

Vue session : conso de la session et valorisation

Décomptes des chats et groupes

Résiliation avatar dnn dnc dng dv2 

GC d'espace figé

Révision complète groupe et actions possibles

Révision chats avec raccrocher



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


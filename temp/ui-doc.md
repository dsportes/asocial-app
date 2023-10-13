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


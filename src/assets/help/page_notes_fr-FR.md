Lire dans la documentation générale, lire <a href="$$/appli/notes.html" target="_blank">Notes personnelles</a>

Lire dans la documentation générale, lire <a href="$$/appli/groupes.html" target="_blank">Les groupes et leurs notes</a>

## Page des notes
Cette page présente **toutes** les notes, 
- notes personnelles des avatars du compte,
- notes des groupes auxquels le compte participe.

# Arbre des notes : partie inférieure

La présentation arborescente affiche **toutes** les notes, du moins celles répondant au critère de filtre utile pour réduire la taille de cet arbre quand on chercher certaines notes.

### Le premier niveau est celui des _racines_ 
Il comporte une entrée par _avatar du compte_ et un entrée par _groupe_. Pour chaque racine il s'affiche:
- son nom, celui de la _carte de visite_ de l'avatar ou du groupe.
- le nombre de notes du sous-arbre répondant au critère de sélection,
- le nombre de notes total (sans aucun critère des sélection).

### Le second niveau (et au delà)
Le second niveau affichent les notes qui ne sont rattachées à aucune autre. 

On peut _déplier_ chacune de ces notes et y voir les notes rattachées, et ainsi de suite pour les autres notes. Pour chaque note il apparaît:
- si elle a des notes qui lui sont rattachées,
  - le nombre de notes du sous-arbre répondant au critère de sélection,
  - le nombre de notes total (sans aucun critère des sélection).
- son _titre_, le début de sa première ligne.

#### Remarques sur le rattachement des notes
Rattacher une note à une autre c'est en préciser un de ses aspects.

On peut aussi imaginer des _notes de rubriques_, comme un répertoire d'un système de fichiers, où,
- la note elle-même donne un commentaire sur le contenu du _répertoire_,
- les notes rattachées étant toutes celles de la rubrique correspondante.

**A une note d'un avatar,** il n'est possible de rattacher QUE des notes du même avatar. 
- Il n'y aucun sens à ce qu'un autre avatar (du compte) commente un autre avatar du même compte.

**A une note d'un groupe** (ou à la racine du groupe), il n'est possible de rattacher QUE,
- **des notes du groupe lui-même**: d'ailleurs les groupes s'ignorent entre eux.
- **ET des notes d'un avatar du compte**:
  - le compte peut _attacher des notes complémentaires_ à une note d'un groupe, sachant qu'il sera seul à les voir: aucun autre compte ne peut voir les notes personnelles du compte.
  - les autres rattachées derrière celle-ci sont forcément du même avatar.

## Filtrer les notes visibles
Le panneau de filtre s'ouvre avec le bouton **_loupe_** et permet de fixer les critères de filtre: seules les notes respectant le critère fixé s'affichent, mais aussi celles auxquelles elles sont rattachées afin de pouvoir y accéder depuis l'arbre.

### Filtrer sur UN avatar / groupe
On peut sélectionner un avatar ou un groupe, ou choisir de ne rien filtrer (tous avatars et groupes).

### Modifiées dans les N jours
Ce filtre permet de ne voir que les notes modifiées récemment (plus ou moins).

### Texte de la note contenant _le texte cité_

### Ayant / n'ayant pas, les hashtags cités
On peut attacher des hashtags aux notes, et filtrer ainsi celles ayant les hashtags souhaités mais n'ayant pas ceux indésirables.

### Taille totales des fichiers supérieure à ...
Ce critère permet de repérer les notes ayant des fichiers (plus ou moins) volumineux.

## Notes _fantômes_
Quand on supprime une note N1 elle disparaît, son texte est perdu.

Mais des notes N2, N3 ... peuvent avoir été rattachées à N1 et elles n'ont pas à être perdues. Pour cela une note _fantôme de N1_, portant d'ailleurs son identifiant, est créée et rattachée directement à la racine dont N1 descendait par rattachement.

On ne peut plus voir le titre de la note _fantôme_ puisque son contenu a été détruit, mais on peut voir le nombre de notes qui lui étaient et sont toujours rattachées. La note _fantôme_ disparaît quand plus aucune note ne lui est rattachée.

## Groupes _fantômes_
C'est un groupe dont le compte est radié, qui peut-être vit encore pour d'autres comptes, peut-être a disparu.

Pour le compte toutes ses notes de groupes sont _invisibles_ (elles sont encore visibles pour les membres actifs du groupe, s'il en existe). Bref pour le compte c'est _comme si_ toutes les notes de ce groupe avaient été supprimées.

Mais le compte a pu attacher des notes personnelles à des notes du groupe actuellement fantôme:
- elles ne sont pas perdues,
- elles sont,
  - soit rattachées directement au groupe,
  - soit rattachées à des notes _fantômes_ du groupe, représentantes réduites des notes derrière lesquelles les notes du compte ont été rattachées.
  
Le compte pourra à son choix,
- déplacer ses propres notes du groupe fantôme vers ses avatars,
- les détruire si elles n'ont plus d'intérêt,
- les laisser là où elles sont: si plus tard le compte est à nouveau membre actif du groupe _fantôme_ celui-ci sera un groupe normal et ses notes reviendront s'inscrire derrière les notes du groupe à qui elles étaient rattachées. 

# Détail de la note _sélectionnée_ : partie supérieure
La partie supérieure est un _zoom_ sur la note ou racine sélectionnée dans l'arbre en dessous.

Pour une racine, le détail se limite à la _carte de visite_ de l'avatar ou du groupe sélectionné.

## Détail d'une note et actions possibles | dial_notenv dial_notemaj dial_noteex dial_notefic

Pour le détail des actions ci-après se reporter à la rubrique d'aide correspondante citée ci-dessus.

#### Modifier son texte
La note apparaît avec:
- son titre (le début de sa première ligne),
- les 4 derniers caractères de son identifiant,
- sa taille,
- la date de dernière mise à jour.

Le texte complet de la note apparaît ensuite et peut être zoomé en plein écran.

Pour une note de groupe il s'affiche la liste des auteurs successifs ayant mis à jour la note, les plus récents en tête et cités au plus une fois.

Le bouton CRAYON au boit de la ligne permet de modifier le texte de la note.

#### Gérer ses hashtags
Ses hashtags actuels sont affichés et peuvent être modifier en appuyant sur le bouton CRAYON au bout de la ligne.

#### Lui attacher des fichiers et les gérer
Le volume des fichiers est affiché sur la ligne, le bouton au bot de la ligne ouvre le dialogue de gestion des fichiers attachés à la note.

#### Gérer son exclusivité d'écriture (pour une note de groupe)
Pour une note de groupe seulement, le membre ayant l'exclusivité d'écriture s'affiche. Le bouton au bout de la ligne permet de gérer son attribution.

### Créer une nouvelle note rattachée à la note sélectionnée
Les boutons permettent de créer ces notes:
- soit une note personnelle d'un avatar,
- soit une note de groupe.

Le choix dépend de la note sélectionnée.

### "SUPPRIMER"" la note
Cette action demande confirmation.

### "RATTACHER", la note sélectionnée à une autre note
et la détacher de celle à laquelle elle était rattachée si c'était le cas.

Après appui sur ce bouton, l'arbre fait apparaître des racines / notes munies d'une **étoile verte**: 
- elles sont _dépliées_ dans l'arbre. Toutefois s'il y en a beaucoup, appuyer sur le bouton proposé.
- une fois la note choisie, confirmer le choix (ou l'effacer et recommencer).

# Album des photos des notes | album_photos
Une note peut avoir des fichiers _image_ attachés: pour chaque image une _miniature_ de taille réduite (96 pixels) est enregistrée.

Quand un article de l'arbre est sélectionné, dans la partie supérieure de détail un bouton **Album** ouvre un panel affichant toutes les images des notes du sous-arbre sélectionné.

En l'absence de sélection d'un sous-arbre, l'album considère **toutes** les notes (du moins celles répondant au filtre).

# Télécharger la sélection des notes affichées dial_notedl
Ce téléchargement est possible sur un poste Windows / Linux après avoir installé un petit outil téléchargeable.
- on peut télécharger les textes **décryptés** des notes,
- sur option on peut aussi télécharger leurs fichiers attachés **décryptés** (ce qui le cas échéant peut requérir beaucoup de place sur le disque).

Voir la rubrique d'aide correspondante ci-dessus.


## Qu'est-ce que le _presse-papier_ ?
Cette fonctionnalité est disponible dans les trois modes.

Le _presse-papier_ garde localement des _textes_ et des _fichiers_, chacun portant un code identifiant non significatif en plus d'un nom signifiant.

# Copier des textes et fichiers dans le presse-papier
On peut ajouter un texte,
- soit en le saisissant,
- soit en le copiant / collant depuis n'importe quel endroit, en particulier depuis le texte d'une note.

On peut _éditer_ un texte du presse-papier.

On peut ajouter un fichier au presse-papier,
- soit en le sélectionnant depuis un des fichiers disponibles sur le poste,
- soit en _copiant_ une révision d'un fichier attaché à une note.

Dans une note:
- on peut _coller_ du texte, en particulier celui d'un texte du _presse-papier_.
- on peut attacher comme révision d'un fichier d'une note l'un de ceux présent dans le _presse-papier_.

### Persistance
Selon le mode de la session, le _presse-papier_ est plus ou moins persistant d'une session à la suivante:
- en mode _incognito_, il reste en mémoire du navigateur: sa durée de vie est celle de la session en cours.
- en modes _synchronisé_ et _avion_ , le _presse-papier_ est sauvegardé dans la base locale du compte dans le navigateur: son contenu est disponible à l'ouverture de la session suivante (mode _synchronisé_ ou _avion_).

### Exemple d'usage du _presse-papier_
Dans une zone blanche, on peut ouvrir une session en mode _avion_, mais pas effectuer de mise à jour.

Il est possible toutefois de _préparer_ des mises à jour:
- ouvrir le texte d'une note, le mettre dans le _presse-papier_ et l'éditer.
- prendre des photos et les enregistrer dans le _presse-papier_.

Le contenu du _presse-papier_ est crypté, inaccessible à quiconque n'est pas le compte propriétaire: même si le mobile a été volé, son contenu reste indéchiffrable.

Une fois retourné dans une zone ayant du réseau, on peut ouvrir une session en mode _synchronisé_. Le _brouillon_ de la note mise à jour et les photos mises en _presse-papier_ sont accessibles pour effectuer la véritable mise à jour.

# La page de gestion du presse-papier
## Onglet "Notes"
Le bouton "AJOUTER UNE NOTE" ouvre l'éditeur afin de pouvoir écrire son contenu.

La liste des _notes_ apparaît en dessous avec pour chaque note enregistrée:
- sa date-heure d'enregistrement,
- son contenu textuel.

La note peut être supprimée par le bouton "Corbeille".

Le bouton "Crayon" ouvre le dialogue d'édition. Des copier / coller peuvent y être faits. "VALIDER" la note à la fin de l'édition.

## Onglet "Fichiers"
Le bouton "AJOUTER UN FICHIER" ouvre le dialogue de création d'un fichier:
- choisir un fichier local sur le poste,
- lui donner un **nom** et un **commentaire** (facultatif).

Puis "VALIDER" la création du fichier.

La liste des _fichiers_ enregistrés apparaît avec pour chacun:
- une première ligne avec:
  - son nom,
  - sa date-heure de création,
  - son identifiant interne `#8...`,
  - son type MIME comme `image/jpeg`, 
  - sa taille _originale_ (non cryptée, non gzippée).
- une seconde ligne avec le commentaire.

Les actions suivantes sont proposées par des boutons:
- **AFFICHER** le fichier dans un nouvel onglet du browser,
- **ENREGISTRER** le fichier (non crypté, non gzippé) dans le répertoire de Téléchargements du browser,
- le bouton **"Crayon"** ouvre le même dialogue que celui de création. A la fin du remplacement choisir entre,
  - **AJOUTER** en tant que nouveau fichier,
  - **REMPLACER** celui d'origine.
- le bouton **"Corbeille"** supprime le fichier.

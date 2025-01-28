Lire dans la documentation générale, lire <a href="$$/appli/notes.html" target="_blank">Notes personnelles</a>

Lire dans la documentation générale, lire <a href="$$/appli/groupes.html" target="_blank">Les groupes et leurs notes</a>

# Principes d'attachement de fichiers à une note
Les notes de groupe comme d'avatar peuvent avoir des fichiers attachés.

## Fichiers et leurs révisions
**Un fichier est identifié par son nom à l'intérieur de sa note.**

Un fichier peut avoir UNE ou PLUSIEURS REVISIONS chacune ayant les propriétés suivantes attribuées à leur création:
- un identifiant interne tiré au hasard et sans signification,
- un commentaire facultatif qui aide à la reconnaître parmi les autres révisions du fichier,
- un type MIME comme `image/jpeg` ...
- un contenu (suite d'octets). Celui-ci est _crypté_ dès qu'il est stocké localement ou dans le _Storage_ central des fichiers ou transite sur le réseau.
- sa date et heure d'enregistrement.

> La création d'un fichier est en fait la création de sa première révision.

> Un fichier ne se met pas à jour: une nouvelle révision est créée.

> Une révision d'un fichier peut être supprimée: si c'était la dernière pour ce fichier, le fichier _n'existe plus_.

## Stockage _central_ des révisions des fichiers
Il s'effectue dans un espace serveur _Storage_ où chaque contenu a été crypté sur le poste qui l'a enregistré.

## Stockage _local_ des révisions des fichiers
Sur chaque poste, chaque compte ayant ouvert une _session synchronisée_ dispose d'une petite base de données _locale_ qui lui est propre et où les données du compte sont stockées (cryptées):
- afin d'accélérer l'ouverture des sessions en ayant une très grande partie des données à proximité,
- afin de pouvoir accéder aux données du compte en mode _avion_ en l'absence de réseau.

Cette base locale peut stocker certaines révisions de fichiers et ainsi permettre leur accès en mode _avion_: voir la rubrique correspondante ci-après. 

Le choix de ces révisions est fait pour chaque poste de manière distincte.

## Limitations de volume
1) Un compte a toujours un _quota_ de volume de fichiers qui fixe le volume maximum possible pour l'ensemble des fichiers attachés à ses notes personnelles et aux notes des groupes dont il est hébergeur.

2) Un groupe a toujours un volume de fichiers maximum fixé par son compte hébergeur pour les fichiers attachés aux notes du groupe.

3) Un groupe sans hébergeur ne peut plus avoir de volume de fichiers croissant.

Lorsqu'une nouvelle révision d'un fichier est créée, ces volumes maximum courent le risque d'être dépassés: c'est pour cela qu'à chaque nouvelle révision, il apparaît la liste des révisions de ce fichier (ou des autres fichiers de la note) qui peuvent être _supprimées_ simultanément à la création de la nouvelle révision: quand le volume _supprimé_ est supérieur ou égal au volume _ajouté_ la création est **toujours** possible.

> Quand aucune de ces limites n'est menacée la création d'une nouvelle révision peut augmenter le volume total.

# Liste des fichiers de la note | page_login_pp
Cette liste affiche tous les _fichiers_ attachés à la note.

Pour chaque fichier il apparaît la liste de ses révisions en ordre chronologique de leur création (les plus récentes en tête) avec:
- le commentaire de la révision.
- son identifiant interne `#8...`.
- son type MIME comme `image/jpeg`.
- sa taille _source_ (non cryptée, non gzippé).
- sa date-heure de création
- un bouton de **Menu** qui propose les actions listées ci-après.

### Actions possibles sur une révision

#### Copier dans le "presse-papier"
Enregistre localement la révision comme fichier du presse-papier.

#### Afficher dans un nouvel onglet
Si le browser sait afficher le type du fichier, son contenu est affiché dans un nouvel onglet. Dans le cas contraire le browser propose, en général, de l'enregistrer sur le poste.

#### Enregistrer une copie locale
Le fichier est enregistré localement, non crypté, dans le répertoire des téléchargements du poste, si possible avec une _extension_ qui reflète son type.

#### Supprimer définitivement
La révision est supprimée: si c'était la dernière existante pour le fichier, le fichier disparaît aussi.

#### Accessibilité en avion
Voir la rubrique dédiée ci-après.

# Ajout d'un fichier ou d'une révision de fichier
Le bouton "+FICHIER" ouvre le dialogue de création de la première révision d'un nouveau fichier.

Le bouton "+REVISION" ouvre le dialogue, similaire, d'ajout d'une révision.

### Étape #1 : choix du contenu
Il est possible de choisir:
- soit un fichier enregistré dans le _presse-papier_,
- soit un fichier stocké localement sur le poste.

### Étape #2 : nom du fichier et commentaire de la révision créée
Saisir ces deux informations:
- le nom du fichier est défini par défaut:
  - par le nom du fichier chargé pour la création d'un fichier.
  - par le nom du fichier quand on ajoute une révision.
  - Rappel: ce nom **identifie** le _fichier_. Dans le cas d'ajout d'une révision à un fichier, si le nom est changé la révision sera celle d'un autre fichier.
- le commentaire de la révision est facultatif.

### Étape #3 : révisions à supprimer en cas de succès de la création
Cliquer sur chacune des révisions proposées pour la sélectionner / désélectionner: le volume _ajouté_ ou _réduit_ apparaît.

### ### Étape #4 : suivi de l'enregistrement
La révision est d'abord _uploadée_ dans le Storage: pour un gros fichier cette phase peut être longue.

Puis la révision _uploadée_ est validée dans la liste des révisions attachées à la note.

Quand l'opération est complète l'appui sur le bouton "VU" ramène à la liste des fichiers de la note où la nouvelle révision apparaît et celles supprimées à cette occasion n'apparaissent plus.

# Accessibilité en mode _avion_ | page_login_fa
Cette option de menu n'apparaît pas en mode _incognito_ qui ne dispose pas de stockage locale dans le browser pour le compte.

### Option: révision la plus récente toujours accessible en mode _avion_
Si cette case est cochée, la révision la plus récente sera disponible en mode _avion_: si une autre session ailleurs ajoute une révision, elle sera automatiquement chargée par toutes les sessions actives qui ont cette case cochée pour ce fichier.

> On coche cette case quand on est intéressé seulement (principalement du moins) par la dernière mise à jour.

### Option: rendre CETTE révision accessible en mode _avion_
Dans ce cas cette révision **spécifiquement** sera accessible en mode _avion_ **qu'elle soit ou non la plus récente**.

> On coche cette case pour garder une révision antérieure importante / de référence accessible en mode _avion_.

## Sessions ultérieures
Si on ouvre une session concernée par cette note et ses fichiers, et qu'elle avait cochée l'option de _révision la plus récente toujours disponible_ juste après l'ouverture de la session une tâche de fond va chercher en central les révisions de ces fichiers et les chargent dans la base locale: voir la rubrique citée ci-dessus pour suivre la disponibilité des révisons des fichiers accessibles en mode _avion_, le statut de leur téléchargement et le cas échéant les incidents de téléchargement.

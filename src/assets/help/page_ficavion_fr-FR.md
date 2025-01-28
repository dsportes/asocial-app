
# Fichiers accessibles en mode _avion_ | dial_notefic

Au cours d'une session _synchronisée_ dans un navigateur, on peut voir les notes et leurs fichiers attachés. Pour chaque _fichier_ ayant un nom donné, on voit la liste de ses _révisions_:
- en général on garde la dernière, mais on peut aussi revenir à une révision antérieure quand on en garde plusieurs.

En présence d'un fichier donné, on peut:
- soit décider de ne pas l'avoir accessible en mode _avion_,
- soit d'avoir _la révision la plus récente_ accessible en mode _avion_,
- soit d'avoir **une ou plusieurs révisions explicitement citées** accessibles en mode _avion_.

Quand on a déclaré des fichiers accessibles en mode _avion_, ils sont chargés dans la base locale du compte dans le navigateur de manière à être lisibles même en l'absence de réseau. Ces fichiers sont maintenus à jour, 
- en début de session synchronisée,
- en cours de ces sessions, même quand les mises à jour ont été effectuées depuis d'autres sessions.

> Remarque: les navigateurs n'ont pas de politiques très claires sur le volume que leurs bases locales peut supporter. Éviter de définir trop de fichiers volumineux accessibles en mode _avion_.

> Remarque: une déclaration d'accessibilité en mode _avion_ se rapporte à l'appareil sur lequel il s'exécute (plus exactement à son browser). On peut avoir un fichier _accessible en mode avion_ sur son PC et pas sur son mobile par exemple.

> Quand un fichier est accessible en mode _avion_, il n'est pas redemandé au serveur de stockage mais lu localement, ce qui est plus rapide et évite le coût de téléchargement. Certes ces coûts sont modiques mais pour certains fichiers très fréquemment lus, ça peut devenir significatif.

# Vue des fichiers accessibles en mode _avion_
Cette vue est disponible en modes _synchronisé_ et _avion_ (mais pas en mode _incognito_).

Elle liste toutes les révisions visibles en mode _avion_ des fichiers attachés aux notes.

Chacune a une entête portant:
- le nom du fichier,
- le commentaire de la révision,
- une icône indiquant son statut de chargement:
  - rond vert: la révision du fichier est chargée et disponible,
  - sablier orange: la révision du fichier est en cours de chargement, pas encore disponible mais devrait l'être bientôt.
  - erreur rouge: le chargement de la révision du fichier a échoué, une erreur a interrompu les tentatives de chargement.

Quand l'entête d'une révision est dépliée on voit plus de détails à propos de celle-ci:
- son identifiant interne,
- son type MIME comme image/jpeg,
- sa taille en octets.
- un "Menu" proposant les options décrites ci-après.

Quand le chargement de la révision du fichier est **en erreur**,
- le libellé de l'erreur s'affiche,
- un bouton est afficher pour ré-essayer de charger le fichier, ce qui va être efficace si l'échec était dû à une cause technique surmontée.

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

# Accessibilité en mode _avion_ | dial_notefic
Cette option de menu n'apparaît pas en mode _incognito_ qui ne dispose pas de stockage locale dans le browser pour le compte.

### Option: révision la plus récente toujours accessible en mode _avion_
Si cette case est cochée, la révision la plus récente sera disponible en mode _avion_: si une autre session ailleurs ajoute une révision, elle sera automatiquement chargée par toutes les sessions actives qui ont cette case cochée pour ce fichier.

> On coche cette case quand on est intéressé seulement (principalement du moins) par la dernière mise à jour.

### Option: rendre CETTE révision accessible en mode _avion_
Dans ce cas cette révision **spécifiquement** sera accessible en mode _avion_ **qu'elle soit ou non la plus récente**.

> On coche cette case pour garder une révision antérieure importante / de référence accessible en mode _avion_.

## Sessions ultérieures
Si on ouvre une session concernée par cette note et ses fichiers, et qu'elle avait cochée l'option de _révision la plus récente toujours disponible_ juste après l'ouverture de la session une tâche de fond va chercher en central les révisions de ces fichiers et les chargent dans la base locale: voir la rubrique citée ci-dessus pour suivre la disponibilité des révisons des fichiers accessibles en mode _avion_, le statut de leur téléchargement et le cas échéant les incidents de téléchargement.

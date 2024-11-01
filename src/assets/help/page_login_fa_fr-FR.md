## Fichiers accessibles en mode _avion_

Au cours d'une session _synchronisée_ dans un navigateur, on peut voir les notes et leurs fichiers attachés. Pour chaque _fichier_ ayant un nom donné, on voit la liste de ses _révisions_:
- en général on garde la dernière, mais on peut aussi revenir à une révision antérieure quand on en garde plusieurs.

En présence d'un fichier donné, on peut:
- soit décider de ne pas l'avoir accessible en mode _avion_,
- soit d'avoir _la révision la plus récente_ accessible en mode _avion_,
- soit d'avoir **une ou plusieurs révisions explicitement citées** accessibles en mode _avion_.

Quand on a déclaré des fichiers accessibles en mode _avion_, ils sont chargés dans la base locale du compte dans navigateur de manière à être lisibles même en l'absence de réseau. Ces fichiers sont maintenus à jour, 
- en début de session synchronisée,
- en cours de ces sessions, même quand les mises à jour ont été effectuées depuis d'autres sessions.

> Remarque: les navigateurs n'ont pas de politiques très claires sur le volume que leurs bases locales peut supporter. Éviter de définir trop de fichiers volumineux accessibles en mode _avion_.

> Remarque: une déclaration d'accessibilité en mode _avion_ se rapporte à l'appareil sur lequel il s'exécute (plus exactement à son browser). On peut avoir un fichier _accessible en mode avion_ sur son PC et pas sur son mobile par exemple.

> Quand un fichier est accessible en mode _avion_, il n'est pas redemandé au serveur de stockage mais lu localement, ce qui est plus rapide et évite le coût de téléchargement. Certes ces coûts sont modiques mais pour certains fichiers très fréquemment lus, ça peut devenir significatif.

### Vue des fichiers accessibles en mode _avion_
Cette vue de l'application permet,
- de gérer cette option pour chaque fichier,
- d'afficher / sauvegarder dans son répertoire de _Téléchargements_ les fichiers listés.

Cette vue est disponible en modes _synchronisé_ et _avion_ (mais pas en mode _incognito_).

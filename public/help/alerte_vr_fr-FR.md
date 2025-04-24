Dans la documentation générale, lire <a href="$$/appli/alertes.html" target="_blank">Alertes et restrictions d'accès associées</a>

## Le volume des fichiers attachés aux notes dépasse le quota QV autorisé
- il est impossible d'ajouter un nouveau fichier à une note,
- il est impossible de remplacer un fichier dans une note par un autre plus volumineux sans en même temps en supprimer d'autres.

Dès qu'une action visant à réduire le volume de fichiers été effectuée, ce volume _peut_ passer en dessous du quota et faire disparaître l'alerte:
- suppression d'une note,
- suppression d'un fichier,
- replacement de fichiers par d'autres plus petits.

#### Remarques:
- en régime établi toute action contribuant à faire dépasser le quota QV est bloquée, donc, l'alerte ne peut pas apparaître.
- MAIS si le volume est par exemple de 223MB et qu'à ce moment une décision de changement de quota intervient pour le fixer à 200MB,
  - l'alerte va apparaître,
  - elle persistera jusqu'à ce des actions aient réduit le volume en-dessous de 200MB.

### Augmenter le quota QV
C'est une option qui permet de se libérer de cette alerte et de ses contraintes:
- un compte "A" peut le faire lui-même: ceci augmente le coût de son abonnement mensuel.
- un compte "O" est dépendant de la volonté du Comptable ou d'un de ses délégués qui peuvent juger cette demande appropriée ou non (d'où la possibilité d'en discuter avec eux par _chat_).

### Remarque vis à vis d'un compte "O" _récalcitrant_
Si le Comptable ou localement pour une partition un de ses délégués, a décidé qu'il fallait réduire les coûts d'abonnements (donc réduire les quotas QV), certains comptes pourraient être tenté par _l'inaction_ et rester avec un nombre de document excessif et renoncer à en créer d'autres.

Mais le Comptable ou un de ses délégués ont le pouvoir de créer une alerte de niveau LECTURE SEULEMENT, voire d'ACCÈS RESTREINT qui peut finir en destruction du compte: la _placidité_ est une option dangereuse pour le compte.

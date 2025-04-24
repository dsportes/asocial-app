Dans la documentation générale, lire <a href="$$/appli/alertes.html" target="_blank">Alertes et restrictions d'accès associées</a>

## Le nombre de documents excède le quota autorisé

> _Remarques:_
>- une note n'ayant pas de fichier _image_ (photo) attaché compte pour 1.
>- une note ayant N fichiers _image_ (photos) attachés compte pour N+1.

Il y a trop de notes / chats / groupes par rapport au _quota QN_ déclaré:
- il est impossible d'ajouter une nouvelle note,
- il est impossible d'ouvrir un nouveau _chat_,
- il est impossible d'écrire un nouvel item sur un _chat_ marqué **indésirable**. En effet,
  - un _chat_ marqué _indésirable_ ne compte pour un chat vis à vis du respect du quota,
  - écrire un item dans ce cas, le fait apparaître dans le nombre de chats existant.
- il est impossible d'accepter une invitation à un groupe.

Dès qu'une action visant à réduire le nombre de documents a été effectuée, le nombre de documents _peut_ passer en dessous du quota et faire disparaître l'alerte:
- suppression d'une note,
- rendre un chat _indésirable_,
- s'auto-résilier d'un groupe.

#### Remarques:
- en régime établi toute action contribuant à faire dépasser le quota QN est bloquée, donc, l'alerte ne peut pas apparaître.
- MAIS si le nombre de documents est par exemple de 223 et qu'à ce moment une décision de changement de quota intervient pour le fixer à 200,
  - l'alerte va apparaître,
  - elle persistera jusqu'à ce des actions aient réduit le nombre de documents à 200.

### Augmenter le quota QN
C'est une option qui permet de se libérer de cette alerte et de ses contraintes:
- un compte "A" peut le faire lui-même: ceci augmente le coût de son abonnement mensuel.
- un compte "O" est dépendant de la volonté du Comptable ou d'un de ses délégués qui peuvent juger cette demande appropriée ou non (d'où la possibilité d'en discuter avec eux par _chat_).

### Remarque vis à vis d'un compte "O" _récalcitrant_
Si le Comptable ou localement pour une partition un de ses délégués, a décidé qu'il fallait réduire les coûts d'abonnements (donc réduire les quotas QN), certains comptes pourraient être tenté par _l'inaction_ et rester avec un nombre de document excessif et renoncer à en créer d'autres.

Mais le Comptable ou un de ses délégués ont le pouvoir de créer une alerte de niveau LECTURE SEULEMENT, voire d'ACCÈS RESTREINT qui peut finir en destruction du compte: la _placidité_ est une option dangereuse pour le compte.

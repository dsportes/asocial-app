## Option de verrouillage pour les paranoïaques
Quand on utilise l'application depuis un mobile, **en particulier dans un lieu non sûr**, il existe un risque de se le faire dérober alors que l'application est connectée à son compte.

L'intrus a alors la possibilité de consulter et d'agir sans le consentement du propriétaire.

Certes, il n'a pas la possibilité de changer la phrase secrète qui exige de redonner la phrase actuelle, mais il a accès à tout le reste sans limitation de temps tant qu'il maintient la session ouverte en agissant / naviguant.

L'option **paranoïaque** activable au login, vise à réduire la durée pendant laquelle un intrus peut agir dans l'application:
- un code PIN de sécurité de 4 chiffres (1 à 9) est saisi au moment de la connexion.
- une durée maximale d'intrusion est fixée à `30 secondes / 2 minutes / 5 minutes / Sur demande`.

Dès lors au cours de la session, toutes les _2 minutes_ si c'est la durée retenue, l'écran se recouvre d'un panneau demandant le code PIN de sécurité.

Toute erreur de saisie entraîne immédiatement une déconnexion avec redemande de la phrase secrète (que l'intrus n'a normalement pas).

L'oubli du code PIN n'a pas d'autre conséquence que de devoir se reconnecter en donnant sa phrase secrète.

### Verrouillage sur demande
Quand un code PIN de déverrouillage a été déclaré, il est possible de **verrouiller** volontairement l'écran de l'application en appuyant sur l'icône **Verrou** dans la barre du bas. Cette sécurité peut être utile quand on s'éloigne de son poste pour quelques instants et qu'on souhaite conservé l'application ouverte sur la page en cours.

> Cette option protège le compte d'un vol à l'arraché en cours de session, du moins limite le temps laissé à un intrus pour accéder aux données confidentielles. Elle est en revanche contraignante en obligeant à fréquemment ressaisir un code PIN.

Ce tableau donne la synthèse de la situation comptable à la dte et heure indiquée.

Dans la documentation générale, lire <a href="$$/appli/aboconso.html" target="_blank">Abonnement, consommation, tarifs</a>

> Remarque: le calcul de la comptabilité est _continu_: quelques instants plus tard elle est différente, ne serait-ce que parce que le coût d'abonnement aux quotas s'incrémente à chaque seconde.

Appuyer sur la flèche circulaire orangée (en haut à gauche sous le menu _trois traits_) pour obtenir la dernière valeur calculée.

# Coût mensuel d'abonnement
C'est le coût de réservation de l'espace pour les documents et les fichiers:
- _mensuel_: les _tarifs_ sont donnés plus précisément pour 30 jours.
- le montant indiqué par convention est celui d'un mois de 30 jours.

### Quota du nombre de documents (QN)
1 note, 1 chat, 1 participation à un groupe compte chacun pour 1 document.

Le _quota QN_ est exprimé par **100 documents**. Il apparaît en détail,
- le nombre de notes, chats, participations aux groupe,
- le pourcentage est celui du nombre total _actuel_ de documents par rapport au quota QN attribué.
- le coût mensuel figure en colonne de droite.

### Quota de volume des fichiers (QV)
Le _quota QV_ est exprimé par **100MB (méga-bytes) de fichiers**. Il apparaît aussi:
- le pourcentage qui est celui du volume total _actuel_ des fichiers par rapport au quota QV attribué.
- le coût mensuel qui figure en colonne de droite.

> Les tarifs dans la troisième partie, donnent les coûts d'abonnement mensuels pour une unité de quota QN (100 documents) et QV (100MB de fichiers).

> Remarque: l'abonnement total est la somme des abonnements aux quotas QN (nombre de documents) et QV (volume des fichiers).

# Quota de calcul (QC)
Le quota de calcul est donné directement en c (l'unité monétaire) et correspond à une consommation mensuelle (plus précisément sur 30 jours). 

> Les tarifs dans la troisième partie, donnent les coûts unitaires de calcul depuis les nombres de lectures, d'écritures et les volumes de fichiers transférés.

**Le quota QC sert à lever des alertes _d'excédent de calcul_** provoquant un ralentissement des opérations quand il est dépassé sur la moyenne des mois M et M-1:
- si le compte n'existait pas au premier jour de M-1, le nombre de jours considéré est exactement celui entre l'instant de création et maintenant.
- les 10 premiers jours après la création peuvent solliciter plus de calcul qu'en régime établi: la moyenne est calculée sur _10 jours_ si la durée d'existence du compte est inférieure à 10 jours.

Le pourcentage N% affiché signifie _qu'en moyenne_ la consommation actuelle s'établit à N% du quota QC de calcul souscrit: il est ainsi possible de savoir si ce dernier est suffisant ou non, ou s'il y a un risque d'être affecté par un ralentissement si la consommation moyenne ne baisse pas à l'avenir.

> Remarque: le moyen le plus radical pour faire baisser sa consommation moyenne est ... de ne plus se connecter pendant quelques jours (à M+2 elle sera même nulle).

# Solde
Le solde est calculé à chaque instant depuis le solde arrêté à la fin du mois précédent:
- **plus** les crédits reçus depuis le début du mois (paiements enregistrés, dons reçus),
- **moins** les débits des dons effectués depuis le début du mois,
- **moins** le coût de l'abonnement aux quotas QN et QC du nombre de documents et de volume de fichiers: quand les quotas ont changé en cours du mois, les quotas moyens sont calculés au prorata du temps passé sous chaque quota.
- **moins** le coût de la consommation depuis le début du mois (nombre de lectures, écritures, GB de fichiers transférés).

# Pour un compte "A"
Un compte autonome _paye_ ses coûts (abonnement et consommation de calcul): il s'affiche le nombre de jours au bout duquel le solde sera épuisé SI l'abonnement reste inchangé et la consommation moyenne de calcul identique (en supposant des tarifs constants).

# Quand le solde est _débiteur_ (négatif)
Le compte est en ACCÈS RESTREINT.

Il s'affiche la date estimée à partir de laquelle le solde est passé en négatif: dès lors **6 mois après cette date, si rien n'est fait, le compte s'auto-détruira définitivement**.

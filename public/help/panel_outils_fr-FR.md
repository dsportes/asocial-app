
Le code de la _build_ courante est affiché en tête.

La **Boîte à outils** a quatre onglets:
- **Comptes synchronisées**: liste des bases locales des comptes ayant une session synchronisée et suppression des bases obsolètes ou indésirables.
- **Tester une phrase secrète**, en obtenir les _hashs_ correspondants.
- **Tests d'accès** : tests de type _ping_.
- **Thème** : affichage des fontes et couleurs formant le thème configuré.

# Comptes synchronisées
Plusieurs comptes peuvent avoir ouvert une session _synchronisée_ sur le poste. Chacun a créé une petite _base locale_ contenant les données (cryptées) du compte.

Cet onglet liste ces _bases locales_. Chacune porte en information **trois lettres** données par le compte lors de sa première session synchronisée sur ce poste. Normalement le propriétaire du poste doit savoir qui s'est connecté sur son matériel et a priori sous quel trigramme.

Pour chaque _base_, un bouton lance le calcul de son volume, afin de déterminer si celui-ci est important ou non.

Une fois le volume calculé, une icône _poubelle_ permet de détruire cette base, si souhaité.

> Remarque: supprimer une base à tort n'a pas de conséquences graves, simplement la prochaine connexion sera plus longue (et plus coûteuse) en obligeant à lire toutes les données depuis le serveur. **Toutefois le mode _avion_ ne sera plus possible pour le compte, du moins jusqu'à ce qu'il ait ouvert une session _synchronisée_.

# Tester une phrase secrète
En frappant une phrase secrète de longueur suffisante, il s'affiche en retour les _hashs_ qui lui correspondent. 

> Il n'est pas possible de retrouver une phrase originale depuis un de ses hashs.

#### SHA256 du PBKFD de la phrase complète
Un administrateur technique doit fournir dans la configuration de chacun des _sites_ qu'il administre une _clé_ qui permet d'authentifier l'utilisateur.

En frappant la _phrase secrète de l'administrateur_, ce hash est celui à placer dans la configuration du site administré.

# Tests d'accès
Ces tests permettent de s'assurer que le serveur, la base centrale et la base locale d'un compte sont bien techniquement joignables.

Les _pings_ sont volontairement ralentis, ne pas en déduire un temps d'accès.

### Accès au serveur distant
Plus précisément c'est la disponibilité d'un serveur assurant le service des opération.

### Accès à la base sur le serveur distant
S'assure que la _base de données_ est bien joignable.

### Accès à la base locale d'un compte
Ce test exige d'être connecté et vérifie que la _base locale_ sur ce poste pour ce compte est bien joignable: encore faut-il avoir ouvert une fois une session synchronisée.

# Thème
Cet onglet n'est qu'un affichage.

### Les fontes
Des textes s'affichent avec les fontes configurées.

Changer de fonte est assez délicat et est un travail de compétence _développeur_: ça ne fait pas partie de la personnalisation simple pour chaque organisation.

### Les couleurs: le _thème_
L'application utilise 2 jeux de 16 couleurs:
- 16 couleurs pour le style _sombre_,
- 16 couleurs pour le style _clair_.

Il est possible de changer simplement ces couleurs dans le fichier de configuration de l'application.

Dans la documentation générale, lire <a href="$$/tech/theme.html" target="_blank">Configurer le thème de l'application</a>

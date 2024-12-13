
**L'administrateur technique** d'un site a pour mission de gérer techniquement les services centraux, la base de données et le stockage de fichiers.

Il dispose de moyens techniques qui sont décrits dans la partie "Technique" de la documentation générale et en particulier dans les chapitres liés au _déploiement_ des services centraux. 

Dans la documentation générale, lire <a href="$$/tech/deploiements.html" target="_blank">Les déploiements des composants de l'application</a>

Une fois les composants techniques déployés et fonctionnels pour un site, **l'administrateur technique** a quelques actions de configuration à exécuter au moyen d'une page de l'application qui lui est strictement réservée. Pour accéder à cette page, il effectue une _quasi_ connexion:
- le code de l'organisation est `admin`.
- la phrase secrète n'est connue que de lui et c'est lui qui en a donné le jeton d'autorisation associé dans la configuration des serveurs.

Cette page d'administration a deux catégories de fonctions:
- La Gestion des _Espaces_,
- La gestion des _Tâches_ périodiques et asynchrones.

# Les Espaces
Un site peut héberger techniquement jusqu'à 60 **espaces**, chacun correspondant à une _organisation_. 

> Remarque: une _organisation_ peut souhaiter disposer de plusieurs espaces, par exemple,
>- `org1` : l'espace opérationnel,
>- `org1demo` : un espace dédié à la démonstration / training,
>- `org2arch` : une photographie d'un ancien espace de production archivé (et figé).

Dans leur espace les utilisateurs n'ont aucune perception des autres espaces hébergés par le même serveur technique.
- dans la base de données, les informations sont partitionnées.
- dans l'espace de stockage des fichiers, des sous-espaces sont distincts et identifiés par le code de l'organisation.

L'administrateur technique est le seul à percevoir l'existence plusieurs espaces sur le site.

Il peut ouvrir _instantanément_ un nouvel espace pour une organisation en faisant la demande. 
- Le Comptable et l'administrateur technique se sont mis d'accord sur le volume utilisable et la participation aux frais d'hébergement.
- Cette ouverture crée une phrase de _sponsoring_ à destination du Comptable de l'organisation, 
- Le Comptable créé son compte en utilisant cette phrase de _sponsoring_ et en fixant sa phrase secrète.

_Rappel_; l'administrateur technique peut,
- émettre une notification d'information visible de tous les comptes,
- interdire toute connexion à partir d'une date donnée,
- bloquer l'espace de l'organisation en _lecture seule_,
- détruire les données par clôture de l'espace ne laissant pendant un certain temps qu'une seule information d'explication.

# Les Tâches
Les _opérations_ courantes sont _synchrones_: chacune est exécutée en une fois, ou pas du tout. Les utilisateurs peuvent percevoir les données, avant l'opération, ou, après l'opération, jamais pendant.

Mais certaines _opérations_ peuvent donner lieu à l'exécution d'une _tache différée et asynchrone_: ce sont en général des tâches de _nettoyage_ susceptibles de prendre du temps et afin de conserver un temps de réponse court, une partie du traitement est effectué plus tard.

Enfin il existe des _tâches quotidiennes_, qui réalisent:
- des suppressions et nettoyages liés au temps (détection des comptes ayant dépassé leur date limite de connexion, etc.),
- de calcul de statistiques _mensuelles_ qui une fois la fin d'un mois sont définitivement invariantes.

**L'administrateur technique** est en charge de réagir en cas de dysfonctionnement de ces tâches et de procéder aux manipulations requises pour s'assurer de leurs bonnes exécutions in fine, même quand elles ont rencontré des interruptions temporaires.

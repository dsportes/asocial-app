Dans la documentation générale, lire <a href="$$/appli/presentation.html" target="_blank">Présentation Générale</a>

### Le Comptable
_Le Comptable_ **est un compte** qui a reçu de l'administrateur technique à la création de l'espace de l'organisation une _phrase de sponsoring_ qui lui a permis de créer son compte. C'est un compte _presque_ normal, toutefois: 
- pour être bien identifiable il a une _carte de visite_ immuable, sans photo et de nom _Comptable_ et ne peut pas se créer des avatars secondaires,
- il a le pouvoir de gérer **les quotas de ressources allouées à l'organisation**:
  - il _partitionne_ les quotas globaux de l'application,
  - pour chaque _partition_ définie, il _délègue_ à certains comptes la capacité à répartir les quotas de la partition aux comptes.

> Le **Comptable** n'a pas plus que les autres comptes les moyens cryptographiques de s'immiscer dans les notes des avatars des comptes et leurs chats: ce n'est en aucune façon un modérateur et il n'a aucun moyen d'accéder aux contenus, pas plus qu'à l'identité des avatars, sauf bien entendu de ceux qu'il connaît personnellement.

# Comment ...assurer le rôle de "Comptable" | page_espace dial_majalerte1
L'essentiel des rôles spécifiques du Comptable s'exerce depuis la **page de l'espace** de l'organisation accessible depuis la page d'accueil ou le menu _hamburger_ par le bouton **Partitions de l'espace**. Voir la rubrique d'aide ci-dessus.

### Mettre à jour les options de gestion des comptes
- autorisation des comptes "A"
- nombre de mois d'inactivité avant de considérer un compte comme obsolète (auto-destructible).

### Mettre à jour les quotas attribuables aux comptes "A"
- _Quotas de l'espace_ >>> _Quotas alloués aux comptes "A"_

### Statistiques CSV d'abonnement / consommation
Accès à cette statistique.

### Export CSV des coûts par partition
Accès à cet export.

## Depuis la liste _Décomposition de l'espace en partitions_

### Bouton de création d'une nouvelle partition
Voir la rubrique citée ci-dessus.

### Pour chaque partition existante
Le bouton de menu propose:
- d'éditer son code,
- d'ajuster ses quotas,
- de déclarer / annuler une alerte pour tous les comptes de la partition,
- dé détruire la partition.
- l'option **Détails** ouvre le panel spécifique de la partition avec les actions portant sur les comptes "O" de celle-ci.

# Depuis la page d'une partition | page_partition sponsoring_d
Un bouton propose de créer un **Nouveau Sponsoring** d'un compte pour cette partition.

En sélectionnant un compte "O" de la liste des comptes de la partition, les actions suivantes sont accessibles:
- changer le compte de partition,
- Lui ajouter ou lui enlever son statut de délégué,
- voir le détail de son abonnement et de sa consommation,
- changer ses quotas,
- gérer une alerte spécifique pour lui.

# Enregistrement des versements reçus | compta_credits page_compta
Le Comptable est en charge d'enregistrer les versements qu'il reçoit de la part des comptes afin que ceux-ci soient porter à leur crédits.

Depuis la page d'accueil, le bouton **Crédits** ouvre la page d'alertes / comptabilité sur l'onglet **Crédits** où il est possible d'enregistrer les versements attendus par leur _numéro de ticket_.

Dans la documentation générale, lire:
- <a href="$$/appli/comptes.html" target="_blank">Les comptes et leurs avatars</a>
- <a href="$$/appli/avatars.html" target="_blank">Créer, gérer et supprimer ses avatars</a>

# Résiliation d'un avatar ou d'un compte | page_compte
La page du compte affiche la liste des avatars du compte, l'avatar _principal_ en tête.

L'appui sur l'icône **Poubelle** en marge d'un avatar ouvre le dialogue de résiliation de cet avatar.

#### L'avatar principal (le premier de la liste) ne peut pas être résiliation tant qu'il existe des avatars secondaires.

#### La résiliation de l'avatar principal correspond à la résiliation du compte.

## Dialogue de résiliation
Il affiche les **conséquences** pour le compte de la résiliation demandée.

### "Des notes vont disparaître"
- des notes seront supprimées définitivement: 
  - toutes les notes personnelles de l'avatar.
  - toutes les notes des groupes dont l'avatar en résiliation était le dernier membre actif.
- des notes ne seront plus accessibles par le compte: toutes les notes de tous les groupes dont l'avatar en résiliation était membre actif sans que d'autres avatars du compte ne le soit.

Il est affiché le nombre de notes et le volume des fichiers attachés correspondant: **COCHER** la case **Vu** pour assumer ces conséquences.

### "Des chats vont disparaître"
Les chats avec l'avatar en résiliation vont disparaître: les interlocuteurs de ceux-ci verront toujours le contenu du _chat_,
- avec l'indication que l'avatar a disparu,
- sans pouvoir le mettre à jour.

Il est affiché le nombre de chats: **COCHER** la case **Vu** pour assumer ces conséquences.

### "Des sponsorings en attente vont être annulés"
Il est affiché le nombre des sponsorings ouverts par l'avatar en résiliation et encore acceptables: ils seront annulés. **COCHER** la case **Vu** pour assumer ces conséquences.

### Impacts sur les groupes dont l'avatar était membre
Pour chacun des cas ci-dessous, il est indiqué:
- le ou les groupes concernés, le nombre de notes et le volume des fichiers,
- une case à **COCHER** pour assumer ces conséquences.

#### Cas 1 : Les groupes listés vont disparaître (pas d'autre membre)
Ses notes seront définitivement perdues.

#### Cas 2 : Les groupes listés sont hébergés par cet avatar et vont disparaître dans 3 mois
- Les notes restent toutefois intactes pour les autres membres MAIS il ne leur sera plus possible d'en ajouter ou d'ajouter  / remplacer des fichiers augmentant le volume occupé.
- Si d'ici 3 mois aucun autre membre du groupe ne s'est proposé comme **hébergeur**, le groupe et toutes ses notes disparaîtront définitivement.

#### Cas 3: Cet avatar est le dernier animateur des groupes listés
Il ne sera plus possible d'y inviter d'autres membres.

#### Cas 4: Cet avatar est membre des groupes listés
Leurs notes 

  SAVgr1: ' ? | Un groupe va disparaître (pas d\'autre membre) : | {count} groupes vont disparaître (pas d\'autre membre actif) :',
  SAVgr2: ' ? | Un groupe hébergé par cet avatar va disparaître dans 3 mois : | {count} groupes hébergés par cet avatar vont disparaître dans 3 mois :',
  SAVgr3: ' ? | Cet avatar est le dernier animateur d\'un groupe | Cet avatar est le dernier animateur de {count} groupes :',
  SAVgr0: ' ? | Cet avatar est membre d\'un groupe : | Cet avatar est membre de {count} groupes :',



### Pour un avatar secondaire seulement,

Volumes rendus disponibles pour le compte par la suppression de l'avatar 

Baisse des ressources occupées dans l'abonnement

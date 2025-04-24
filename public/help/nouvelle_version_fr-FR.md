Un message en rouge s'affiche parfois en haut de la page: **Nouvelle version disponible**. Que faut-il faire ?

L'application évolue au fil des extensions de fonctionnalités, de corrections de détails et d'anomalies, voire de bug.

Lorsqu'on appelle la page de l'application par une URL comme https://s1.monhebergeur.net/ depuis un browser, celui-ci effectue les opérations suivantes:
- il regarde s'il a mémorisé cette application dans sa mémoire locale.
- si c'est le cas il charge cette page et démarre l'application immédiatement, sans accéder à Internet.
- si ce n'est pas le cas il va la chercher par Internet sur le site à l'URL demandée, SAUF si le browser est en _mode avion_ (sans accès à Internet) auquel cas il répond ne pas pouvoir trouver l'application.

Dans la grande majorité des cas, l'application est donc lancée au plus tôt, sans avoir eu à la charger depuis Internet.

**PUIS**, s'il a accès à Internet, le browser va vérifier auprès du site de l'URL de l'application, s'il n'existe pas de version plus récente disponible.

### Cas usuel: la version en exécution est bien la plus récente
L'utilisateur continue sa session (connexion, etc.).

### Cas plus exceptionnel: une nouvelle version est disponible sur le site
Le browser recharge cette application en tâche de fond, du moins les seules parties ayant changé, sans que l'utilisateur n'en sache rien.

Une fois la nouvelle version totalement chargée, le message **Nouvelle version disponible** apparaît en rouge en haut ... MAIS l'utilisateur a, en général, déjà commencé à travailler. L'interrompre brutalement pour relancer l'application serait discourtois.

## Que faire ?
Il FAUT utiliser cette nouvelle version au plus tôt: elle corrige peut-être des bugs problématiques et à la limite certaines opérations pourraient être bloquées si le serveur n'accepte pas d'appels d'une application trop ancienne.

**De toutes les façons, à la prochaine relance de l'application la nouvelle version sera utilisée**. La question n'est pas de savoir SI elle sera appliquée mais QUAND.

#### Vous avez une saisie en cours importante ...
et vous n'avez pas envie de l'interrompre et de la reprendre au début.

Poursuivez votre saisie puis dès que la relance de l'application n'est pas trop contraignante, effectuer cette relance.

## Comment relancer l'application ?

### L'usage habituel du bouton du browser de rechargement de la page (une flèche circulaire) N'EST **PAS** EFFICACE.

### Si l'application n'est ouverte que dans un seul onglet
**Solution 1:** appuyer sur le message en rouge **Nouvelle version disponible** qui ouvre un dialogue simple avec un bouton pour relancer l'application.
- mais pour certains browsers, en particulier Google Chrome, ça ne fonctionne pas.

**Solution 2:** appuyer sur CTRL+F5 (la touche CTRL et en même temps la touche de fonction F5).
- mais pour certains browsers, dans certaines conditions, ça ne fonctionne pas non plus: appliquer la solution ci-dessous.

### Ce qui marche toujours
1) Fermer votre browser, OU a minima **TOUS** les onglets où l'application est ouverte. Souvent un seul mais il n'est pas interdit d'ouvrir l'application dans plusieurs onglets.

2) Appeler à nouveau l'application par son URL.

> Remarque: tant qu'il existe UN onglet ouvert s'exécutant dans votre browser avec l'ancienne version de l'application, le browser ne change pas de version. Veiller à bien fermer **tous** les onglets ouverts sur l'application.

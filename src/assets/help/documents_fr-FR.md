# Données persistantes sur le serveur

Les données persistantes sont gérées selon deux implémentations :
- **SQL** : les données sont distribuées dans des **tables** `espaces avatars versions notes ...`
- **Firestore** : chaque table SQL correspond à une **collection de documents**, chaque document correspondant à un **row** de la table SQL de même nom que la collection.

Les _colonnes_ d'une table SQL correspondent aux _attributs / propriétés_ d'un document.
- en SQL la _clé primaire_ est une propriété attribut ou un couple de propriétés,
- en Firestore le _path_ d'un document contient cette propriété ou couple de propriétés.

# Table / collection `singletons`
La collection `singletons` a un seul document `checkpoint` ayant les attributs suivants:
- `id` : qui vaut 1 (il _pourrait_ ultérieurement exister d'autres singletons 2 3 ...).
- `v` : sa version, qui est l'estampille en ms de sa dernière mise à jour.
- `_data_` : sérialisation non cryptée des données traçant l'exécution du dernier traitement journalier de GC (garbage collector).

Son _path_ en Firestore est `singletons/1`.

Le document `checkpoint` est réécrit totalement à chaque exécution du GC.
- son existence n'est jamais nécessaire et lors de la première exécution il n'existe pas.
- il sert principalement à l'administrateur technique pour s'informer, en cas de doutes, du bon fonctionnement du traitement GC en délivrant quelques compteurs, traces d'exécution, traces d'erreurs.
- il sert aussi au GC. Certaines étapes sont _mensuelles_, elles n'ont pas besoin de s'exécuter plus d'une fois par mois: `checkpoint` mémorise le derniers mois traité pour chacune de ces étapes et le GC peut ainsi éviter un lancement inutile de celles-ci. 

# Espaces
Tous les autres documents comportent une colonne / attribut `id` dont la valeur détermine un partitionnement en _espaces_ cloisonnés : dans chaque espace aucun document ne référence un document d'un autre espace.

Un espace est identifié par `ns`, **un entier de 10 à 89**. Chaque espace à ses données réparties dans les collections / tables suivantes:
- `espaces syntheses` : un seul document / row par espace. Leur attribut `id` (clé primaire en SQL) a pour valeur le `ns` de l'espace. Path pour le `ns` 24 par exemple : `espaces/24` `syntheses/24`.
- tous les autres documents ont un attribut / colonne `id` de 16 chiffres dont les 2 premiers sont le `ns` de leur espace. Les propriétés des documents peuvent citer l'id d'autres documents mais sous la forme d'une _id courte_ dont les deux premiers chiffres ont été enlevés.

### Code organisation attaché à un espace
A la déclaration d'un espace sur un serveur, l'administrateur technique déclare un **code organisation**:
- ce code ne peut plus changer (sauf lors d'une _exportation_ d'un espace).
- le Storage de fichiers comporte un _folder_ racine portant ce code d'organisation ce qui partitionne le stockage de fichiers.
- les connexions aux comptes citent ce _code organisation_.

# Tables / collections de documents
## Entête de l'espace: `espaces syntheses`
- `espaces` : `id` est le `ns` (par exemple `24`) de l'espace. Le document contient quelques données générales de l'espace.
  - Clé primaire : `id`. Path : `espaces/24`
- `syntheses` : `id` est le `ns` de l'espace. Le document contenant des données statistiques sur la distribution des quotas et l'utilisation de ceux-ci.
  - Clé primaire : `id`. Path : `syntheses/24`

## Gestion de volumes disparus : `gcvols fpurges`
- `gcvols` : son `id` est celui de l'avatar principal d'un compte dont la disparition vient d'être détectée. Ses données donnent, cryptées pour le Comptable, les références permettant de restituer les volumes V1 et V2 de facto libérés par la disparition d'un compte O `id`. 
  - Clé primaire : `id`. Path : `gcvols/{id}`
- `fpurges` : son `id` est aléatoire, les deux premiers chiffres étant le `ns` de l'espace. Un document correspond à un ordre de purge dans le Storage des fichiers, soit d'un _répertoire_ entier (correspondant à un avatar ou un groupe), soit dans ce répertoire à une liste fermée de fichiers.
  - Clé primaire : `id`. Path : `fpurges/{id}`

Ces documents sont écrits une fois et restent immuables jusqu'à leur traitement qui les détruit:
- prochaine ouverture de session du Comptables pour les `gcvols`,
- prochain GC, étape `GCfpu`, pour les `fpurges`.

# Tables / collections _majeures_ : `tribus comptas avatars groupes versions`
Chaque collection a un document par `id` (clé primaire en SQL, second terme du path en Firestore).
- `tribus` : un document par _tranche de quotas / tribu_ décrivant comment sont distribués les quotas de la tranche entre les comptes.
  - `id` (sans le `ns`) est un numéro séquentiel `1..N`.
  - Clé primaire : `id`. Path : `tribus/0...x`
- `comptas` : un document par compte donnant les informations d'entête d'un compte (dont l'`id` est celui de son avatar principal). L'`id` courte sur 14 chiffres est le numéro du compte :
  - `10...0` : pour le comptable.
  - `2x...y` : pour un compte, `x...y` est un nombre aléatoire sur 13 chiffres.
  - Clé primaire : `id`. Path : `comptas/10...0` `comptas/2x...y`
- `avatars` : un document par avatar donnant les informations d'entête d'un avatar. L'`id` courte sur 14 chiffres est le numéro d'un avatar du compte :
  - `10...0` : pour l'avatar principal du Comptable.
  - `2x...y` : pour un autre avatar que l'avatar principal du Comptable, `x...y` est un nombre aléatoire sur 13 chiffres.
  - Clé primaire : `id`. Path : `avatars/10...0` `avatars/2x...y`
- `groupes` : un document par groupe donnant les informations d'entête d'un groupe. L'`id` courte sur 14 chiffres est le numéro d'un groupe :
  - `3x...y` : `x...y` est un nombre aléatoire sur 13 chiffres.
  - Clé primaire : `id`. Path : `groupes/3x...y`
- `versions` : un document par avatar et par groupe donnant le numéro de version, numéro d'ordre de la dernière mise à jour pour l'avatar ou le groupe et toutes leurs sous-collections.
  - Clé primaire : `id`. Path : `versions/10...0` `versions/2x...y` `versions/3x...y`

# Tables / sous-collections de `versions`: `notes transferts sponsorings chats membres chatgrs tickets`
Pour un document `versions/2x...y` il existe,
- pour une version _d'avatar_ (id: 1... ou 2...), 4 sous-collections de documents: `notes transferts sponsorings chats` et pour le seul Comptable une cinquième `tickets`.
- pour une version _de groupe_ (id: 3...), 4 sous-collections de documents: `notes transferts membres chatgrs`.

Dans chaque sous-collection, `ids` est un identifiant relatif à `id`. 
- en SQL les clés primaires sont `id,ids`
- en Firestore les paths sont (par exemple pour la sous-collection note) : `versions/2.../notes/z...t`, `id` est le second terme du path, `ids` le quatrième.

- `notes` : un document représente une note d'un avatar ou d'un groupe. L'identifiant relatif `ids` est un nombre aléatoire.
- `transferts` : un document représente un transfert (upload) en cours d'un fichier d'une note d'un avatar ou d'un groupe. L'identifiant relatif `ids` est un nombre aléatoire. Un document transfert est créé immuable: il est détruit quand le transfert a été un succès ou constaté abandonné par le GC.
- `sponsorings` : un document représente un sponsoring d'un avatar. Son identifiant relatif est _ns +  hash de la phrase_ de reconnaissance entre le sponsor et son sponsorisé.
- `chats` : un chat entre 2 avatars A et B se traduit en deux documents : 
  - l'un sous-document de A a pour identifiant secondaire `ids` un hash des clés de B et A.
  - l'autre sous-document de B a pour identifiant secondaire `ids` un hash des clés de A et B.
- `membres` : un document par membre avatar participant à un groupe. L'identifiant secondaire `ids` est l'indice membre `1..N`, ordre d'enregistrement dans le groupe.
- `chatgrs`: un seul document par groupe. `id` est celui du groupe et `ids` vaut toujours `1`.
- `tickets`: un document par ticket de crédit généré par un compte A. `ids` est un nombre aléatoire tel qu'il puisse s'éditer sous forme d'un code à 6 lettres majuscules (de 1 à 308,915,776).

# L'administrateur technique
Il a pour rôle majeur de gérer les espaces:
- les créer / les détruire,
- définir leurs quotas à disposition du Comptable de chaque espace: il existe trois quotas,
  - `q1` : nombre maximal autorisé des notes, chats, participations aux groupes,
  - `q2` : volume total autorisé des fichiers attachés aux notes.
  - `qc` : quota de calcul mensuel total en unité monétaire.
- ces quotas sont _indicatifs_ sans blocage opérationnel et servent de prévention à un crash technique pour excès de consommation de ressources.

Ses autres rôles sont :
- la gestion d'une _notification / blocage_ par espace, 
  - soit pour information technique importante, 
  - soit pour _figer_ un espace avant sa migration vers un autre (ou sa destruction).
- l'export de la base d'un espace vers un autre,
- l'export des fichiers d'un espace d'un Storage à un autre.

# Comptable de chaque espace
Pour un espace, `24` par exemple, il existe un compte `2410000000000000` qui est le **Comptable** de l'espace. 

Le Comptable dispose des quotas globaux de l'espace attribués par l'administrateur technique. Il définit un certain nombre de **tranches de quotas** et confie la gestion de chacune à des comptes _délégués_ qui peuvent les distribuer aux comptes O affecté à leur tranche.

Historiquement, ci-après et dans le code, on dénomme parfois `tribu` l'ensemble des comptes O partageant une même tranche de quotas.

Le rôle principal d'un _Comptable_ est de:
- définir des tranches de quotas et d'en ajuster les quotas,
- de déclarer les _délégués_ de chaque tranche, le cas échéant de retirer ou d'ajouter la qualité de _délégué_ a un compte O.
- gérer des _notifications / blocages_ s'appliquant à des comptes spécifiques ou à tous les comptes d'une tranche.
- enregistrer les paiements des comptes A.

Le Comptable :
- ne peut pas se résilier lui-même,
- ne peut pas changer de tranche de quotas, il est rattaché à la tranche 1 de son espace qui ne peut pas être supprimée.
- ne peut pas supprimer son propre attribut _délégué_,
- accepte l'ouverture de **chats** avec n'importe quel compte qui en prend l'initiative.

## Gestion des quotas totaux par _tranches_
La déclaration d'une tranche par le Comptable d'un espace consiste à définir :
- une clé de cryptage `clet` générée aléatoirement à la création de la tranche :
  - **les 2 premiers bytes donnent l'id de la tribu**, son numéro d'ordre de création par le Comptable partant de de 1,
- un très court texte `info` signifiant pour le Comptable,
- les sous-quotas `qc q1 q2` attribués.

`clet` est immuable, `info qc q1 q2` peuvent être mis à jour par le comptable.

# Sponsoring des comptes, comptes _délégués_ d'une tranche
## Comptes O
Tout compte 0 est attaché à une _tranche_: ses quotas `qc q1 q2` sont prélevés de sa tranche.

Un compte O est créé par _sponsoring_,
- soit d'un compte O existant _délégué_ : 
- soit du Comptable qui a choisi de quelle tranche il relève.

Les comptes 0 _délégués_ peuvent:
- sponsoriser la création de nouveaux comptes O, _délégués_ eux-mêmes ou non,
- gérer la répartition des quotas entre les comptes O de leur tranche,
- gérer une _notification / blocage_ pour les comptes O de leur tranche.

## Comptes A
Un compte A est créé par _sponsoring_,
- soit par un compte A existant qui à cette occasion fait cadeau au compte sponsorisé d'un montant de son choix prélevé sur le solde monétaire du compte sponsor.
- soit par un compte O _délégué_ de sa tranche ou par le Comptable:
  - un cadeau de bienvenue de 2c est affecté au compte A sponsorisé (prélevé chez personne).

Un compta A définit lui-même ses quotas `q1` et `q2` (il les paye en tant _qu'abonnement_) et n'a pas de quotas `qc` (il paye sa _consommation_).

# Détail des tables / collections

Tous les documents, ont une propriété _data_ qui porte toutes les informations sérialisées du document.

Certaines de ces propriétés sont externalisées hors de _data_,
- soit parce que faisant partie de la clé primaire `id ids` en SQL, ou du path en Firestore,
- soit parce qu'elles sont utilisées dans des index.

**En Firestore** les documents des collections _majeures_ `tribus comptas avatars groupes versions` ont un ou deux attributs _techniques_ calculés et NON présents en _data_:
- `id_v` : un string `id/v` ou `id` est l'id sur 16 chiffres et `v` la version du document sur 9 chiffres.
- `id_vcv` pour les documents `avatars` seulement: un string `id/vcv` ou `id` est l'id sur 16 chiffres et `vcv` la version de la carte de visite de l'avatar sur 9 chiffres.

## Gestion des versions dans `versions`
- un document `avatar` d'id `ida` et les documents de ses sous collections `chats notes transferts sponsorings tickets` ont une version prise en séquence continue fixée dans le document `versions` ayant pour id `ida`.
- idem pour un document `groupe` et ses sous-collections `membres notes transferts chatgrs`.
- toute mise à jour du document maître (avatar ou groupe) et de leur sous-documents provoque l'incrémentation du numéro de version dans `versions` et l'inscription de cette valeur comme version du (sous) document mis à jour.

Un document `versions` gère :
- `v` : sa version (celle de l'avatar / groupe et leurs sous-collections).
- `dlv` : la date de fin de vie de son avatar ou groupe.
- en _data_ pour un groupe :
  - `v1 q1` : nombre de notes du groupe (actuel et maximal).
  - `v2 q2` : volume actuel et maximal des fichiers des notes du groupe.

Quand la `dlv` d'un document `versions` est inférieure à la date du jour:
- le document est en état _zombi_ : l'avatar ou le groupe a disparu.
- sa _data_ est null.
- sa version `v` ne changera plus.

## `dlv` des comptes
La `dlv` **d'un compte** désigne le dernier jour de validité du compte:
- c'est le **dernier jour d'un mois**.
- _**cas particulier**_: quand c'est le premier jour d'un mois, la `dlv` réelle est le dernier jour du mois précédent. Dans ce cas elle représente la date de fin de validité fixée par l'administrateur pour l'ensemble des comptes O. En gros il a un financement des frais d'hébergement pour les comptes de l'organisation jusqu'à cette date (par défaut la fin du siècle).

La `dlv` d'un compte est inscrite:
- dans la `comptas` du compte (par commodité),
- dans les `versions` de tous les **avatars** du compte.
- dans les `membres` représentant un de ses avatars dans les groupes.

La `dlv` d'un compte est _normalement_ de la forme `aaaammjj`.
- elle est initialement fixée à une valeur réelle calculée différemment pour un compte O ou un compte A.
- _par convention_ pour les documents `versions` des avatars,
  - elle vaut `1` pour indiquer que les données de l'avatar sont à purger par le GC.
  - elle vaut `aamm` quand le GC a purgé les documents associés à cet avatar. Ceci évite au GC de rechercher à purger des documents qui l'ont déjà été.

## `dlv` des `versions` des groupes
A sa création d'un groupe la dlv de son document versions est la fin du siècle: sa disparition n'est pas calculable.

Un groupe disparaît lorsque le dernier de ses membres actifs disparaît ce qui est constaté,
- sur demande du compte lui-même,
- par le GC lorsqu'il constate que le dernier membre _actif_ du groupe vient de passer sa `dlv`.

Afin de provoquer la purge par le GC des documents attachés au groupe sa `dlv` est par convention mise à `1`.
- elle est mise à `aamm` quand le GC a purgé les documents associés à ce groupe. Ceci évite au GC de rechercher à purger des documents qui l'ont déjà été.

## Purge par le GC des `versions` ayant une `dlv` de la forme `aamm`
Ces documents versions en état _zombi_ ont pour utilité majeure de permettre aux sessions de se resynchroniser incrémentalement en détectant que les groupes / avatars correspondant ont disparus.

Il faut donc que ces documents restent présents, bien qu'immuables et sans autre donnée / utilité que d'indiquer un avatar / groupe _disparu_ lors d'une resynchronisation.

**La constante `IDBOBS / IDBOBSGC` de `api.mjs`** donne le nombre de jours de validité d'une micro base locale IDB sans resynchronisation. Celle-ci devient **obsolète** (à supprimer avant connexion) `IDBOBS` jours après sa dernière synchronisation. Ceci s'applique à _tous_ les espaces avec la même valeur.

En conséquence le GC peut ne plus conserver les versions ayant une `dlv` de la forme `aamm` si ce mois correspond à plus de `IDBOBSGC` jours par rapport au jour du GC.

> **Remarque**: changer `IDBOBS` pour une valeur supérieure est délicat. Ça se fait en deux temps:
- augmentation de `IDBOBSGC`, la valeur prise en compte par le GC,
- attente d'un délai de N mois (la différence entre `IDBOBSGC` et `IDBOBS`) avant de positionner `IDBOBS` à la valeur `IDBOBSGC` (ou inférieure).

# Documents _synchronisables_ en session
Chaque session détient localement en mémoire le sous-ensemble des données de la portée bien délimitée qui la concerne:
- à la connexion:
  - en mode _avion_ ces données ont été obtenues depuis la base locale IDB,
  - en mode _synchronisé_ ces données ont été lus depuis la base locale IDB et mises à jour depuis le serveur,
  - en mode _incognito_ elles ont été récupérées depuis le serveur.
- en synchronisation (pas en mode avion), durant la vie de la session,
  - les mises à jour sont notifiées et récupérées du serveur,
  - en mode _synchronisé_ les mises à jour sont stockés la base locale IDB.

En base locale IDB les données ont exactement le même contenu qu'en base du serveur mais sont cryptées par la clé K du compte. 

L'état en session est conservé à niveau en _s'abonnant_ à un certain nombre de documents et de sous-collections:
- (1) les documents `avatars comptas` de l'id du compte
- (2) le document `tribus` de l'id de leur tribu, tirée de (1)
- (3) les documents `avatars` des avatars du compte - listé par (1)
- (4) les documents `groupes` des groupes dont les avatars sont membres - listés par (3)
- (5) les sous-collections `notes chats sponsorings tickets` des avatars - listés par (3)
- (6) les sous-collections `membres notes chatgrs` des groupes - listés par (4)
- (7) le document `espaces` de son espace.
- le comptable, en plus d'être abonné à sa tribu, peut temporairement s'abonner à **une** autre tribu _courante_.

Au cours d'une session au fil des synchronisations, la portée évolue depuis celle déterminée à la connexion:
- des documents ou collections de documents nouveaux sont ajoutés à IDB (et en mémoire de la session),
- des documents ou collections sont à supprimer de IDB (et de la mémoire de la session).

Une session a une liste d'ids abonnées :
- l'id de son compte : quand un document `comptas` change il est transmis à la session.
- les ids de ses `groupes` et `avatars` : quand un document `versions` ayant une de ces ids change, il est transmis à la session. La tâche de synchronisation de la session va chercher le document majeur et ses sous documents ayant des versions postérieures à celles détenues en session.
- sa `tribus` actuelle (qui peut changer).
- implicitement le document `espaces` de son espace.
- **pour le Comptable** : en plus ponctuellement une seconde `tribus` _courante_.

**Remarque :** en session l'intégrité transactionnelle est respectée pour chaque objet majeur mais pas entre objets majeurs dont les mises à jour pourraient être répercutées dans un ordre différent de celui opéré par le serveur.
- en **SQL** les notifications _auraient pu_ être regroupées par transaction et transmises dans l'ordre.
- en **FireStore** ce n'est pas possible : la session pose un écouteur sur des objets `espaces comptas tribus versions` individuellement, l'ordre d'arrivée des modifications ne peut pas être garanti entre objets majeurs.

En SQL :
- c'est le serveur qui détient la liste des abonnements de chaque session: les mises à jour transmises par WebSocket.

En Firestore :
- c'est la session qui détient la liste de ses abonnements, le serveur n'en dispose pas.
- la session pose un _écouteur_ sur chacun de ces documents.

Dans les deux cas en session, c'est la même séquence qui traite les modifications reçues, sans distinction de comment elles ont été captées (message WebSocket ou activation d'un écouteur).

# Propriétés externalisées hors de _data_
## `id` et `ids` (quand il existe)
Ces propriétés sont externalisées et font partie de la clé primaire (en SQL) ou du path (en Firestore).

Pour un `sponsorings` la propriété `ids` est le hash de la phrase de reconnaissance :
- elle est indexée.
- en Firestore l'index est `collection_group` afin de rendre un sponsorings accessible par index sans connaître son _parent_ le sponsor.

## `v` : version d'un document
Tous les documents sont _versionnés_,
- **SAUF** `gcvols fpurges transferts` qui sont créés immuables et détruits par le premier traitement qui les lit (dont le GC). Ces documents ne sont pas synchronisés en sessions UI.
- **singletons syntheses** : `v` est une date-heure et n'a qu'un rôle informatif. Ces documents ne sont pas synchronisés en sessions UI.
- **tous les autres documents ont un version de 1..n**, incrémentée de 1 à chaque mise à jour de son document, et pour `versions` de leurs sous-collections.

En session UI pour chaque document ou sous-collection d'un document, le fait de connaître sa version permet,
- de ne demander la mise à jour que des sous-documents plus récents de même `id`,
- à réception d'un row synchronisé de ne mettre à jour l'état en mémoire que s'il est effectivement plus récent que celui détenu.

## `vcv` : version de la carte de visite
Cette propriété est la version `v` du document au moment de la dernière mise à jour de la carte de visite. `vcv` est définie pour `avatars chats membres` seulement.

## `dlv` : **date limite de validité** 
Ces dates sont données en jour `aaaammjj` (UTC) et apparaissent dans : 
- (a) `versions membres` : voir ci-dessus _`dlv` d'un compte_.
- (b) `sponsorings`,
- (c) `transferts`.

**Les `dlv` sont des propriétés indexées** afin de permettre au GC de les purger.

Un document ayant une `dlv` **antérieure au jour courant** est un **zombi**, considéré comme _disparu / inexistant_ :
- en session sa réception a pour une signification de _destruction / disparition_ : il est possible de recevoir de tels avis de disparition plusieurs fois pour un même document.
- il ne changera plus de version ni d'état, son contenu est _vide_, pas de _data_ : c'est un **zombi**.

**Sur _sponsorings_:**
- jour au-delà duquel le sponsoring n'est plus applicable ni pertinent à conserver. Les sessions suppriment automatiquement à la connexion les sponsorings ayant dépassé leur `dlv` (idem pour les synchronisations).
- il y a des sponsorings avec une `dlv` dans le futur : celle-ci peut être prolongée mais jamais avancée.
- dès dépassement du jour de `dlv`, un sponsorings est purgé (du moins peut l'être).
- en Firestore l'index est `collection_group` afin de s'appliquer aux sponsorings de tous les avatars.

**Sur _transferts_:**
- **jour à partir le transfert tenté est considéré comme définitivement échoué**.
- un `transferts` est _immuable_, jamais mis à jour : il est créé, supprimé explicitement ou purgé à atteinte de sa `dlv`.
- permet au GC de détecter les transferts en échec et de nettoyer le _storage_.
- en Firestore l'index est `collection_group` afin de s'appliquer aux fichiers des notes de tous les avatars et groupe.

## `dfh` : **date de fin d'hébergement** sur un document `groupes`
La **date de fin d'hébergement** sur un groupe permet de détecter le jour où le groupe sera considéré comme disparu. 

A dépassement de la `dfh` d'un groupe, le GC fait disparaître le groupe inscrivant une `dlv` du jour précédent dans son document `versions`.

## `hpc` : hash de la phrase de contact sur un document `avatars`
Cette propriété de `avatars` est indexée de manière à pouvoir accéder à un avatar en connaissant sa phrase de contact.

## `hps1` : hash d'un extrait de la phrase secrète sur un document `comptas`
Cette propriété de `comptas` est indexée de manière à pouvoir accéder à un compte en connaissant le `hps1` issu de sa phrase secrète (connexion).

# Cache locale des `espaces comptas versions avatars groupes tribus` dans une instance d'un serveur
- les `comptas` sont utilisées à chaque changement de volume ou du nombre de notes / chats / participations aux groupes.
- les `versions` sont utilisées à chaque mise à jour des avatars, de ses chats, notes, sponsorings.
- les `avatars groupes tribus` sont également souvent accédés.

**Les conserver en cache** par leur `id` est une solution naturelle: mais en _FireStore_ (ou en SQL multi-process) il peut y avoir plusieurs instances s'exécutant en parallèle. 
- Il faut en conséquence interroger la base pour savoir s'il y a une version postérieure et ne pas la charger si ce n'est pas le cas en utilisant un filtrage par `v`. 
- Ce filtrage se faisant sur l'index n'est pas décompté comme une lecture de document quand le document n'a pas été trouvé parce que de version déjà connue.
- En Firestore l'attribut calculé `id_v` permet d'effectuer ce filtrage (alors qu'en SQL l'index composé id / v est utilisable).

La mémoire cache est gérée par LRU (tous types de documents confondus) afin de limiter sa taille en mémoire.

# Clés et identifiants
## Le hash PBKFD
Son résultat fait 32 bytes. Long à calculer, son algorithme ne le rend pas susceptible d'être accéléré pae usage de CPU graphique. Il est considéré comme incassable par force brute.

## Les clés AES
Ce sont des bytes de longueur 32. Un texte crypté a une longueur variable :
- quand le cryptage est spécifié _libre_ le premier byte du texte crypté est le numéro du _salt_ choisi au hasard dans une liste pré-compilée : un texte donné 'AAA' ne donnera donc pas le même texte crypté à chaque fois ce qui empêche de pouvoir tester l'égalité de deux textes cryptés au vu de leurs valeurs cryptées.
- quand le cryptage est _fixe_ le numéro de _salt_ est 1 : l'égalité de valeurs cryptées traduit l'égalité de leur valeurs sources.

## Un entier sur 53 bits est intègre en Javascript
Le maximum 9,007,199,254,740,991 fait 16 chiffres décimaux si le premier n'est pas 9. Il peut être issu de 6 bytes aléatoires.

Le hash (_integer_) de N bytes est un entier intègre en Javascript.

Le hash (_integer_) d'un string est un entier intègre en Javascript.

## Dates et date-heurs
Les date-heures sont exprimées en millisecondes depuis le 1/1/1970, un entier intègre en Javascript (ce serait d'ailleurs aussi le cas pour une date-heure en micro-seconde).

Les dates sont exprimées en `aaaammjj` sur un entier (géré par la class `AMJ`). En base ce sont des dates UTC, elles peuvent s'afficher en date _locale_.

## Les clé RSA 
La clé de cryptage (publique) et celle de décryptage (privée) sont de longueurs différentes. 

Le résultat d'un cryptage a une longueur fixe de 256 bytes. Deux cryptages RSA avec la même clé d'un même texte donnent deux valeurs cryptées différentes.

## Nom complet d'un avatar / groupe
Le **nom complet** d'un avatar / groupe est un couple `[nom, clé]`
- `nom` : nom lisible et signifiant, entre 6 et 20 caractères. Le nom `Comptable` est réservé. Le Comptable ne peut pas recevoir un autre nom.
- `clé` : 32 bytes aléatoires. Clé de cryptage de la carte de visite:
  - Le premier byte donne le _type_ de l'id, qu'on retrouve comme troisième chiffre de l'id :
    - 1 : comptable.
    - 2 : avatar.
    - 3 : groupe,
  - Les autres bytes sont aléatoires, sauf pour le Comptable où ils sont tous 0.
- A l'écran le nom est affiché sous la forme `nom@xyzt` (sauf `Comptable`) ou `xyzt` sont les 4 derniers chiffres de l'id.

## Clé d'une tribu
Elle a 32 bytes:
- byte 0 : 0,
- bytes 1 et 2 : numéro de la tribu, numéro d'ordre de sa déclaration par le Comptable,
- autres bytes aléatoires.

> Depuis la _clé_ d'une tribu, avatar, groupe on sait donc toujours recalculer son `id` (courte, sans `ns`).

> Une id **courte** est une id SANS les deux premiers chiffres de l'espace, donc relative à son espace.

> **Dans les noms,** les caractères `< > : " / \ | ? *` et ceux dont le code est inférieur à 32 sont interdits afin de permettre d'utiliser un nom comme nom de fichier.

# Authentification
## L'administrateur technique
Il a une phrase de connexion dont le SHA de son PBKFD (`shax`) est enregistré dans la configuration d'installation. 
- Il n'a pas d'id, ce n'est PAS un compte.
- Une opération de l'administrateur est repérée parce que son _token_ contient son `shax`.

**Les opérations liées aux créations de compte ne sont pas authentifiées**, elles vont justement enregistrer leur authentification.  
- Les opérations de GC et celles de type _ping_ ne le sont pas non plus.  
- Toutes les autres opérations le sont.

Une `sessionId` est tirée au sort par la session juste avant tentative de connexion : elle est supprimée à la déconnexion.

> **En mode SQL**, un WebSocket est ouvert et identifié par le `sessionId` qu'on retrouve sur les messages afin de s'assurer qu'un échange entre session et serveur ne concerne pas une session antérieure fermée.

> **En mode Firestore**, le serveur peut s'interrompre sans interrompre la session UI: les abonnements sont gérés dans la session UI, il n'y a pas de WebSocket et le token d'authentification permet d'identifier la session UI.

## Token
Toute opération porte un `token` portant lui-même le `sessionId`:
- si le serveur retrouve dans la mémoire cache l'enregistrement de la session `sessionId` :
  - **il en obtient l'id du compte**,
  - il prolonge la `ttl` de cette session dans cette cache.
- si le serveur ne trouve pas la `sessionId`, 
  - soit il y en bien une mais ... dans un autre process, 
  - soit c'est une déconnexion pour dépassement de `ttl` de cette session.
  - Dans les deux cas l'authentification va être refaite depuis le `token` fourni et y fixer l'id du compte.

**`token`** : sérialisation encodée en base 64 de :
- `sessionId`
- `org` : le code l'organisation qui permet au serveur de retrouver le `ns` associé.
- Pour l'administrateur technique:
  - `shax` : SHA du PBKFD de sa phrase secrète.
- Pour un compte:
  - `hps1` : hash (sur 14 chiffres) du PBKFD d'un extrait de la phrase secrète.
  - `hpsc` : hash (sur 14 chiffres) du PBKFD de la phrase secrète.

Le serveur recherche l'`id` du compte par `ns + hps1` (index de `comptas`)
- vérifie que `ns + hps1` est bien celui enregistré (indexé) dans `comptas` en `hps1`. Le ns sur les deux chiffres de tête permet de maintenir un partitionnement stricte entre espaces.
- vérifie que `hpsc` est bien celui enregistré dans `comptas`.
- inscrit en mémoire `sessionId` avec l'`id` du compte et un `ttl`.

# Sous-objet `notification`
De facto un objet _notification_ est immuable: en cas de _mise à jour_ il est remplacé par un autre.

Il est crypté selon son type par 1) la clé du Comptable, 2-3) la clé de la tribu.

Type des notifications:
- 0 : de l'espace
- 1 : d'une tribu
- 2 : d'un compte
- 3 : dépassement de quotas
- 4 : alerte de solde / consommation

Une notification a les propriétés suivantes:
- `nr`: restriction d'accès: 
  - 0 : pas de restriction
  - 1 : espace figé
  - 2 : espace clos
  - 3 : accès en lecture seule
  - 4 : accès minimal
  - 5 : actions accroissant le volume interdites.
- `dh` : date-heure de création.
- `texte`: texte de la notification.
- `idSource`: id du délégué ayant créé cette notification pour un type 3.

**Remarque:** une notification `{ dh: ... }` correspond à la suppression de la notification antérieure (ni restriction, ni texte).

Un _dépassement de quotas Q1 / Q2_ entraîne une restriction (5).

Un _solde négatif (compte A)_ ou _une consommation excessive (compte O)_ entraîne une restriction (4). 

> Le document `comptas` a une date-heure de lecture `dhvu` qui indique _quand_ le titulaire du compte a lu les notifications. Une icône peut ainsi signaler l'existence d'une _nouvelle_ notification, i.e. une notification qui n'a pas été lue.

# Documents `espaces`
_data_ :
- `id` : de l'espace de 10 à 89.
- `v` : 1..N
- `org` : code de l'organisation propriétaire.
- `opt`:
  - 0: 'Pas de comptes "autonomes"',
  - 1: 'Le Comptable peut rendre un compte "autonome" sans son accord',
  - 2: 'Le Comptable NE peut PAS rendre un compte "autonome" sans son accord',
- `dlvat` : dlv de l'administrateur technique.
- `nbmi`: nombre de mois d'inactivité acceptable pour un compte O fixé par le comptable. Ce changement n'a pas d'effet rétroactif.
- `notif` : notification de l'administrateur, cryptée par la clé du Comptable.
- `t` : numéro de _profil_ de quotas dans la table des profils définis dans la configuration. Chaque profil donne un triplet de quotas `qc q1 q2` qui serviront de guide pour le Comptable qui s'efforcera de ne pas en distribuer d'avantage sans se concerter avec l'administrateur technique.

L'administrateur technique gère une `dlvat` pour l'espace : 
- c'est la date à laquelle l'organisation l'administrateur technique détruira les comptes O. Cette information est disponible dans l'état de la session pour les comptes O (les comptes A n'étant pas intéressés).
- l'administrateur ne peut pas (re)positionner une `dlvat` à moins de M+3 du jour courant afin d'éviter les catastrophes de comptes qui deviendraient purgeables à prochaine connexion.
- par défaut, à l'initialisation elle vaut la fin du siècle.

**Le maintien en vie d'un compte O en l'absence de connexion** a le double inconvénient, 
- d'immobiliser des ressources peut-être pour rien,
- d'augmenter les coûts d'avance sur les frais d'hébergement.

Le Comptable fixe en conséquence un `nbmi` (de 3, 6, 12, 18, 24 mois) compatible avec ses contraintes mais évitant de contraindre les comptes à des connexion inutiles rien que pour maintenir le compte en vie, et surtout à éviter qu'ils n'oublient de le faire et voir leurs comptes automatiquement résiliés après un délai trop bref de non utilisation.

# Documents `gcvols`
_data_ :
- `id` : id du compte disparu.

- `cletX` : clé de la tribu cryptée par la clé K du Comptable.
- `it` : index d'enregistrement du compte dans cette tribu.

Un document `gcvols` est créé par le GC à la détection de la disparition d'un compte O, son document `versions` étant _zombi_. Il accède à son document `comptas`, et y récupère `cletX it`. Après création du `gcvols`, le document `comptas`, désormais inutile, est purgé.

Le Comptable lors de sa prochaine ouverture de session, récupère tous les `gcvols` et les traite :
- il obtient l'`id` de la tribu en décryptant `cletX`, `it` lui donne l'indice du compte O disparu dans la table `act` de cette tribu. 
- l'item `act[it]` est y détruit, ce qui de facto accroît les quotas attribuables aux autres.
- la synthèse de la tribu est mise à jour.

# Documents `tribus`
_Tribu_ est synonyme de _tranche de quotas_.

_data_:
- `id` : numéro d'ordre de création de la tribu par le Comptable.
- `v` : 1..N

- `cletX` : clé de la tribu cryptée par la clé K du comptable.
- `qc q1 q2` : quotas totaux de la tribu.
- `stn` : restriction d'accès de la notification _tribu_: _0:aucune 1:lecture seule 2:minimal_
- `notif`: notification de niveau tribu cryptée par la clé de la tribu.
- `act` : table des comptes de la tribu. L'index `it` dans cette table figure dans la propriété `it` du `comptas` correspondant :
  - `idT` : id court du compte crypté par la clé de la tribu.
  - `nasp` : si _sélégué_, `[nom, cle]` crypté par la cle de la tribu.
  - `notif`: notification de niveau compte cryptée par la clé de la tribu (`null` s'il n'y en a pas).
  - `stn` : restriction d'accès de la notification _compte_: _0:aucune 1:lecture seule 2:minimal_
  - `qc q1 q2` : quotas attribués.
  - `cj v1 v2` : consommation journalière, v1, v2: obtenus de `comptas` lors de la dernière connexion du compte, s'ils ont changé de plus de 10%. **Ce n'est donc pas un suivi en temps réel** qui imposerait une charge importante de mise à jour de `tribus / syntheses` à chaque mise à jour d'un compteur de `comptas` et des charges de synchronisation conséquente.

Un délégué (ou le Comptable) peut accéder à la liste des comptes de sa tranche : toutefois il n'a pas accès à leur carte de visite, sauf si l'avatar est connu par ailleurs, chats au moment du sponsoring ou ultérieur par phrase de contact, appartenance à un même groupe ...

L'ajout / retrait de la qualité de _délégué_ n'est effectué que par le Comptable au delà du choix fixé au sponsoring initial par un _délégué_.

# Documents `syntheses`
La mise à jour de tribu est de facto peu fréquente : une _synthèse_ est recalculée à chaque mise à jour de `stn, q1, q2` ou d'un item de `act`.

_data_:
- `id` : id de l'espace.
- `v` : date-heure d'écriture (purement informative).

- `atr` : table des synthèses des tribus de l'espace. L'indice dans cette table est l'id court de la tribu. Chaque élément est la sérialisation de:
  - `qc q1 q2` : quotas de la tribu.
  - `ac a1 a2` : sommes des quotas attribués aux comptes de la tribu.
  - `ca v1 v2` : somme des consommations journalières et des volumes effectivement utilisés.
  - `ntr0` : nombre de notifications tribu sans restriction d'accès.
  - `ntr1` : nombre de notifications tribu avec restriction d'accès _lecture seule_.
  - `ntr2` : nombre de notifications tribu avec restriction d'accès _minimal_.
  - `nbc` : nombre de comptes.
  - `nbsp` : nombre de _délégués_.
  - `nco0` : nombres de comptes ayant une notification sans restriction d'accès.
  - `nco1` : nombres de comptes ayant une notification avec restriction d'accès _lecture seule_.
  - `nco2` : nombres de comptes ayant une notification avec restriction d'accès _minimal_.

`atr[0]` est la somme des `atr[1..N]` calculé en session, pas stocké.

# Documents `comptas`
_data_ :
- `id` : numéro du compte, id de son avatar principal.
- `v` : 1..N.
- `hps1` : `ns` + hash du PBKFD d'un extrait de la phrase secrète (`hps1`).

- `hpsc`: hash du PBKFD de la phrase secrète complète (sans son `ns`).
- `kx` : clé K du compte, cryptée par le PBKFD de la phrase secrète complète.
- `dhvu` : date-heure de dernière vue des notifications par le titulaire du compte, cryptée par la clé K.
- `sp` : 1: est _délégué_ de sa tribu.
- `cletX` : clé de la tribu cryptée par la clé K du comptable.
- `cletK` : clé de la tribu cryptée par la clé K du compte : si cette clé a une longueur de 256, elle est cryptée par la _clé publique RSA_ du compte (cas de changement de tribu forcé par le comptable).
- `it` : index du compte dans la table `act` de sa tribu. **0 si c'est un compte autonome**.
- `qv` : `{qc, q1, q2, nn, nc, ng, v2}`: quotas et nombre de groupes, chats, notes, volume fichiers. Valeurs courantes.
- `credits` : pour un compte A seulement crypté par la clé K:
  - `total`: 
    - cumul des crédits reçus depuis le début de la vie du compte (ou de son dernier passage en compte A), 
    - plus les dons reçus des autres,
    - moins les dons faits aux autres.
  - `tickets`: liste des tickets (`{ids, v, dg, dr, ma, mc, refa, refc, di}`).
  - juste après une conversion de compte O en A, `credits` est égal à `true`, une convention pour une création avec 2c de bienvenue.
- `compteurs` sérialisation non cryptée des quotas, volumes et coûts.

**Pour le Comptable seulement**
-`atr` : table des tribus : `{clet, info, qc, q1, q2}` crypté par la clé K du comptable.
  - `clet` : clé de la tribu (donne aussi son id, index dans `act / astn`).
  - `info` : texte très court pour le seul usage du comptable.
  - `q` : `[qc, q1, q2]` : quotas globaux de la tribu.
- `astn` : table des restriction d'accès des notifications des tribus _0:aucune, 1:lecture seule, 2:accès minimal_.

La première tribu d'`id` 1 est la tribu _primitive_, celle du comptable et est indestructible.

**Remarques :**  
- Le document est mis à jour à minima à chaque mise à jour d'une note (`qv` et `compteurs`).
- La version `v` de `comptas` lui est spécifique, ce n'est **PAS** la version de l'avatar principal du compte.
- `cletX it` sont transmis par le GC dans un document `gcvols` pour notifier au Comptable, quel est le compte détecté disparu (donc de sa tribu).
- Le fait d'accéder à `atr` permet d'obtenir la _liste des tribus existantes_ de l'espace. Le serveur peut ainsi recalculer la statistique de l'espace (agrégation des compteurs des tribus) en scannant ces tribus.

# Documents `versions`
_data_ :
- `id` : id d'avatar / groupe
- `v` : 1..N, plus haute version attribuée aux documents de l'avatar / groupe dont leurs sous-collections.
- `dlv` : date de fin de vie.
- `{v1 q1 v2 q2}`: pour un groupe, volumes et quotas des notes.

# Documents `avatars`
_data_:
- `id` : id de l'avatar.
- `v` : 1..N.
- `vcv` : version de la carte de visite afin qu'une opération puisse détecter (sans lire le document) si la carte de visite est plus récente que celle qu'il connaît.
- `hpc` : `ns` + hash du PBKFD d'un extrait de la phrase de contact.

**Données n'existant que pour un avatar principal**
- `mck` : map des mots-clés du compte cryptée par la clé K -la clé est leur code 1-99- ("code": nom@catégorie).
- `mavk` : map des avatars du compte. 
  - _clé_ : hash de id court de l'avatar cryptée par la clé K du compte.
  - _valeur_ : couple `[nom clé]` de l'avatar crypté par la clé K du compte.
- `mpgk` : map des participations aux groupes des avatars du compte.
  - _clé_: `npgk`. hash du cryptage par la clé K du compte de `idg / idav`. Cette identification permet au serveur de supprimer une entrée de la map sans disposer de la clé K. `idg`: id courte du groupe, `idav`: id courte de l'avatar.
  - _valeur_: `{nomg, cleg, im, idav}` cryptée par la clé K.
    - `nomg`: nom du groupe,
    - `cleg`: clé du groupe,
    - `im`: indice du membre dans la table `flags / anag` du groupe.
    - `idav` : id (court) de l'avatar.
- `mcmemos` : map des couples `{mc, memo}` à propos des contacts (avatars) et groupes connus du compte:
  - _cle_: `id` crypté par la clé K du compte,
  - _valeur_ : `{ mc, memo }` crypté par la clé K du compte.
    - `mc` : mots clés du compte à propos du groupe.
    - `memo` : commentaire du compte à propos du groupe.

**Données disponibles pour tous les avatars**
- `pub` : clé publique RSA.
- `privk`: clé privée RSA cryptée par la clé K.
- `cva` : carte de visite cryptée par la clé _CV_ de l'avatar `{v, photo, info}`.
- `invits`: map des invitations en cours de l'avatar:
  - _clé_: `ni`, numéro d'invitation. hash du cryptage par la clé du groupe de la clé _inversée_ de l'avatar. Ceci permet à un animateur du groupe de détruire l'entrée.
  - _valeur_: `{nomg, cleg, im, ivpar, dh}` cryptée par la clé publique RSA de l'avatar.
    - `nomg`: nom du groupe,
    - `cleg`: clé du groupe,
    - `im`: indice du membre dans la table `flags / anag` du groupe.
    - `ivpar` : indice im de l'invitant.
    - `dh` : date-heure d'invitation. Le couple `[ivpar, dh]` permet de retrouver l'item dans le chat du groupe donnant le message de bienvenue / invitation émis par l'invitant.
- `pck` : PBKFD de la phrase de contact crypté par la clé K.
- `napc` : `[nom, cle]` de l'avatar crypté par le PBKFD de la phrase de contact.

> **Mémos d'un compte**. Un compte peut attacher une liste de mots-clés et un mémo connu de lui seul à n'importe quel avatar ou groupe de sa connaissance: ceci lui permet de filtrer des _contacts_ des _chats_ et des _groupes_ mais aussi d'y noter ce qu'il veut quelque soit le statut d'activité du contact ou du groupe.

## Cartes de visites des avatars
La création / mise à jour s'opère dans le document `avatars`.

### Mises à jour des cartes de visite des membres
- la première inscription se fait à l'ajout de l'avatar comme _contact_ du groupe.
- en session, lorsque la page listant les membres d'un groupe est ouverte, elle envoie une requête au serveur donnant la liste des couples `[id, v]` des `ids` des membres et de leur version de carte de visite détenue dans le document `membres`.
- pour chacune ayant une version postérieure, le serveur la met à jour dans `membres`.
- ceci permet de voir en session des cartes de visite toujours à jour et d'éviter d'effectuer une opération longue à chaque mise à jour des cartes de visite par un avatar pour tous les groupes dont il est membre.

### Mise à jour dans les chats
- à la mise à jour d'un chat, les cartes de visites des deux côtés sont rafraîchies si nécessaire.
- en session au début d'un processus de consultation des chats, la session fait rafraîchir incrémentalement les cartes de visite qui ne sont pas à jour dans les chats: un chat ayant `vcv` en index, la nécessité de mise à jour se détecte sur une lecture d'index sans lire le document correspondant.

## Auto-résiliation d'un compte
Elle suppose une auto-résiliation préalable de ses avatars secondaires, puis de son avatar principal:
- pour un compte O l'opération de mise à jour du document `tribus` est lancée, la session ayant connaissance de l'`id` de la tribu et de l'indice `it` de l'entrée du compte dans `act` du document  `tribus`. Le mécanisme `gcvols` n'a pas besoin d'être mis en œuvre.

## Auto-résiliation d'un avatar
Dans la même transaction :
- pour un avatar secondaire, le document `comptas` est mis à jour par suppression de son entrée dans `mavk`.
- pour un avatar principal, l'opération de mise à jour du document `tribus` est lancée, 
  - l'entrée du compte dans `act` du document `tribus` est détruite,
  - le document `comptas` est purgé.
- le document `versions` de l'avatar a sa `dlv` fixée à la veille et devient _zombi et immuable_. Ceci provoquera la purge par le GC de avatars `chats notes sponsorings transferts`.
- pour tous les chats de l'avatar:
  - le chat E, de _l'autre_, est mis à jour: son `st` passe à _disparu_, sa `cva` passe à null.
- pour tous les groupes dont l'avatar est membre:
  - purge de son document `membres`.
  - mise à jour dans son document `groupes` du statut `ast` à _disparu_.
  - si c'était l'hébergeur du groupe, mise à jour des données de fin d'hébergement.
  - si c'était le dernier membre _actif_ du groupe:
    - dans le document `versions` du groupe, `dlv` est fixée à la veille et devient _zombi / immuable_, ce qui permet à une synchronisation avec une autre session (ou une connexion) de détecter la disparition du groupe.

Dans les autres sessions ouvertes sur le même compte :
- si c'est l'avatar principal, la session, 
  - est notifiée par un changement du document `tribus` (la disparition de `comptas` n'est pas notifiée -c'est une purge-).
  - constate dans le document `tribus` la disparition de l'entrée du compte par comparaison avec l'état connu antérieurement,
  - **la session est close** SANS mise à jour de la base IDB (les connexions en mode _avion_ restent possibles). 
- si c'est un avatar secondaire, la session,
  - est notifiée d'un changement du document `comptas` et détecte la suppression d'un avatar.
  - en mémoire ce qui est relatif à cet avatar : si c'était l'avatar courant, l'avatar primaire devient courant.
  - supprime toutes les entrées de IDB relatives à l'avatar.

Lors des futures connexions sur le même compte:
- si le compte n'existe plus la connexion ne peut pas avoir lieu en _synchronisé ou incognito_.
- en mode _synchronisé_ les avatars et groupes qui étaient en IDB et ne sont plus existants sont purgés de IDB.

Dans les autres sessions ouvertes sur d'autres comptes, la synchronisation fait apparaître:
- par `tribus` : un compte qui disparaît dans `tribus` entre l'état courant et le nouvel état,
- par `chats` : un statut _disparu_ et une carte de visite absente,
- par `versions` _zombi_ des groupes : détection des groupes disparus, ce qui entraîne aussi la suppression des documents `membres` correspondant en mémoire (et en IDB).

# Documents `tickets`
Ce sont des sous-documents de `avatars` qui n'existent **que** pour l'avatar principal du Comptable.

Il y a un document `tickets` par ticket de crédit généré par un compte A annonçant l'arrivée d'un paiement correspondant. Chaque ticket est dédoublé:
- un exemplaire dans la sous-collection `tickets` du Comptable,
- un exemplaire dans le documents `comptas` du compte A qui l'a généré, dans la liste `credits.tickets`, cryptée par la clé K du compte A.

_data_:
- `id`: id du Comptable.
- `ids` : numéro du ticket
- `v` : version du ticket.

- `dg` : date de génération.
- `dr`: date de réception. Si 0 le ticket est _en attente_.
- `ma`: montant déclaré émis par le compte A.
- `mc` : montant déclaré reçu par le Comptable.
- `refa` : texte court (32c) facultatif du compte A à l'émission.
- `refc` : texte court (32c) facultatif du Comptable à la réception.
- `di`: date d'incorporation du crédit par le compte A dans son solde.

## Cycle de vie
#### Génération d'un ticket (annonce de paiement) par le compte A
- le compte A déclare,
  - un montant `ma` celui qu'il affirme avoir payé / viré.
  - une référence `refa` textuelle libre facultative à un dossier de _litige_, typiquement un _avoir_ correspondant à une erreur d'enregistrement antérieure.
- le ticket est généré et enregistré en deux exemplaires.

#### Effacement d'un de ses tickets par le compte A
En cas d'erreur, un ticket peut être effacé par son émetteur, _à condition_ d'être toujours _en attente_ (ne pas avoir de date de réception). Le ticket est physiquement effacé de `tickets` et de la liste `comptas.tickets`.

#### Réception d'un paiement par le Comptable
- le Comptable ne peut _que_ compléter un ticket _en attente_ (pas de date de réception) **dans le mois d'émission du ticket ou les deux précédents**. Au delà le ticket est _auto-détruit_.
- sur le ticket correspondant le Comptable peut remplir:
  - le montant `mc` du paiement reçu, sauf indication contraire par défaut égal au montant `ma`.
  - une référence textuelle libre `refc` justifiant une différence entre `ma` et `mc`. Ce peut être un numéro de dossier de _litige_ qui pourra être repris ensuite entre le compte A et le Comptable.
- la date de réception `dr` est inscrite, le ticket est _réceptionné_.
- le ticket est mis à jour dans `tickets` mais PAS dans la liste `comptas.credits.tickets` du compte A (le Comptable n'a pas la clé K du compte A).

#### Lorsque le compte A va sur sa page de gestion de ses crédits
- les tickets dont il possède une version plus ancienne que celle détenue dans tickets du Comptable sont mis à jour.
- les tickets émis un mois M toujours non réceptionnés avant la fin de M+2 sont supprimés.
- les tickets de plus de 2 ans sont supprimés au cas où le GC ne les aurait pas déjà supprimés lors d'un archivage mensuel. 

#### Incorporation du crédit dans le solde du compte A
- l'opération est automatique à la prochaine connexion du compte A postérieure à une _réception de paiement_. En cours de session, un bouton permet d'activer cette incorporation.
- elle consiste à intégrer au solde du compte le montant d'un ticket _réceptionné_ (mais pas encore _incorporé au solde_)
- le plus faible des deux montants `ma` et `mc` est incorporé au solde de `comptas.credits`. En cas de différence de montants, une alerte s'affiche.
- la date d'incorporation `di` est mise à jour dans l'exemplaire du compte mais PAS par dans `tickets` du Comptable (qui donc ignore la propriété `di`).

**Remarques:**
- de facto dans `tickets` un document ne peut avoir qu'au plus deux versions.
- la version de création qui créé le ticket et lui donne son identifiant secondaire et inscrit les propriétés `ma` et éventuellement `refa` désormais immuables.
- la version de réception par le Comptable qui inscrit les propriétés `dr mc` et éventuellement `refc`. Le ticket devient immuable dans `tickets`.
- les propriétés sont toutes immuables.
- la mise à jour ultime qui inscrit `di` à titre documentaire ne concerne que l'exemplaire du compte A.

#### Listes disponibles en session
Un compte A dispose de la liste de ses tickets sur une période de 2 ans, quelque soit leur statut, y compris ceux obsolètes parce que non réceptionnés avant fin M+2 de leur génération.

Le Comptable dispose en session de la liste des tickets détenus dans tickets. Cette liste est _synchronisée_ (comme pour tous les sous-documents).

#### Arrêtés mensuels
Le GC effectue des arrêtés mensuels consultables par le Comptable et l'administrateur technique. Chaque arrêté mensuel,
- récupère tous les tickets générés à M-3 et les efface de la liste `tickets`,
- les stocke dans un _fichier_ **CSV** crypté dans le fichier `T_202407` du Comptable.

Pour rechercher un ticket particulier, par exemple pour traiter un _litige_ ou vérifier s'il a bien été réceptionné, le Comptable,
- dispose de l'information en ligne pour tout ticket de M M-1 M-2,
- dans le cas contraire, ouvre l'arrêté mensuel correspondant au mois du ticket cherché qui est un fichier CSV basique (crypté dans le storage).

#### Numérotation des tickets
L'ids d'un ticket est un entier de la forme : `aammrrrrrrrrrr`
- `aa` : année de génération,
- `mm` : mois de génération,
- `r...r` : aléatoire.

Un code à 6 lettres majuscules en est extrait afin de le joindre comme référence de _paiement_.
- la première lettre  donne le mois de génération du ticket : A-L pour les mois de janvier à décembre si l'année est paire et M-X pour les mois de janvier à décembre si l'année est impaire.
- les autres lettres correspondent à `r...r`.

Le Comptable sait ainsi dans quel _arrêté mensuel_ il doit chercher un ticket au delà de M+2 de sa date de génération à partir d'un code à 6 lettres désigné par un compte pour audit éventuel de l'enregistrement.

> **Personne, pas même le Comptable,** ne peut savoir quel compte A a généré quel ticket. Cette information n'est accessible qu'au compte A lui-même et est cryptée par sa clé K.

# Documents `chats`
Un chat est une suite d'items de texte communs à deux avatars I et E:
- vis à vis d'une session :
  - I est l'avatar _interne_,
  - E est un avatar _externe_ connu comme _contact_.
- un item est défini par :
  - le côté qui l'a écrit (I ou E),
  - sa date-heure d'écriture qui l'identifie pour son côté,
  - son texte crypté par une clé de cryptage connue seulement par I et E.

Un chat est dédoublé avec un exemplaire I et un exemplaire E:
- à son écriture, un item est ajouté des deux côtés.
- le texte d'un item écrit par I peut être effacé par I des deux côtés (mais pas modifié).
- I (resp. E) **peut effacer tous les items** I comme E de son côté: ceci n'impacte pas l'existence de ceux de l'autre côté.
- _de chaque côté_ la taille totale des textes de tous les items est limitée à 5000c. Les plus anciens items sont effacés afin de respecter cette limite.

Pour ajouter un item sur un chat, I doit connaître le `[nom, cle]` de E : membre du même groupe, chat avec un autre avatar du compte, ou obtenu en ayant fourni la phrase de contact de E.

## Clé d'un chat
La clé du chat `cc` a été générée à la création du chat avec l'ajout du premier item:
- côté I, cryptée par la clé K de I,
- côté E, cryptée par la clé publique de E. Dans ce cas à la première écriture de E celle-ci sera ré-encryptée par la clé K de E.

## Décompte des nombres de chats par compte
- un chat est compté pour 1 pour I quand la dernière opération qu'il a effectué est un ajout: si cette dernière opération est un _raz_, le chat est dit _passif_ et compte pour 0.
- ce principe de gestion évite de pénaliser ceux qui reçoivent des chats non sollicités et qui les _effacent_.

## Auto-résiliation / disparition de E
Quand son avatar E s'est auto-résilié, son document `versions` devient _zombi_. Son document `chats` a été détruit.

S'étant adressé à E, I a récupéré que E était détruit. 
- si le chat I était _passif_, le chat de I devient _zombi_ afin que cet état se propage aux autres sessions du compte et soit détecté en connexion (le _contact_ disparaît).
- sinon, le statut `st E` passe à 2. I conserve le dernier état de l'échange, mais,
  - il ne pourra plus le changer,
  - il ne pourra qu'effectuer un _raz_, ce qui rendra le chat _zombi_: de facto E n'écrira plus dessus et ça ne sert à rien d'écrire à un _disparu_.

Quand I a fait rafraîchir les cartes de visite dans sa session, ça lui retourne l'information de la disparition éventuelle de son _contact_.

## _data_ d'un chat
L'`id` d'un exemplaire d'un chat est le couple `id, ids`.

_data_ (de l'exemplaire I):
- `id`: id de A,
- `ids`: hash du cryptage de `idI_court/idE_court` par la clé de I.
- `v`: 1..N.
- `vcv` : version de la carte de visite de E.

- `st` : deux chiffres `I E`
  - I : 0:passif, 1:actif
  - E : 0:passif, 1:actif, 2:disparu
- `cva` : `{v, photo, info}` carte de visite de E au moment de la création / dernière mise à jour du chat, cryptée par la clé de E.
- `cc` : clé `cc` du chat cryptée par la clé K du compte de I ou par la clé publique de I (quand le chat vient d'être créé par E).
- `nacc` : `[nom, cle]` de E crypté par la clé du chat.
- `items` : liste des items `[{a, dh, l t}]`
  - `a` : 0:écrit par I, 1: écrit par E
  - `dh` : date-heure d'écriture.
  - `dhx` : date-heure de suppression.
  - `l` : taille du texte.
  - `t` : texte crypté par la clé du chat (vide s'il a été supprimé).

## Actions possibles (par I)
- _ajout d'un item_
  - si le chat n'existait pas, 
    - il est créé avec ce premier item dans `items`.
    - le nombre de chats dans `comptas.qv.nc` est incrémenté.
    - `st` de I vaut `10` et `st` de E vaut `01`.
  - l'item apparaît dans `items` de E (son `a` est inversé).
- _effacement du texte d'un item de I_
  - le texte de l'item est effacé des deux côtés.
  - il n'est pas possible pour I d'effacer le texte d'un item écrit par E.
- _raz_ : effacement total de l'historique des items (du côté I)
  - `items` est vidée du côté I.
  - `st` de I vaut `01` et `st` de E vaut `10` ou `00`.
  - le chat est dit _passif_ du côté I et ne redeviendra _actif_ qu'au prochain ajout d'un item par I.

> Un chat _passif_ pour un avatar est un chat _écouté_, les items écrits par E arrivent, mais sur lequel I n'écrit pas. Il redevient _actif_ pour I dès que I écrit un item et ne redevient _passif_ que quand il fait un _raz_.

## Établir un _contact direct_ entre A et B
Supposons que B veuille ouvrir un chat avec A mais ne l'a pas en _contact_, n'en connaît pas le nom / clé.

A peut avoir communiqué à B sa _phrase de contact_ qui ne peut être enregistrée par A que si elle est, non seulement unique, mais aussi _pas trop proche_ d'une phrase de contact déjà déclarée.

B peut écrire un chat à A à condition de fournir cette _phrase de contact_:
- l'avatar A a mis à disposition son nom complet `[nom, cle]` crypté par le PBKFD de la phrase de contact.
- muni de ces informations, B peut écrire un chat à A qui fait désormais partie de ses contacts (et réciproquement une fois le chat de B reçu par A).
- le chat comportant le `[nom cle]` de B, A est en mesure d'écrire sur ce chat, même s'il ignorait auparavant le nom complet de B.

## Comptes A : dons par chat
Un compte A _donateur_ peut faire un don à un autre compte A _bénéficiaire_ en utilisant un chat:
- le montant du don est dans une liste préétablie.
- le crédit total du donateur (dans sa `comptas`) doit être supérieur au montant du don.
- sauf spécification contraire du donateur, le texte de l'item ajouté à cette occasion mentionne le montant du don.
- le donateur est immédiatement débité.
- le bénéficiaire reçoit dans sa `comptas` un item avec le montant du don crypté par sa clé publique. En effet le `credits` est crypté par la clé K de son compte, la session du donateur ne peut pas intégrer ce don pour le bénéficiaire.

Quand le bénéficiaire se connecte, ou par synchronisation s'il a une session connectée, le montant du don est intégré à son `comptas.credits.total`.

# Documents `sponsorings`
P est le parrain-sponsor, F est le filleul-sponsorisé.

_data_:
- `id` : id de l'avatar sponsor.
- `ids` : `ns` + hash du PBKFD de la phrase réduite de parrainage, 
- `v`: 1..N.
- `dlv` : date limite de validité

- `st` : statut. _0: en attente réponse, 1: refusé, 2: accepté, 3: détruit / annulé_
- `pspk` : texte de la phrase de sponsoring cryptée par la clé K du sponsor.
- `bpspk` : PBKFD de la phrase de sponsoring cryptée par la clé K du sponsor.
- `dh`: date-heure du dernier changement d'état.
- `descr` : crypté par le PBKFD de la phrase de sponsoring:
  - `na` : `[nom, cle]` de P.
  - `cv` : `{ v, photo, info }` de P.
  - `naf` : `[nom, cle]` attribué au filleul.
  - `sp` : vrai si le filleul est lui-même _délégué_.
  - `clet` : clé de sa tribu, si c'est un compte O
  - `quotas` : `[qc, q1, q2]` quotas attribués par le sponsor.
    - pour un compte A `[0, 1, 1]`. Un compte A n'a pas de qc et peut changer à loisir `[q1, q2]` qui sont des protections pour lui-même (et fixe le coût de l'abonnement).
  - `don` : pour un compte autonome, montant du don.
  - `dconf` : le sponsor a demandé à rester confidentiel. Si oui, aucun chat ne sera créé à l'acceptation du sponsoring.
- `ardx` : ardoise de bienvenue du sponsor / réponse du filleul cryptée par le PBKFD de la phrase de sponsoring

**Remarques**
- la `dlv` d'un sponsoring peut être prolongée (jamais rapprochée). Le sponsoring est purgé par le GC quotidien à cette date, en session et sur le serveur, les documents ayant atteint cette limite sont supprimés et ne sont pas traités.
- Le sponsor peut annuler son `sponsoring` avant acceptation, en cas de remord son statut passe à 3.

**Si le filleul refuse le sponsoring :** 
- Il écrit dans `ardx` la raison de son refus et met le statut du `sponsorings` à 1.

**Si le filleul ne fait rien à temps :** 
- `sponsorings` finit par être purgé par `dlv`.

**Si le filleul accepte le sponsoring :** 
- Le filleul crée son compte / avatar principal: `naf` donne l'id de son avatar et son nom. Pour un compte O, l'identifiant de la tribu pour le compte sont obtenu de `clet`.
- la `comptas` du filleul est créée et créditée des quotas attribués par le parrain pour un compte O et du minimum pour un compte A.
- pour un compte O la `tribus` est mise à jour (quotas attribués), le filleul est mis dans la liste des comptes `act` de `tribus`.
- un mot de remerciement est écrit par le filleul au parrain sur `ardx` **ET** ceci est dédoublé dans un chat filleul / sponsor créé à ce moment et comportant l'item de réponse et l'item du sponsor.
  - pour un compte sponsorisé autonome si le sponsor ou le sponsorisé ont requis la confidentialité, le chat n'est pas créé: rien ne reliera les deux comptes.
- le statut du `sponsoring` est 2.

# Documents `notes`
La clé de cryptage `cles` d'une note est selon le cas :
- *note personnelle d'un avatar A* : la clé K de l'avatar.
- *note d'un groupe G* : la clé du groupe G.

Pour une note de groupe, le droit de mise à jour d'une note d'un groupe est contrôlé par `im` qui indique quel membre (son `im`) a l'exclusivité d'écriture (sinon tous).

_data_:
- `id` : id de l'avatar ou du groupe.
- `ids` : identifiant relatif à son avatar.
- `v` : 1..N.

- `im` : exclusivité dans un groupe. L'écriture est restreinte au membre du groupe dont `im` est `ids`. 
- `v2` : volume total des fichiers attachés.
- `mc` :
  - note personnelle : vecteur des index de mots clés.
  - note de groupe : map sérialisée,
    - _clé_ : `hgc` du compte de l'auteur (1 pour les mots clés du groupe),
    - _valeur_ : vecteur des index des mots clés attribués par le membre.
- `l` : liste des _auteurs_ (leurs `im`) pour une note de groupe.
- `txts` : crypté par la clé de la note.
  - `d` : date-heure de dernière modification du texte.
  - `t` : texte gzippé ou non.
- `mfas` : map des fichiers attachés.
- `refs` : triplet `[id_court, ids, nomp]` crypté par la clé de la note, référence de sa  note _parent_.

**_Remarque :_** une note peut être explicitement supprimée. Afin de synchroniser cette forme particulière de mise à jour le document est conservé _zombi_ (sa _data_ est null). La note sera purgée avec son avatar / groupe.

## Mots clés `mc`
- Note personnelle : `mc` est un vecteur d'index de mots clés. Les index sont ceux du compte et de l'organisation.
- Note de groupe : `mc` est une map :
  - _clé_ : `hgc` du compte de l'auteur (1 pour les mots clés du groupe). `hgc` est le hash du cryptage de l'id du groupe par la clé K du compte. Ainsi tous ls avatars du même compte partagent les mêmes mots clés. 
  - _valeur_ : vecteur d'index des mots clés. Les index sont ceux personnels du compte du membre, ceux du groupe, ceux de l'organisation.

## Map des fichiers attachés
- _clé_ `idf`: numéro aléatoire généré à la création. L'identifiant _externe_ est `id_court` du groupe / avatar, `idf`
- _valeur_ : `{ nom, info, dh, type, gz, lg, sha }` crypté par la clé S de la note.

**Identifiant de stockage :** `org/id_court/idf`
- `org` : code de l'organisation.
- `id_court` : id _court_ de l'avatar / groupe auquel la note appartient.
- `idf` : identifiant aléatoire du fichier.

En imaginant un stockage sur file-system,
- l'application a un répertoire racine par espace portant le code de l'organisation,
- il y un répertoire par avatar / groupe ayant des notes ayant des fichiers attachés,
- pour chacun, un fichier par fichier attaché.

_Un nouveau fichier attaché_ est stocké sur support externe **avant** d'être enregistré dans son document `notes`. Ceci est noté dans un document `transferts`. 
Les fichiers créés par anticipation et non validés dans un document `notes` comme ceux qui n'y ont pas été supprimés après validation de la note, sont retrouvés par le GC.

La purge d'un avatar / groupe s'accompagne de la suppression de son _répertoire_. 

La suppression d'une note s'accompagne de la suppressions de N fichiers dans un seul _répertoire_.

## Note rattachée à une autre
Le rattachement d'une note à une autre permet de définir un arbre des notes.
- une note d'un avatar A1 peut être rattachée:
  - soit à la racine A1, en fait elle n'est pas rattachée,
  - soit à une autre note de A1,
  - soit à une note de groupe: A1 peut ainsi commenter des notes d'un groupe par des notes qu'il sera seul à voir.
- une note d'un groupe G1 ne peut être rattachée qu'à une autre note du même groupe.

Les cycles (N1 rattachée à N2 rattachée à N3 rattachée à N1 par exemple) sont interdits et bloqués.

# Documents `transferts`
_data_:
- `id` : id du groupe ou de l'avatar du note.
- `ids` : `idf` du fichier en cours de chargement.
- `dlv` : date-limite de validité pour nettoyer les uploads en échec sans les confondre avec ceux en cours.

# Documents `groupes`
Un groupe est caractérisé par :
- son entête : un document `groupes`.
- la liste de ses membres : des documents `membres` de sa sous-collection `membres`.

## Membres d'un groupe: identifications [id, im] nag ni 
- **`im / ids`**: un membre est créé en étant déclaré _contact_ du groupe par un animateur ce qui lui affecte un _indice membre_ de 1 à N, attribué dans l'ordre d'inscription et sans réattribution (sauf cas particulier). Pour un groupe `id`, un membre est identifié par le couple `id / ids` (où `ids` est l'indice membre `im`). Le premier membre est celui du créateur du groupe et a pour indice 1.
  - le statut de chaque membre d'index `im` est stocké dans `flags[im]`.
- **`nag`** : numéro d'avatar dans le groupe. Hash du cryptage par la clé du groupe de la clé de l'avatar.
  - un même avatar peut avoir plus d'une vie dans un groupe, y être actif, redevenir simple contact, y être à nouveau invité puis actif ... Afin qu'il conserve toujours le même indice au cours de ses _vies_ successives, on mémorise son `nag` dans la table `anag` du groupe.
  - c'est aussi utile pour empêcher d'avoir à un instant donné deux membres avec deux indices différents pour le même avatar.
- **`ni`** : numéro d'invitation. hash du cryptage par la clé du groupe de la clé _inversée_ de l'avatar invité. Ce numéro permet à un animateur d'annuler une invitation faite et pas encore acceptée ou refusée.
- `npgk` : numéro de participation à un groupe: hash du cryptage par la clé K du compte de `idg / idav`. Ce numéro est la clé du membre dans la map `mpgk` de `comptas` du compte.

## États _contact / actif / inconnu_
### Inconnu
Un membre _inconnu_ est un _ex membre_ qui a eu une existence et qui :
- soit a _disparu_. Le GC a détecté son absence.
- soit a fait l'objet d'une demande _d'oubli_ par le compte lui-même et dans certains cas par un animateur.
- il a un indice `im` :
  - `flags[im]` est à 0.
  - `anag[im]` est par convention,
    - à `1` s'il a été _actif_ : ceci prévient la réutilisation de l'indice im;
    - à `0` s'il n'a jamais été actif ce qui permet de réutiliser l'indice.
- il n'a plus de sous-documents `membres`, dans le groupe on ne connaît plus, ni son nom, ni l'id de son avatar, ni son identifiant `nag` dans le groupe.

### Contact
Quand um membre est un _contact_:
- il a un indice `im` et des flags associés.
- il a un document `membres` identifié par `[idg, im]` qui va donner son nom et la clé de sa carte de visite.
- il est connu dans `groupes` par son `nag` dans la table `anag` à l'indice `im`.
- **son compte ne le connaît pas**, il n'a pas le groupe dans sa liste de groupes `mpgk` (du moins au titre de cet avatar),
- la `dlv` de son `membres` est `20991231` (non significative),
- sa disparition n'est constatée incidemment que quand un membre actif fait rafraîchir les cartes de visites des membres du groupe et découvre à cette occasion qu'il a disparu.
- un _contact_ peut avoir une _invitation_ en cours déclarée par un animateur (ou tous):
  - son avatar connaît cette invitation qui est stockée dans la map `invits` du row `avatars`.
  - une invitation n'a pas de date limite de validité.
  - une invitation peut être annulée par un animateur ou l'avatar invité lui-même.

### Actif
Quand un membre est _actif_:
- son indice `im`, son document `membres` et son `nag` sont ceux qu'il avait quand il était _contact_.
- **son compte le connaît**, son compte a le groupe dans sa liste de groupes `mpgk`,
- le compte peut décider de redevenir _contact_, voire d'être _oublié_ du groupe (et devenir _inconnu_).
- un animateur peut supprimer tous les droits d'un membre _actif_ mais il reste _actif_ (bien que très _passif_ par la force des choses).
- son document `membres` est signé à chaque connexion du compte de son avatar: sa `dlv` lui garantit d'être considéré comme vivant.

> Remarques:
> - Un membre ne devient _actif_ que quand son compte a explicitement **validé une invitation** déclarée par un animateur (ou tous).
> - Un membre _actif_ ne redevient _contact_ que quand lui-même l'a décidé.

### Table `anag` du groupe
Par convention si `anag[im]` vaut 0, c'est que l'indice `im` est _libre_.

Le `nag`, numéro d'avatar dans le groupe (hash du cryptage par la clé du groupe de la clé de l'avatar),
- est inscrit à la première déclaration de l'avatar comme contact.
- est effacé quand le membre est détecté disparu ou a été oublié.

Pour un indice `im` cette table donne:
- le `nag` du membre correspondant s'il est connu (_contact_ ou _actif_).
- `1` si le membre est _inconnu_.

### `im` attribués ou libres
La règle générale est de ne pas libérer un `im` pour un futur autre membre quand un membre disparaît ou est oublié. Cet indice peut apparaître,
- dans la liste des auteurs d'une note, la ré-attribution pourrait porter à confusion sur l'auteur d'une note.
- dans la liste des participations à un groupe d'un compte (`mpgk`).

L'exception est _libérer_ un `im` à l'occasion d'un _oubli_ ou d'une _disparition_ quand **le membre n'a jamais été actif**: son `im` n'a pas pu être référencé ailleurs.

### Table `flags`
Chaque membre d'indice `im` a des flags dans le groupe `flags[im]`

Plusieurs _flags_ précisent le statut d'un membre:
- [AC] **est _actif_**
- [IN] **a une invitation en cours**
- [AN] **a accès aux notes**: un membre _actif_ décide s'il souhaite ou non accéder aux notes (il faut qu'il en ait le _droit_): un non accès allège sa session.
- [AM] **a accès aux membres**: un membre _actif_ décide s'il souhaite ou non accéder aux autres membres (il faut qu'il en ait le _droit_): un non accès allège sa session.

- _droits_ : initialement positionnés (ou non) à l'occasion de la première invitation, ces flags n'ont d'effet que quand le membre est actif. Un animateur peut les changer.
  - [DM] **d'accès à la liste des membres**.
  - [DN] **d'accès aux notes du groupe**.
  - [DE] **d'écriture sur les notes du groupe**.
  - [PA] **d'animer le groupe**. 
  - _Remarque_: un animateur sans droit d'accès aux notes peut déclarer une invitation et être hébergeur.

- _historique_
  - [HA] **a, un jour, été actif**
  - [HN] **avec accès aux notes**
  - [HM] **avec accès aux membres**
  - [HE] **avec possibilité d'écrire une note**

### Un membre _peut_ avoir plusieurs périodes d'activité
- il a été créé comme _contact_ puis a été invité et son invitation validée: il est _actif_.
- il peut demander à redevenir _simple contact_ : il n'accède plus ni aux notes ni aux autres membres, n'est plus hébergeur et souhaite ne plus voir ce groupe _inutile_ apparaître dans sa liste des groupes.
- en tant que _contact_ il peut être ré-invité, sauf s'il s'est inscrit dans la liste noire des avatars à ne pas ré-inviter. Puis il peut valider son invitation et commencer ainsi une nouvelle période d'activité.
- les flags _historiques_ permettent ainsi de savoir, si le membre a un jour été actif et s'il a pu avoir accès à la liste des membres, a eu accès aux notes et a pu en écrire.

### Disparition versus oubli
Dans les deux cas ses `flags` sont à 0.

**La _disparition_** correspond au fait que l'avatar du membre n'existe plus, soit à sa demande, soit par détection du GC. Par principe même l'avatar ne ré-apparaîtra plus dans le groupe:
- son row `membres` est purgé.
- son `nag` est mis à `1`, ou `0` si son `im` n'a jamais été _actif_.

**Un _oubli_** est explicitement demandé:
- soit par le membre lui-même quand il est actif,
- soit par un animateur quand il est _contact_ et en particulier à l'occasion de l'annulation de son invitation.
- son document `membres` est purgé.
- son `nag` est mis à `1` ou `0` si son `im` n'a jamais été _actif_.

Après un _oubli_ si l'avatar est de nouveau inscrit comme _contact_, il récupère un nouvel indice #35 par exemple et un nouveau document `membres`, son historique de dates d'invitation, début et fin d'activité sont initialisées. C'est une nouvelle vie dans le groupe. Les notes écrites dans la vie antérieure mentionnent toujours l'ancien `im` #12 que rien ne permet de corréler à #35.

### Listes `lna / lnc`: _listes noires des avatars ne pas (ré) inviter_
Elles listent les `nag` des avatars qui ne devront plus être invités / ré-invités. Elle est alimentée:
- par un animateur dans `lna`.
- par l'avatar lui-même dans `lnc`.

## Modes d'invitation
- _simple_ : dans ce mode (par défaut) un _contact_ du groupe peut-être invité par **UN** animateur (un seul suffit).
- _unanime_ : dans ce mode il faut que **TOUS** les animateurs aient validé l'invitation (le dernier ayant validé provoquant l'invitation).
- pour passer en mode _unanime_ il suffit qu'un seul animateur le demande.
- pour revenir au mode _simple_ depuis le mode _unanime_, il faut que **TOUS** les animateurs aient validé ce retour.

Une invitation est enregistrée dans la map `invits` de l'avatar invité:
- _clé_: `ni`, numéro d'invitation.
- _valeur_: `{nomg, cleg, im}` cryptée par la clé publique RSA de l'avatar.
  - `nomg`: nom du groupe,
  - `cleg`: clé du groupe,
  - `im`: indice du membre dans la table ast du groupe.

Sauf en mode _avion_, le serveur peut délivrer une _fiche d'invitation_ donnant pour une invitation donnée,
- la carte de visite du groupe,
- les cartes de visite et noms du ou des animateurs ayant lancé l'invitation.

## Hébergement par un membre _actif_
L'hébergement d'un groupe est noté par :
- `imh`: indice membre de l'avatar hébergeur. 
- `idhg` : id du **compte** hébergeur crypté par la clé du groupe.
- `dfh`: date de fin d'hébergement qui vaut 0 tant que le groupe est hébergé. Les notes ne peuvent plus être mises à jour _en croissance_ quand `dfh` existe.

### Prise d'hébergement
- en l'absence d'hébergeur, c'est possible pour,
  - tout animateur,
  - en l'absence d'animateur: tout actif ayant le droit d'écriture, puis tout actif ayant accès aux notes, puis tout actif.
- s'il y a déjà un hébergeur, seul un animateur peut se substituer à condition que le nombre de notes et le V2 actuels ne le mette pas en dépassement de son abonnement.

### Fin d'hébergement par l'hébergeur
- `dfh` est mise la date du jour + 90 jours.
- le nombre de notes et le volume V2 de `comptas` sont décrémentés de ceux du groupe.

## Actions du GC à `dfh`, destruction du groupe
- le groupe peut avoir des contacts et des actifs mais pas d'hébergeur.
- il met le `versions` du groupe en _zombi_ (`dlv` à la veille de la date du jour).
  - au fil des connexions et des synchronisations, ceci provoquera le retrait du groupe des maps `mpgk` des comptes qui le référencent (ce qui peut prendre jusqu'à un an).
  - les invitations _pendantes_ tomberont lorsqu'elles seront acceptées ou refusées par l'avatar invité.
- les documents `groupe notes membres` sont purgés par le GC.
  
## Fin d'hébergement suite à détection par le GC de la disparition de l'avatar hébergeur
- c'est le fait que la `dlv` dans `membres` est dépassée qui signale que l'avatar a disparu. 
- dans le document `groupes`:
  - `dfh` est mise la date du jour + 90 jours.
  - `imh idhg` sont mis à 0 / null

## Data
_data_:
- `id` : id du groupe.
- `v` :  1..N, version du groupe de ses notes et membres.
- `dfh` : date de fin d'hébergement.

- `idhg` : id du compte hébergeur crypté par la clé du groupe.
- `imh` : indice `im` du membre dont le compte est hébergeur.
- `msu` : mode _simple_ ou _unanime_.
  - `null` : mode simple.
  - `[ids]` : mode unanime : liste des indices des animateurs ayant voté pour le retour au mode simple. La liste peut être vide mais existe.
- `flags` : table des flags des membres (12 bits sur un entier).
- `anag` : table des nag des membres.
- `lna` : liste noire _animateurs_ des `nag` des avatars à ne pas inviter / ré-inviter.
- `lnc` : liste noire _comptes_ des `nag` des avatars à ne pas inviter / ré-inviter.
- `mcg` : liste des mots clés définis pour le groupe cryptée par la clé du groupe.
- `cvg` : carte de visite du groupe cryptée par la clé du groupe `{v, photo, info}`.

## Décompte des participations à des groupes d'un compte
- quand un avatar a accepté une invitation, il devient _actif_ et a une nouvelle entrée dans la liste des participations aux groupes (`mpgk`) dans l'avatar principal de son compte.
- quand l'avatar décide de tomber dans l'oubli ou de redevenir simple contact, cette entrée est supprimée.
- le _nombre de participations aux groupes_ dans `compas.qv.ng` du compte est le nombre total de ces entrées dans `mpgk`.
- la disparition d'un groupe détectée en session (synchro ou connexion) par son `versions` devenu _zombi_, provoque la disparition de son ou ses entrées dans `mpgk` et la décroissance correspondante de `qv.ng` (nombre de participations aux groupes).

# Documents `membres`
Un document `membres` est créé à la déclaration d'un avatar comme _contact_ avec une dlv de la fin du siècle. Le compte ne _signe_ pas à la connexion dans son document `membres` tant qu'il n'est pas _actif_, sa `dlv` reste non significative.
- sa `dlv` reste ainsi en tant que contact ayant une invitation, le membre n'étant toujours pas _actif_.

Le document `membres` est détruit,
- par une opération d'oubli.
- par la destruction de son groupe lors de la résiliation du dernier membre actif.
- par le GC détectant par la `dlv` que l'avatar a disparu.

_data_:
- `id` : id du groupe.
- `ids`: identifiant, indice `im` de membre relatif à son groupe.
- `v` : 
- `vcv` : version de la carte de visite du membre.
- `dlv` : .

- `ddi` : date de l'invitation la plus récente.
- **dates de début de la première et fin de la dernière période...**
  - `dac fac` : d'activité
  - `dln fln` : d'accès en lecture aux notes.
  - `den fen` : d'accès en écriture aux notes.
  - `dam fam` : d'accès aux membres.
- `flagsiv` : flags de l'invitation en cours.
- `inv` : dernière invitation. Liste des indices des animateurs ayant validé l'invitation.
- `nag` : `[nom, cle]` : nom et clé de l'avatar crypté par la clé du groupe.
- `cva` : carte de visite du membre `{v, photo, info}` cryptée par la clé du membre.

## Opérations

### Inscription comme contact
- si son `nag` est en `lna` ou `lnc`, refus.
- recherche de l'indice `im` dans la table `anag` du groupe pour le `nag` de l'avatar.
- SI `im` n'existe pas,
  - c'est une première vie OU une nouvelle vie après oubli de la précédente.
  - un nouvel indice `im` lui est attribué en séquence s'il n'y en a pas de libre.
  - un row `membres` est créé.
- SI `im` existait, _l'inscription en contact_ est en échec (existe déjà).

### Invitation par un animateur
- si son `nag` est en `lna` ou `lnc`, refus.
- choix des _droits_ et inscription dans `invits` de l'avatar.
- vote d'invitation (en mode _unanime_):
  - si tous les animateurs ont voté, inscription dans `invits` de l'avatar.
  - si le vote change les _droits_, les autres votes sont annulés.
- `ddi` est remplie.

### Annulation d'invitation par un animateur
- effacement de l'entrée `ni` dans `invits` de l'avatar.

### Oubli par un animateur*
- pour un contact, pas invité: son slot est récupérable.
- le document `membres` est détruit.
  
### Refus d'invitation par le compte
- le groupe peut avoir disparu depuis le lancement de l'invitation.
- 3 options possibles:
  - rester en contact.
  - m'oublier,
  - m'oublier et ne plus m'inviter.
- son item dans `invits` de son avatar est effacé.

### Acceptation d'invitation par le compte
- le groupe peut avoir disparu depuis le lancement de l'invitation.
- dans l'avatar principal du compte un item est ajouté dans `mpgk`,
- dans `comptas` le compteur `qv.ng` est incrémenté.
- `dac fac ...` sont mises à jour.
- son item dans `invits` de son avatar est effacé.
- flags `AN AM`: accès aux notes, accès aux autres membres.

### Modification des droits par un animateur
- flags `PA DM DN DE`

### Modification des accès membres / notes par le compte
- flags `AN AM`: accès aux notes, accès aux autres membres.

## Demande d'oubli par un compte**
- 3 options:
  - rester en _contact_
  - m'oublier: Entrée dans `mpgk` du compte supprimée.
  - m'oublier et ne pas me ré-inviter.
- si le membre était le dernier _actif_, le groupe disparaît.
- la participation au groupe disparaît de `mpgk` du compte.

# Documents `Chatgrs`
A chaque groupe est associé **UN** document `Chatgrs` qui représente le chat des membres d'un groupe. Il est créé avec le groupe et disparaît avec lui.

_data_
- `id` : id du groupe
- `ids` : `1`
- `v` : sa version.

- `items` : liste ordonnée des items de chat `{im, dh, lg, textg}`
  - `im` : indice membre de l'auteur,
  - `dh` : date-heure d'enregistrement de l'item,
  - `lg` : longueur du texte en clair de l'item. 0 correspond à un item effacé.
  - `t` : texte crypté par la clé du groupe.

## Opérations
### Ajout d'un item
- autorisé pour tout membre actif ayant droit d'accès aux membres.
- le texte est limité à 300 signes.

### Effacement d'un item
- autorisé pour l'auteur de l'item ou un animateur du groupe.

### Sur invitation par un animateur
- le texte d'invitation est enregistré comme item, les autres membres du groupe peuvent ainsi le voir.

### Sur acceptation ou refus d'invitation
- le texte explicatif est enregistré comme item.

Un item ne peut pas être corrigé après écriture, juste effacé.

Le chat d'un groupe garde les items dans l'ordre anté chronologique jusqu'à concurrence d'une taille totale de 5000 signes.

# Mots clés, principes et gestion
Les mots clés sont utilisés pour :
- filtrer / caractériser à l'affichage les **chats** accédés par un compte.
- filtrer / caractériser à l'affichage les **groupes (membres)** accédés par un compte.
- filtrer / caractériser à l'affichage les **notes**, personnels ou partagés avec un groupe.

La **définition** des mots-clés (avatar et groupe) est une map :
- _clé_ : indice du mot-clé de 1 à 255,
- _valeur_ : texte `catégorie/label du mot-clé`.

Affectés à un membre ou note, c'est un array de nombres de 1 à 255 (Uin8Array).

Les mots clés d'indice,
- 1-99 : sont ceux d'un compte.
- 100-199 : sont ceux d'un groupe.
- 200-255 : sont ceux définis en configuration (généraux dans l'application).

# Gestion des disparitions: `dlv` des comptes

Chaque compte a une **date limite de validité**:
- toujours une _date de dernier jour du mois_ (sauf exception par convention décrite plus avant),
- dans son `comptas`,
- dans les documents `versions` de ses avatars,
- dans les documents `membres` relatifs à un de ses avatars.

L'objectif des dlv est de permettre au GC de libérer les ressources correspondantes (notes, chats, ...) lorsqu'un compte n'est plus utilisé:
- **pour un compte A** la `dlv` représente la limite d'épuisement de son crédit mais bornée à `nnmi` mois du jour de son calcul.
- **pour un compte O**, la `dlv` représente la plus proche de ces deux limites,
  - un nombre de jours sans connexion (donnée par `nbmi` du document `espaces` de l'organisation),
  - la date `dlvat` jusqu'à laquelle l'organisation a payé ses coûts d'hébergement à l'administrateur technique (par défaut la fin du siècle). C'est la date `dlvat` qui figure dans le document `espaces` de l'organisation. Dans ce cas, par convention, c'est la **date du premier jour du mois suivant** pour pouvoir être reconnue.

> Remarque: étant une date de fin de mois, de nombreux comptes ont une même date ce qui empêche de rapprocher un compte de ses avatars ou les groupes auxquels il participe. Ceci reste vrai si ces dates ne peuvent pas être très lointaines.

> Remarque. En toute rigueur un compte A qui aurait un gros crédit pourrait ne pas être obligé de se connecter pour prolonger la vie de son compte _oublié / tombé en désuétude / décédé_. Mais il n'est pas souhaitable de conserver des comptes _morts_ en hébergement, même payé: ils encombrent pour rien l'espace.

## Mise à jour de la `dlv` d'un compte
Elle est _propagée_ pour tous les documents où elle figure, par une seule transaction. 

### Acceptation du sponsoring du compte
Première valeur calculée selon le type du compte.

### Connexion
La connexion permet de refaire des calculs en particulier en prenant en compte de nouveaux tarifs.
- pour un compte A c'est à cette occasion que sont intégrés les dons et les crédits récoltés par le Comptable.
- pour un compte O le changement de dlvat est aussi prise en compte.

C'est l'occasion majeure de prolonger la vie d'un compte.

### Création d'un nouveau membre
La `dlv` n'est pas recalculée pour le nouveau membre mais recopiée de celle de sa comptas.

### Don pour un compte A: ça passe par un chat
La dlv du _donneur_ est recalculée sur l'instant: si le don est important, la date peut être significativement rapprochée.

Pour le récipiendaire,
- s'il est connecté à cet instant dans une session, celle-ci recalcule et fait propager la dlv (et fait supprimer les dons en attente).
- sinon ceci s'effectue à la prochaine connexion du compte.

### Enregistrement d'un crédit par le Comptable
Pour le destinataire du crédit:
- s'il est connecté à cet instant dans une session, il peut appuyer sur un bouton pour rafraîchir les lignes de crédits, intégrer les dons en attente et faire propager la dlv qui en résulte (et supprimer les dons en attente).
- sinon ceci s'effectuera automatiquement à la prochaine connexion du compte.

### Modification de l'abonnement d'un compte A
La dlv est recalculée et propagée à l'occasion de la nouvelle évaluation qui en résulte.

### Mutation d'un compte O en A et d'un compte A en O
La dlv est recalculée en fonction des nouvelles conditions.

## Traitement par le GC
_Remarque_: les `dlv` des documents `versions` inférieures au début du siècle ne sont plus des dates mais des valeurs symboliques: 
- `aamm` indique que les sous-arbres ont été purgés et qu'il ne reste plus que le document versions lui-même (_zombi_). 
- Ceux-ci restent utiles pour synchronisation des bases locales afin de détecter les suppressions de groupes et d'avatars. Toutefois au bout de IDBOBS jours, on renonce à cette synchronisation incrémentale et la base locale IDB est purgée avant connexion.
- les versions ayant une `dlv` aamm plus vieille de IDBOBS jours son purgés aussi.

### `GCHeb` - Étape _fin d'hébergement_
Elle récupère les groupes dont la `dfh` est passée:
- la `dlv` du document `versions` du groupe est mise à la veille, devient _zombi_ et déclenchera une purge du sous-arbre du groupe.

### `GCGro` - Étape _groupes orphelins_: purges des `membres`
Elle filtre les documents `membres` _disparus_ sur `20000101 <= dlv < auj`
- purge du document `membres`.
- si le groupe reste vivant (il y a encore un membre _actif_): 
  - mise à jour du groupe: `flags[im]` à 0, `anag[im]` à 1,
  - mise à jour de `v` dans le document `versions` du groupe.
- si le groupe doit disparaître: la `dlv` de son document `versions` est **la veille du jour courant** (son _data_ devient null).

### `GCPag` - Étape _purge des sous-arbres avatars et groupes_
Elle filtre les documents `versions` des avatars et groupes par `20000101 <= dlv < auj`. 
- rappel: les `versions` des groupes vivants ont une `dlv` max et échappent de facto à ce filtre. 
- SI c'est un avatar principal (il a un document `comptas`).
  - pour un compte O, mise à jour de `tribus`, création d'un `gcvols`.
  - purge du document `comptas`
- purge du sous-arbre (dont les fichiers):
- la `dlv` de son document `versions` est **mise à aamm du jour courant** (son _data_ reste null).
- les documents `versions` restent _zombi_ mais ne seront plus sélectionnables pour purge des sous-arbres, leur `dlv` étant inférieure à `AMJ.min` (20000101).

## Changement des données dans l'espace d'une organisation
Il y a deux données: 
- `dlvat`: date limite de vie des comptes O, fixée par l'administrateur technique en fonction des contributions effectives reçues de l'organisation pour héberger ses comptes O.
- `nbmi`: nombre de mois d'inactivité acceptable fixé par le Comptable (3, 6, 9, 12, 18 ou 24). Ce changement n'a pas d'effet rétroactif.

> **Remarque**: `nbmi` est fixé par configuration par le Comptable _pour chaque espace_. C'est une contrainte de délai maximum entre deux connexions à un compte, faute de quoi le compte est automatiquement supprimé. La constante `IDBOBS` fixe elle un délai maximum (2 ans par exemple), _pour un appareil et un compte_ pour bénéficier de la synchronisation incrémentale. Un compte peut se connecter toutes les semaines et avoir _un_ poste sur lequel il n'a pas ouvert une session synchronisée depuis 3 ans: bien que tout à fait vivant, si le compte se reconnecte en mode _synchronisé_ sur **ce** poste, il repartira depuis une base locale vierge, sans bénéficier d'un redémarrage incrémental.

### Changement de `dlvat`
Si le financement de l'hébergement par accord entre l'administrateur technique et le Comptable d'un espace tarde à survenir, beaucoup de comptes O ont leur existence menacée par l'approche de cette date couperet. Un accord tardif doit en conséquence avoir des effets immédiats une fois la décision actée.

Par convention une `dlvat` est fixée au **1 d'un mois** et ne peut pas être changée pour une date  inférieure à M + 3 du jour de modification.

> Remarque: quand une `dlv` apparaît en `versions d'avatars / membres` au _1 d'un mois_, c'est qu'elle est la limite de vie `dlvat` fixée pour l'espace par l'administrateur technique.

L'administrateur technique qui remplace une `dlvat` le fait en **une** transaction pour toutes les `dlv` des `versions d'avatars / membres` égales à l'ancienne `dlvat`. La transaction fixe aussi la nouvelle `dlvat` dans la même transaction. La valeur de remplacement est,
- la nouvelle `dlvat` (au 1 d'un mois) si elle est inférieure à `auj + nbmi mois`: c'est encore la `dlvat` qui borne la vie des comptes O (à une autre borne).
- sinon la fixe à `auj + nbmi mois` (au dernier jour d'un mois), comme si les comptes s'étaient connectés aujourd'hui.

# Opérations GC
### Singleton `checkpoint` (id 1)
_data_ :
- `id` : 1
- `v` : date-time de sa dernière mise à jour ou 0 s'il n'a jamais été écrit.

- `start` : date-heure de lancement du dernier GC.
- `duree` : durée de son exécution en ms.
- `nbTaches` : nombre de taches terminées avec succès sur 6.
- `log` : array des traces des exécutions des tâches:
  - `nom` : nom.
  - `retry` : numéro de retry.
  - `start` : date-heure de lancement.
  - `duree` : durée en ms.
  - `err` : si sortie en exception, son libellé.
  - `stats` : {} compteurs d'objets traités (selon la tâche).

### Gestion des documents `versions` _zombi_

### `GCHeb` : traitement des fins d'hébergement
L'opération récupère toutes les ids des documents `groupes` où `dfh` est inférieure au jour courant.

Une transaction par groupe :
- dans le document `versions` du groupe, la `dlv` est positionnée à la veille (devient zombi).

### `GCGro` : Détection des groupes orphelins et suppression des membres
L'opération récupère toutes les `id / ids` des documents `membres` dont la `dlv` de la forme `aaaammjj` est inférieure au jour courant.

Une transaction par document `groupes`:
- mise à jour des statuts des membres perdus,
- suppression de ses documents `membres`,
- si le groupe n'a plus de membres actifs, suppression du groupe:
  - la `dlv` de son document `versions` est mise à la veille (il est zombi).

### `GCPag` : purge des avatars et des groupes
L'opération récupère toutes les `id` des documents `versions` dont la `dlv` est de la forme `aaaammjj` et antérieure à aujourd'hui.
Dans l'ordre pour chaque `id`:
- par compte, une transaction de récupération du volume (si `comptas` existe encore, sinon c'est que ça a déjà été fait),
- purge de leurs sous-collections,
- purge de leur avatar / groupe,
- purge de leurs fichiers,
- HORS TRANSACTION forçage de la `dlv` du document `versions` à `aamm` d'aujourd'hui.

**Une transaction pour chaque compte :**
- son document `comptas` :
  - est lu pour récupérer `cletX it`;
  - si c'est un compte O, un document `gcvols` est inséré avec ces données : son `id` est celle du compte.
  - les `gcvols` seront traités par la prochaine ouverture de session du comptable de l'espace ce qui supprimera l'entrée du compte dans tribu (et de facto libérera des quotas).
  - le document `comptas` est purgé afin de ne pas récupérer le volume plus d'une fois.

### `GCFpu` : traitement des documents `fpurges`
L'opération récupère tous les items d'`id` de fichiers depuis `fpurges` et déclenche une purge sur le Storage.

Les documents `fpurges` sont purgés.

### `GCTra` : traitement des transferts abandonnés
L'opération récupère toutes les documents `transferts` dont les `dlv` sont antérieures ou égales à aujourd'hui.

Le fichier `id / idf` cité dedans est purgé du Storage des fichiers.

Les documents `transferts` sont purgés.

### `GCDlv` : purge des versions / sponsorings obsolètes
L'opération récupère tous les documents `versions` de `dlv` de la forme aamm antérieures à aujourd'hui - IDBOBSGC jours, bref les _très vielles versions zombi_ devenues inutiles à la synchronisation des bases locales.

L'opération récupère toutes les documents `sponsorings` dont les `dlv` sont antérieures à aujourd'hui. Ces documents sont purgés.

### `GCstc` : création des statistiques mensuelles des `comptas` et des `tickets`
La boucle s'effectue pour chaque espace:
- `comptas`: traitement par l'opération `ComptaStat` pour récupérer les compteurs du mois M-1. 
  - Le traitement n'est déclenché que si le mois à calculer M-1 n'a pas déjà été enregistré comme fait dans `comptas.moisStat` et que le compte existait déjà à M-1.
- `tickets`: traitement par l'opération `TicketsStat` pour récupérer les tickets de M-3 et les purger.
  - Le traitement n'est déclenché que le mois à calculer M-3 n'a pas déjà été enregistré comme fait dans `comptas.moisStatT` et que le compte existait déjà à M-3.
  - une fois le fichier CSV écrit en _storage_, les tickets de M-3 et avant sont purgés.

**Les fichiers CSV sont stockés en _storage_** après avoir été _crypter_ par `crypterRaw` qui:
- génère une clé AES pour le fichier, l'IV associé étant les 16 premiers bytes de cette clé,
- créé un item de 49 bytes: 32 pour la clé, 16 pour l'IV, 1 indiquant si le fichier est gzippé,
- crypte cet item:
  - c1: par la clé publique du Comptable de l'espace,
  - c2: par la clé k d'administration du site.
- retourne l'ensemble `c1 c2 fichier` (gzippé ou non) crypté, prêt à être écrit sur _storage_.

Les statistiques sont doublement accessibles par le Comptable ET l'administrateur technique du site.

## Lancement global quotidien
Le traitement enchaîne, en asynchronisme de la requête l'ayant lancé : 
- `GCHeb GCGro GCPag GCFpu GCTra GCDlv GCstc`

En cas d'exception de l'un deux, une seule relance est faite après une attente d'une heure.

> Remarque : le traitement du lendemain est en lui-même une reprise.

> Pour chaque opération, il y a N transactions, une par document à traiter, ce qui constitue un _checkpoint_ naturel fin.

# Décomptes des coûts et crédits

> **Remarque**: en l'absence d'activité d'une session la _consommation_ est nulle, alors que le _coût d'abonnement_ augmente à chaque seconde même sans activité.

On compte **en session** les downloads / uploads soumis au Storage.

On compte **sur le serveur** le nombre de lectures et d'écritures effectués dans chaque opération et **c'est remonté à la session** où:
- on décompte les 4 compteurs depuis le début de la session (ou son reset volontaire après enregistrement au serveur du delta par rapport à l'enregistrement précédent).
- pn envoie les incréments des 4 compteurs de consommation par l'opération `EnregConso` toutes les PINGTO2 (dans `api.mjs`) minutes.
  - pas d'envoi s'il n'y a pas de consommation à enregistrer mais envoi quand même au bout d'une demi-heure (pour activer un ping de survie).

Le tarif de base repris pour les estimations est celui de Firebase [https://firebase.google.com/pricing#blaze-calculator].

Le volume _technique_ moyen d'un groupe / note / chat est estimé à 8K. Ce chiffre est probablement faible, le volume _utile_ en Firestore étant faible par rapport au volume réel occupé avec les index ... D'un autre côté, le serveur considère les volumes utilisés en base alors que V1 / V2 vont être décomptés sur des quotas (des maximum rarement atteints).

## Classe `Tarif`
Un tarif correspond à,
- `am`: son premier mois d'application. Un tarif s'applique toujours au premier de son mois.
- `cu` : un tableau de 7 coûts unitaires `[u1, u2, ul, ue, um, ud]`
  - `u1`: 30 jours de quota q1 (250 notes / chats)
  - `u2`: 30 jours de quota q2 (100Mo)
  - `ul`: 1 million de lectures
  - `ue`: 1 million d'écritures
  - `um`: 1 GB de transfert montant.
  - `ud`: 1 GB de transfert descendant.

En configuration un tableau ordonné par `aaaamm` donne les tarifs applicables, ceux de plus d'un an n'étant pas utiles. 

L'initialisation de la classe `Tarif.init(...)` est faite depuis la configuration (UI comme serveur).

On ne modifie pas les tarifs rétroactivement, en particulier celui du mois en cours (les _futurs_ c'est possible).

La méthode `const t = Tarif.cu(a, m)` retourne le tarif en vigueur pour le mois indiqué.

## Objet quotas et volumes `qv` : `{ qc, q1, q2, nn, nc, ng, v2 }`
- `qc`: quota de consommation
- `q1`: quota du nombre total de notes / chats / groupes.
- `q2`: quota du volume des fichiers.
- `nn`: nombre de notes existantes.
- `nc`: nombre de chats existants.
- `ng` : nombre de participations aux groupes existantes.
- `v2`: volume effectif total des fichiers.

Cette objet est la propriété `qv` de `comptas`. 

## Objet consommation `conso` : `{ nl, ne, vm, vd }`
- `nl`: nombre absolu de lectures depuis la création du compte.
- `ne`: nombre d'écritures.
- `vm`: volume _montant_ vers le Storage (upload).
- `vd`: volume _descendant_ du Storage (download).

Cet objet rapporte une évolution de consommation. Paramètre de l'opération `EnregConso`.

## Unités
- T : temps.
- D : nombre de document (note, chat, participations à un groupe).
- B : byte.
- L : lecture d'un document.
- E : écriture d'un document.
- € : unité monétaire.

## Classe `Compteurs`
Cette classe donne les éléments de facturation et des éléments de statistique d'utilisation sur les les 12 derniers mois (mois en cours y compris).

**Propriétés:**
- `dh0` : date-heure de création du compte.
- `dh` : date-heure courante (dernier calcul).
- `qv` : quotas et volumes pris en compte au dernier calcul `{ qc, q1, q2, nn, nc, ng, v2 }`.
  - Quand on _prolonge_ l'état actuel pendant un certain temps AVANT d'appliquer de nouvelles valeurs, il faut pouvoir disposer de celles-ci.
- `vd` : [0..3] - vecteurs détaillés pour M M-1 M-2 M-3.
- `mm` : [0..18] - coût abonnement + consommation pour le mois M et les 17 mois antérieurs (si 0 pour un mois, le compte n'était pas créé).
- `aboma` : somme des coûts d'abonnement des mois antérieurs au mois courant depuis la création du compte.
- `consoma` : somme des coûts de consommation des mois antérieurs au mois courant depuis la création du compte.

Le vecteur `vd[0]` et le montant `mm[0]` vont évoluer tant que le mois courant n'est pas terminé. Pour les mois antérieurs `vd[i]` et `mm[i]` sont immuables.

### Dynamique
Un objet de class `Compteurs` est construit,
- soit depuis `serial`, la sérialisation de son dernier état,
- soit depuis `null` pour un nouveau compte.
- la construction recalcule tout l'objet: il était sérialisé à un instant `dh`, il est recalculé pour être à jour à l'instant t.
- **puis** il peut être mis à jour, facultativement, juste avant le retour du `constructor`, par:
  - `qv` : quand il faut mettre à jour les quotas ou les volumes,
  - `conso` : quand il faut enregistrer une consommation.

`const compteurs = new Compteurs(serial, qv, conso, dh)`
- `dh` est facultatif et sert en test pour effectuer des batteries de tests ne dépendants pas de l'heure courante.

### Vecteur détaillé d'un mois
Pour chaque mois M à M-3, il y a un **vecteur** de 14 (X1 + X2 + X2 + 3) compteurs:
- X1_moyennes et X2 cumuls servent au calcul au montant du mois
  - QC : moyenne de qc dans le mois (€)
  - Q1 : moyenne de q1 dans le mois (D)
  - Q2 : moyenne de q2 dans le mois (B)
  - X1 + NL : nb lectures cumulés sur le mois (L),
  - X1 + NE : nb écritures cumulés sur le mois (E),
  - X1 + VM : total des transferts montants (B),
  - X1 + VD : total des transferts descendants (B).
- X2 compteurs de _consommation moyenne sur le mois_ qui n'ont qu'une utilité documentaire.
  - X2 + NN : nombre moyen de notes existantes.
  - X2 + NC : nombre moyen de chats existants.
  - X2 + NG : nombre moyen de participations aux groupes existantes.
  - X2 + V2 : volume moyen effectif total des fichiers stockés.
- 3 compteurs spéciaux
  - MS : nombre de ms dans le mois - si 0, le compte n'était pas créé
  - CA : coût de l'abonnement pour le mois
  - CC : coût de la consommation pour le mois
  
Voir les  méthodes et getter commentées dans le code.

Le getter `get serial ()` retourne la sérialisation de l'objet afin de l'écrire dans la propriété `compteurs` de `comptas`.

**En session,** `compteurs` est recalculé,
- par `compile()` à la connexion et en synchro,
- explicitement a l'occasion d'une simulation en passant comme arguments `qv` et `conso`.

**En serveur,** des opérations peuvent faire évoluer `qv` de `comptas` de manière incrémentale. L'objet `compteurs` est construit (avec un `qv` -et `conso` s'il enregistre une consommation) puis sa sérialisation est enregistrée dans `comptas`:
- création / suppression d'une note ou d'un chat: incrément / décrément de nn / nc.
- prise / abandon d'hébergement d'un groupe: delta sur nn / nc / v2.
- création / suppression de fichiers: delta sur v2.
- enregistrement d'un changement de quotas q1 / q2.
- upload / download d'un fichier: delta sur vm / vd.
- enregistrement d'une consommation de calcul: delta sur nl / ne / vd / vm en passant l'évolution de consommation dans l'objet `conso`.

Le Comptable peut afficher le `compteurs` de n'importe quel compte A ou O.

Les sponsors d'une tranche ne peuvent faire afficher les `compteurs` _que_ des comptes de leur tranche.

A la connexion d'un compte O, trois compteurs statistiques sont remontés de `compteurs` dans sa `tribus`:
- `v1`: le volume V1 effectivement utilisé,
- `v2`: le volume V2 effectivement utilisé,
- `cj`: la consommation moyenne journalière (`consoj`).

Les compteurs ne sont remontés que si l'un des trois s'écarte de plus de 10% de la valeur connue dans sa `tribus`.

### Classe `Credits`
La propriété `credits` n'existe dans `comptas` que pour un compte A:
- elle est cryptée par la clé K du compte qui est seul à y accéder.
- toutefois elle est cryptée par la clé publique du compte juste après l'opération de passage d'un compte O à A.

**Propriétés:**
- `total` : total des crédits encaissés, plus les dons reçus, moins les dons effectués.
- `tickets`: liste des tickets générés par le compte.

### Documents `tickets`
Voir ci-avant la section correspondante.

### Mutation d'un compte _autonome_ en compte _d'organisation_
Le compte a demandé et accepté, de passer O. Son accord est traduit par le dernier item de son chat avec le sponsor ou le Comptable qui effectue l'opération: son texte est `**YO**`.

Le Comptable ou un sponsor désigne le compte dans ses contacts et vérifie:
- que c'est un compte A,
- que le dernier item écrit par le compte est bien `**YO**`.

Les quotas `qc / q1 / q2` sont ajustés par le sponsor / comptable:
- de manière à supporter au moins le volume actuels v1 / v2,
- en respectant les quotas de la tranche courante.

L'opération de mutation:
- inscrit le compte dans la tranche courante,
- dans `compteurs` du `comptas` du compte:
  - remise à zéro du total abonnement et consommation des mois antérieurs (`razma()`):
  - l'historique des compteurs et de leurs valorisations reste intact.
  - les montants du mois courant et des 17 mois antérieurs sont inchangés,
  - MAIS les deux compteurs `aboma` et `consoma` qui servent à établir les dépassements de coûts sont remis à zéro: en conséquence le compte va bénéficier d'un mois (au moins) de consommation _d'avance_.
- inscription d'un item de chat.

### Rendre _autonome_ un compte O
C'est une opération du Comptable et/ou d'un sponsor:
- selon la configuration de l'espace, l'accord du compte est requis si la configuration de l'espace l'a rendu obligatoire (item de chat avec `**YO**`)

L'opération de mutation:
- retire le compte de sa tranche.
- comme dans le cas ci-dessus, remise à zéro des compteurs total abonnement et consommation des mois antérieurs.
- un objet `ticket` par convention égal à `false` est créé. La prochaine connexion ou synchronisation du compte l'initialise et le crypte par la clé K:
  - `total` vaut un pécule de 2c, le temps de générer un ticket et de l'encaisser.
  - une liste `tickets` vide.

### Sponsoring d'un compte O
Rien de particulier : `compteurs` est initialisé. Sa consommation est nulle, de facto ceci lui donne une _avance_ de consommation moyenne d'au moins un mois.

### Sponsoring d'un compte A
`compteurs` est initialisé, sa consommation est nulle mais il bénéficie d'un _total_ minimal pour lui laisser le temps d'enregistrer son premier crédit.

Un objet `ticket` est créé dans `comptas` avec:
- un `total` de 2 centimes.
- une liste `tickets` vide.
- l'objet est crypté par la clé K du compte à l'acceptation du sponsoring.

# Annexe I: Discordances temporelles des données

## Discordances par détection tardive de disparitions
Un chat I / E peut référencer un avatar E alors que celui-ci a été détecté disparu par le GC.
- le GC ne peut pas connaître la liste des chats dans lesquels un avatar disparu est impliqué.
- l'avatar I ne détectera la disparition de E que lorsqu'en session il ouvrira la liste des chats et plus précisément fera rafraîchir la liste des CV.

Un avatar principal peut référencer dans la liste de ses participations aux groupes, un groupe détecté disparu par disparition / résiliation de son dernier membre actif.
- le GC n'ayant pas connaissance de l'avatar principal du compte d'un membre ne peut pas mettre à jour,
  - ni la liste des participations aux groupes des membres,
  - leurs invitations en cours.
- la disparition d'un groupe n'est détectée qu'à l'ouverture de la prochaine session (ou plus tôt par synchronisation, quand une session est active).

### Discordances temporaires en session sur les décomptes de chats et groupes
L'existence d'un chat décompté pour un compte est marqué,
- par l'existence de rows chats attachés à un de ses avatars,
- par le décompte `ng.nc` dans comptas du compte.

Les deux informations sont mises à jour sous contrôle transactionnel: les données persistantes sont toujours cohérentes entre elle.

En session, l'ordre dans lequel parviennent les mises à jour est aléatoire: mise à jour chats avant mise à jour `comptas` ou l'inverse.
- pendant un certain temps le nombre de chats comptés en session peut différer de celui détenu dans `comptas`.
- la situation se stabilise d'elle-même par synchronisation.
- il est difficile d'arriver à mettre en évidence cette discordance temporaire de décompte, par ailleurs sans conséquences réelles.

Le nombre de participations aux groupes est de même détenu dans deux rows: 
- `avatars` principal du compte: dans la map `mpgk`,
- `comptas` du compte: propriété `qv.ng`.

La situation se stabilise d'elle-même, est difficile à observer et sans conséquences réelles.

Le troisième cas similaire est celui de l'existence d'une note supprimée (_zombi_) encore temporairement décomptée dans `comptas.qv.nn`.

**Conclusions**
- les décomptes dans `comptas.qv` et `avatars` ou `chats` ne sont pas réalignés: le décompte des coûts reste cohérent.
- dans la logique de gestion on tient compte des rows `avatars` et `chats` sans se préoccuper d'une possible discordance passagère des décomptes avec `comptas.qv`.
- la détection tardive éventuelle de disparitions est assumée:
  - avoir des groupes ou des chats décomptés à tort n'a pas d'impact de calcul des coûts puisque _l'abonnement_ se fait sur des quotas maximum, pas sur le nombre effectif de groupes et chats.
  - on assume que quelques chats _passifs_ de I ne soient pas supprimés alors que E a disparu parce que ceci ne peut être détecté qu'à l'ouverture de vue des chats. 

# Annexe II: déclaration des index

## SQL
`sqlite/schema.sql` donne les ordres SQL de création des tables et des index associés.

Rien de particulier : sont indexées les colonnes requérant un filtrage ou un accès direct par la valeur de la colonne.

## Firestore
`firestore.index.json` donne le schéma des index: le désagrément est que pour tous les attributs il faut indiquer s'il y a ou non un index et de quel type, y compris pour ceux pour lesquels il n'y en a pas.

**Les règles génériques** suivantes ont été appliquées:

_data_ n'est jamais indexé.

Il n'y a pas _d'index composite_. Toutefois en fait les attributs `id_v` et `id_vcv` calculés (pour Firestore seulement) avant création / mise à jour d'un document, sont des pseudo index composites mais simplement déclarés comme index:
- `id_v` est un string `id/v` où `id` est sur 16 chiffres et `v` sur 9 chiffres.
- `id_vcv` est un string `id/vcv` où `id` est sur 16 chiffres et `vcv` sur 9 chiffres.

Ces attributs apparaissent dans:
- tous les documents _majeurs_ pour `id_v`,
- `avatars chats membres` pour `id_vcv`.

En conséquence les attributs `id v vcv` ne sont **pas** indexés dans les documents _majeurs_.

`id` est indexée dans `gcvols` et `fpurges` qui n'ont pas de version `v` et dont l'`id` doit être indexée pour filtrage par l'utilitaire `export/delete`.

Dans les sous-collections versionnées `notes chats membres sponsorings tickets`: `id ids v` sont indexées. 

Pour `sponsorings` `ids` sert de clé d'accès direct et a donc un index **collection_group**, pour les autres l'index est simple.

Dans la sous-collection non versionnée `transferts`: `id ids` sont indexées mais pas `v` qui n'y existe pas.

`dlv` est indexée,
- simple sur `versions`,
- **collection_group** sur les sous-collections `transferts sponsorings membres`.

Autres index:
- `hps1` sur `comptas`: accès à la connexion par phrase secrète.
- `hpc` sur `avatars`: accès direct par la phrase de contact.
- `dfh` sur `groupes`: détection par le GC des groupes sans hébergement.

# Annexe III: IndexedDB dans les session UI

Un certain nombre de documents sont stockés en session UI dans la base locale IndexedDB et utilisés en modes _avion_ et _synchronisé_.
- `compte`: singleton d'`id` vaut '1'.
  - son contenu est la sérialisation de `{ id:..., k:... }` cryptée par la PBKFD de la phrase secrète complète.
  - `id` : id du compte (son avatar principal et de comptas).
  - `k` : 32 bytes de la clé K du compte.
- `tribus`: 'id',
- `comptas`: 'id'. De facto un singleton mais avec une clé qui n'est pas 1 (c'était une option plausible).
- `avatars`: 'id',
- `chats`: '[id+ids]',
- `sponsorings`: '[id+ids]',
- `groupes`: 'id',
- `membres`: '[id+ids]',
- `notes`: '[id+ids]',
- `tickets`: '[id+ids]'.

La clé _simple_ `id` en string est cryptée par la clé K du compte et encodée en base 64 URL.

Les deux termes de clés `id` et `ids` sont chacune en string crypté par la clé K du compte et encodée en base 64 URL.

Le format _row_ d'échange est un objet de la forme `{ _nom, id, ..., _data_ }`.

En IDB les _rows_ sont sérialisés et cryptés par la clé K du compte.

Il y a donc une stricte identité entre les documents extraits de SQL / Firestore et leurs états stockés en IDB

_**Remarque**_: en session UI, d'autres documents figurent aussi en IndexedDB pour,
- la gestion des fichiers locaux: `avnote fetat fdata loctxt locfic locdata`
- la mémorisation de l'état de synchronisation de la session: `avgrversions sessionsync`. 


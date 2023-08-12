# Données persistantes sur le serveur

Les données persistantes sont gérées selon deux implémentations :
- **SQL** : les données sont distribuées dans des **tables** `espaces avatars versions notes ...`
- **Firestore** : chaque table SQL correspond à une **collection de documents**, chaque document correspondant à un **row** de la table SQL de même nom que la collection.

Les _colonnes_ d'une table SQL correspondent aux _attributs / propriétés_ d'un document.
- en SQL la _clé primaire_ est un attribut ou un couple d'attribut,
- en Firestore le _path_ d'un document contient cet attribut ou couple d'attributs

## Table / collection `singletons`
La collection singletons a un seul document `checkpoint` ayant les attributs suivants:
- `id` : qui vaut 1 (il _pourrait_ ultérieurement exister d'autres singletons 2 3 ...).
- `v` : sa version, qui est l'estampille en ms de sa dernière mise à jour.
- `_data_` : sérialisation non cryptée des données traçant l'exécution du dernier traitement journalier de GC (garbage collector).

Son _path_ en Firestore est `singletons/1`.

Le document checkpoint est réécrit totalement à chaque exécution du GC.
- son existence n'est jamais nécessaire et d'ailleurs lors de la première exécution il n'existe pas.
- il ne sert qu'à l'administrateur technique pour s'informer, en cas de doutes, du bon fonctionnement du triatement GC en délivrant quelques compteurs, traces d'exécution, traces d'erreurs.

## Espaces
Tous les autres documents comportent une colonne / attribut `id` dont la valeur détermine un partionnement en _espaces_ cloisonnés : dans chaque espace aucun document ne référence un document d'un autre espace.

Un espace est identifié par `ns`, **un entier de 10 à 69**. Chaque espace à ses données réparties dans les collections / tables suivantes:
- `espaces syntheses` : un seul document / row par espace. Leur attribut `id` (clé primaire en SQL)a pour valeur le `ns` de l'espace. Path pour le ns 24 par exemple : `espaces/24` `syntheses/24`.
- tous les autres documents ont un attribut / colonne `id` de 16 chiffres dont les 2 premiers sont le ns de leur espace. Les données de ces documents peuvent citer l'id d'autres documents mais sous la forme d'une _id courte_ dont les deux premiers chiffres ont été enlevés.

### Exportation / purge d'un espace
Un utilitaire permet, en se basant exclusivement sur la valeur de l'attribut `id` des documents:
- d'exporter un _espace_ d'une base (SQL ou Firestore) dans une autre en changeant éventuellement son `ns` (passant par exemple de `24` à `32`).
- purger les données d'un _espace_ d'une base.

### Code organisation attaché à un espace
A la déclaration d'un espace sur un serveur, l'administrateur technique déclare un **code organisation**:
- ce code ne peut plus changer.
- le Storage de fichiers comporte un _folder_ racine portant ce code d'organisation ce qui partitionne le stockage de fichiers.

> Un Storage pour une organisation peut être exporté dans un autre Storage:
- les fichiers sont physiquement recopiés,
- à cette occasion le code de l'organisation (la racine du Storage) peut être changé, celui de la _cible_ pouvant différer de celui de la _source_.

> Les connexions aux comptes citant ce _code organisation_ c'est une donnée dure, dont le changement ne peut intervenir que dans des circonstances très exceptionnelles puisqu'elle nécessite d'informer tous les utilisateurs ... dont personne n'a la liste. Il reste à _bloquer_ l'ancien espace et à indiquer dans l'information de blocage le nouveau couple URL / code organisation pour retrouver ses données après qu'elles aient été transférées.

Les données ainsi ne faisant référence qu'à des id _courtes_ sont intègres dans la base cible de l'exportation.

### Tables / collections
#### Entête de l'espace: `espaces syntheses`
- `espaces` : `id` est le `ns` (par exemple `24`) de l'espace. Le document contient quelques données générales de l'espace.
  - Clé primaire : `id`. Path : `espaces/24`
- `syntheses` : `id` est le `ns` de l'espace. Le document contenant des données statistiques sur la distribution des quotas et l'utilisation de ceux-ci.
  - Clé primaire : `id`. Path : `syntheses/24`

#### Gestion de volumes disparus : `gcvols fpurges`
- `gcvols` : son `id` est celui de l'avatar principal d'un compte dont la disparition vient d'être détectée. Ses données donnent, cryptées pour le Comptable, les références permettant de restituer les volumes V1 et V2 de facto libérés par la disparition du compte `id`. 
  - Clé primaire : `id`. Path : `gcvols/{id}`
- `fpurges` : son `id` est aléatoire, les deux premiers chiffres étant le `ns` de l'espace. Un document correspond à un ordre de purge dans le Storage des fichiers, soit d'un _répertoire_ entier (correspondant à un avatar ou un groupe), soit dans ce répertoire à une liste fermée de fichiers.
  - Clé primaire : `id`. Path : `fpurges/{id}`

Ces documents sont écrits une fois et restent immuables jusqu'à leur traitement qui les détruit:
- prochaine ouverture de session du Comptables pour les `gcvols`,
- prochain GC, étape `GCfpu`, pour les `fpurges`.

#### Collections / tables _majeures_ : `tribus comptas avatars groupes versions`
Chaque collection a un document par `id` (clé primaire en SQl, second terme du path en Firesore).
- `tribus` : un document par _tranche de quotas / tribu_ décrivant comment sont distribués les quotas de la tranche entre les comptes.
  - `id` (sans le ns) est un numéro séquentiel `1..N`.
  - Clé primaire : `id`. Path : `tribus/0...x`
- `comptas` : un document par compte donnant les informations d'entête d'un compte (dont l'`id` est celui de son avatar principal). L'`id` courte sur 14 chiffres est le numéro du compte :
  - `10...0` : pour le comtable.
  - `2x...y` : pour un compte, `x...y` est un nombre aléatoire sur 13 chiffres.
  - Clé primaire : `id`. Path : `comptas/10...0` `comptas/2x...y`
- `avatars` : un document par avatar donnant les informations d'entête d'un avatar. L'`id` courte sur 14 chiffres est le numéro d'un avatar du compte :
  - `10...0` : pour l'avatar principal du Comtable.
  - `2x...y` : pour un avatar d'un autre compte que le Comptable, `x...y` est un nombre aléatoire sur 13 chiffres.
  - Clé primaire : `id`. Path : `avatars/10...0` `avatars/2x...y`
- `groupes` : un document par groupe donnant les informations d'entête d'un groupe. L'`id` courte sur 14 chiffres est le numéro d'un groupe :
  - `3x...y` : `x...y` est un nombre aléatoire sur 13 chiffres.
  - Clé primaire : `id`. Path : `groupes/3x...y`
- `versions` : un document par avatar et par groupe donnant le numéro de version, numéro d'ordre de la dernière mise à jour pour l'avatar ou le groupe et toutes leurs sous-collections.
  - Clé primaire : `id`. Path : `versions/10...0` `versions/2x...y` `versions/3x...y`

#### Sous-collections de `versions`: `notes transferts sponsorings chats membres`
Pour un document `versions/2x...y` il existe,
- pour une version _d'avatar_ (id: 1... ou 2...), 4 sous-collections de documents: `notes transferts sponsorings chats`
- pour une version _de groupe_ (id: 3...), 3 sous-collections de documents: `notes transferts membres`.

Dans chaque sous-collection, ids est un identifiant relatif à id. 
- en SQL les clés primaires sont `id,ids`
- en Firestore les paths sont (par exemple pour la sous-collection note) : `versions/2.../notes/z...t`, `id` est le second terme du path, `ids` le quatième.

- `notes` : un document représente une note d'un avatar ou d'un groupe. L'identifiant relatif `ids` est un nombre aléatoire.
- `transferts` : un document représente un transfert (upload) en cours d'un fichier d'une note d'un avatar ou d'un groupe. L'identifiant relatif `ids` est un nombre aléatoire. Un document transfert est créé immuable: il est détruit quand le transfert a été un succès ou constaté abandonné par le GC.
- `sponsorings` : un document représente un sponsoring d'un avatar. Son identifiant relatif est le hash de la phrase de reconnaissance entre le sponsor et son sponsorisé.
- `chats` : un chat entre 2 avatars A et B se traduit en deux documents : 
  - l'un sous-document de A a pour identifiant secondaire `ids` un hash des clés de B et A.
  - l'autre sous-document de B a pour identifiant secondaire `ids` un hash des clés de A et B.
- `membres` : un document par membre avatar participant à un groupe. L'identifiant secondaire `ids` est l'indice membre `1..N`, ordre d'enregistrement dans le groupe.

La _disparition_ d'un avatar ou d'un groupe, se traduit par :
- son document `versions` ayant un statut de _zombi_, indiquant que l'avatar ou le groupe a disparu,
- la purge effective de son document `avatars` ou `groupes` et de sa sous-collection de `notes transferts chats sponsorings membres`. Cette purge peut être temporellement différée, la _vraie_ marque de disparition est l'état _zombi_ de leur document `versions`.
- la purge effective d'un document `versions` intervient un an après son passage en état _zombi_, le temps que toutes les connexions des comptes actifs aient pu prendre connaissance de cet état.


### L'administrateur technique
Il a pour rôle majeur de gérer les espaces:
- les créer / les détruire,
- définir leurs quotas à disposition du Comptable de chaque espace: il existe deux quotas,
  - `q1` : volume maximal autorisé des textes des notes,
  - `q2` : volume total autorisé des fichiers attachés aux notes.

Ses autres rôles sont :
- la gestion d'une _notification / blocage_ par espace, sauf pour information technique importante, soit pour figer un espace avant sa migration vers une autre base (ou sa destruction).
- le transfert d'un espace d'une base vers une autre,
- le transfert des fichiers d'un espace d'un Storage à un autre.

### Comptable de chaque espace
Pour un espace, `24` par exemple, il existe un compte `2410000000000000` qui est le **Comptable** de l'espace. 

Le Comptable dispose des quotas globaux de l'espace attribués par l'administrateur technique. Il définit un certain nombre de **tranches de quotas** et confie chacune de ses tranches à des comptes _sponsors_ qui peuvent les distribuer aux comptes qu'ils ont sponsorisé.

Par convention on dénomme `tribu` l'ensemble des comptes partageant une même tranche de quotas.

Le rôle principal d'un _Comptable_ est de:
- définir des tranches de quotas et d'en ajuster les quotas,
- de déclarer les _sponsors_ de chaque tranche, le cas échéant de retirer ou d'ajouter la qualité de _sponsor_ a un compte.
- gérer des _notifications / blocages_ s'appliquant à des comptes spécifiques ou à tous les comptes d'une tranche.

Le Comptable :
- ne peut pas se résilier lui-même,
- ne peut pas changer de tranche de quotas, il est rattaché à la tranche 1 de son espace qui ne peut pas être supprimée.
- ne peut pas supprimer son propre attribut _sponsor_,
- accepte l'ouverture de **chats** avec n'importe quel compte qui en prend l'initiative.

#### Quotas d'une tranche
La déclaration d'une tranche par le Comptable d'un espace consiste à définir :
- une clé de cryptage `clet` générée aléatoirement à la création de la tranche :
  - **les 2 premiers bytes donnent l'id de la tribu**, son numéro d'ordre de création par le Comptable partant de de 1,
- un très court texte `info` signifiant pour le Comptable,
- les sous-quotas `q1` et `q2` attribués.

`clet` est immuable, `info q1 q2` peuvent être mis à jour par le comptable.

#### Comptes _sponsors_
Les quotas `q1 q2` attribués à chaque compte sont prélevés sur une tranche, en d'autres termes, tout compte fait partie d'une _tribu_.

Un compte est créé par _sponsoring_,
- soit d'un compte existant,
  - _sponsor_ : le compte créé à des quotas prélevés dans la tranche de son sponsor.
  - _NON sponsor_ : le compte créé à des quotas prélevés dans la tranche de son sponsor, MAIS les quotas de ce dernier sont amputés des quotas _donnés_ au sponsorisé.
- soit du Comptable : le compte créé à des quotas prélevés dans la tranche choisie par le Comptable.

Les comptes ayant un pouvoir de **sponsor** peuvent:
- sponsoriser la création de nouveaux comptes, _sponsor_ eux-mêmes ou non,
- gérer la répartition des quotas entre les comptes de leur tranche,
- gérer une _notification / blocage_ pour les comptes de leur tranche.

## Détail des tables / collections

Tous les documents, ont un attribut _data_ qui porte toutes les informations sérialisées du document.

Certains de ces attributs sont externalisés hors de _data_,
- soit parce que faisant partie de la clé primaire `id ids` en SQL, ou du path en Firestore,
- soit parce qu'ils sont utilisés dans des index.

**En Firestore** les documents des collections _majeures_ `tribus comptas avatars groupes versions` ont un ou deux attributs _techniques_ calculés et NON présents en _data_:
- `id_v` : un string `id/v` ou `id` est l'id sur 16 chiffres et `v` la version du document sur 9 chiffres.
- `id_vcv` pour les documents `avatars` seulement: un string `id/vcv` ou `id` est l'id sur 16 chiffres et `vcv` la version de la carte de visite de l'avatar sur 9 chiffres.

### Gestion des versions dans `versions`
- un document `avatar` d'id `ida` et les documents de ses sous collections `chats notes transferts sponsorings` ont une version prise en séquence continue fixée dans le document `versions` ayant pour id `ida`.
- idem pour un document `groupe` et ses sous-collections `membres notes transferts`.
- toute mise à jour du document maître (avatar ou groupe) et de leur sous-documents provoque l'incrémentation du numéro de version dans `versions` et l'inscription de cette valeur comme version du (sous) document mis à jour.

Un document `versions` gère :
- `v` : sa version (celle de l'avatar / groupe et leurs sous-collections).
- `dlv` : la date de fin de vie de son avatar ou groupe.
- en _data_ pour un groupe :
  - `v1 q1` : volume et quota dee textes des notes du groupe.
  - `v2 q2` : volume et quota dee fichiers des notes du groupe.

Quand la dlv est non 0 et inférieure ou égale à la date du jour,
- le document est en état _zombi_ et traduit le fait que l'avatar ou le groupe a disparu.
- sa _data_ est null.
- sa version `v` ne changera plus.
- sa `dlv` sera ramenée à un an plus tôt, dès que les documents et sous-documents correspondants auront été effectivement purgés, puis restera inchangée jusqu'à la purge effective du document `versions` lui-même à cette date là.

### Documents _synchronisables_ en session
Chaque session détient localement le sous-ensemble des données de la portée bien délimitée qui la concerne: en mode synchronisé les documents sont stockés en base IndexedDB (IDB) avec le même contenu qu'en base centrale.

L'état en session est conservé à niveau en _s'abonnant_ à un certain nombre de documents et de sous-collections:
- (1) les documents `avatars comptas` de l'id du compte
- (2) le document `tribus` de l'id de leur tribu, tirée de (1)
- (3) les documents `avatars` des avatars du compte - listé par (1)
- (4) les documents `groupes` des groupes dont les avatars sont membres - listés par (3)
- (5) les sous-collections `notes chats sponsorings` des avatars - listés par (3)
- (6) les sous-collections `membres notes` des groupes - listés par (4)
- (7) le document `espaces` de son espace.
- le comptable, en plus d'être abonné à sa tribu, peut temporairement s'abonner à **une** autre tribu _courante_.

Au cours d'une session au fil des synchronisations, la portée va donc évoluer depuis celle déterminée à la connexion:
- des documents ou collections de documents nouveaux sont ajoutés à IDB (et en mémoire de la session),
- des documents ou collections sont à supprimer de IDB (et de la mémoire de la session).

Une session a une liste d'ids abonnées :
- l'id de son compte : quand un document `compta` change il est transmis à la session.
- les ids de ses `groupes` et `avatars` : quand un document `versions` ayant une de ces ids change, il est transmis à la session. La tâche de synchronisation de la session va chercher le document majeur et ses sous documents ayant des versions postérieures à celles détenues en session.
- sa `tribu` actuelle (qui peut changer).
- implicitement le document `espaces` de son espace.
- **pour le Comptable** : en plus ponctuellement une seconde `tribu` _courante_.

**Remarque :** en session ceci conduit au respect de l'intégrité transactionnelle pour chaque objet majeur mais pas entre objets majeurs dont les mises à jour pourraient être répercutées dans un ordre différent de celui opéré par le serveur.
- en **SQL** les notifications _pourraient_ être regroupées par transaction et transmises dans l'ordre.
- en **FireStore** ce n'est pas possible : la session pose un écouteur sur des objets `espaces comptas tribus versions` individuellement, l'ordre d'arrivée des modifications ne peut pas être garanti entre objets majeurs.

En SQL :
- c'est le serveur qui détient la liste des abonnemnts de chaque session: les mises à jour stransmises par WebSocket.

En Firestore :
- c'est la session qui détient la liste de ses abonnemnts, le serveur n'en dispose pas.
- la session pose un _écouteur_ sur chacun de ces documents.

Dans les deux cas c'est en session la même séquence qui traite les modifications reçues, sans distinction de comment elles ont été captées (message WebSocket ou activatio d'un écouteur).

### Attributs externalisés hors de _data_
#### `id` et `ids` (quand il existe)
Ces attributs sont externalisés et font partie de la clé primaire (en SQL) ou du path (en Firestore).

Pour un `sponsorings` l'attribu `ids` est le hash de la phrase de reconnaissance :
- l'attribut est indexé.
- en Firestore l'index est `collection_group` afin de rendre un sponsorings accessible par index sans connaître son _parent_ le sponsor.

#### `v` : version d'un document
Tous les docuements sont _versionnés_,
- **SAUF** `gcvols fpurges transferts` qui sont créés immuable et détruits par le premier traitement qui les lit (dont le GC). Ces documents ne sont pas synchronisés en sessions UI.
- **singletons syntheses** : v est une estampille (date-heure) et n'a qu'un rôle informatif : ces documents ne sont pas synchronisés en sessions UI.
- **tous les autres documents ont un version de 1..n**, incrémentée de 1 à chaque mise à jour de son document, et pour `versions` de leurs sous-collections.

En session UI pour chaque document ou sous-collection d'un document, le fait de connaître sa version permet,
- de ne demander la mise à jour que des documents plus récents de même id,
- à réception d'un row synchronisé de ne mettre à jour l'état en mémoire que s'il est effectivement plus récent que celui détenu.

#### `vcv` : version de la carte de visite
Cet attribut est la version `v` du document au moment de la dernière mise à jour de la carte de visite. `vcv` est définie pour `avatars chats membres` seulement.

#### `dlv` : **date limite de validité** 
Ces dates sont données en jour `aaaammjj` (UTC) et apparaissent dans : 
- (a) `versions membres`,
- (b) `sponsorings`,
- (c) `transferts`.

Un document ayant une `dlv` **antérieure au jour courant** est un **zombi**, considéré comme _disparu / inexistant_ :
- en session sa réception a pour une signification de _destruction / disparition_ : il est possible de recevoir de tels avis de disparition plusieurs fois pour un même document.
- il ne changera plus de version ni d'état, son contenu est _vide_, pas de _data_ : c'est un **zombi**.

**Sur _versions des avatars_ :**
- **jour auquel l'avatar sera officiellement considéré comme _disparu_**.
- la `dlv` (indexée) est reculée à l'occasion de l'ouverture d'une session pour _prolonger_ la vie de l'avatar correspondant.
- les `dlv` permettent au GC de récupérer tous les _avatars disparus_.

**Sur _membres_ :**
- **jour auquel l'avatar sera officiellement considéré comme _disparu ou ne participant plus au groupe_**.
- la `dlv` (indexée) est reculée à l'occasion de l'ouverture d'une session pour _prolonger_ la participation de l'avatar correspondant au groupe.
- les `dlv` permettent au GC de récupérer tous les _participations disparues_ et in fine de détecter la disparition des groupes quand tous les participants actifs ont disparu.
- en Firestore l'index est `collection_group` afin de s'appliquer aux membres de tous les groupes.

**Sur _versions des groupes_ :**
- soit il n'y pas de `dlv` (0), soit la `dlv` est égale ou dépasse le jour courant : on ne trouve jamais dans une `versions` de groupe une `dlv` _future_ (contrairement aux `versions` des avatars et `membres`).
- pour _supprimer_ un groupe on lui fixe dans son `versions` une `dlv` du jour courant, il n'a plus de _data_, désormais _zombi et immuable_. Son `versions` sera purgé un an plus tard.

**Sur _sponsorings_:**
- jour à partir duquel le sponsoring n'est plus applicable ni pertinent à conserver. Les sessions suppriment automatiquement à la connexion les sponsorings ayant dépassé leur `dlv` (idem pour les synchronisations).
- il y a donc des sponsorings avec une `dlv` dans le futur : celle-ci peut être prolongée mais jamais avancée.
- dès atteinte du jour de `dlv`, un sponsorings est purgé (au moins purgeable).
- en Firestore l'index est `collection_group` afin de s'appliquer aux sponsorings de tous les avatars.

**Sur _transferts_:**
- **jour auquel il est considéré que le transfert tenté a définitivement échoué**.
- un `transferts` est _immuable_, jamais mis à jour : il est créé, supprimé explicitement ou purgé à atteinte de sa `dlv`.
- permet au GC de détecter les transferts en échec et de nettoyer le Storage.
- en Firestore l'index est `collection_group` afin de s'appliquer aux fichiers des notes de tous les avatars et groupe.

#### `dfh` : **date de fin d'hébergement** sur un document `groupes`
La **date de fin d'hébergement** sur un groupe permet de détecter le jour où le groupe sera considéré comme disparu. 

A dépassement de la `dfh` d'un groupe, le GC fait disparaître le groupe inscrivant une `dlv` du jour dans son document `versions`.

#### `hpc` : hash de la phrase de contact sur un document `avatars`
Cet attribut de avatars est indéxé de manière à pouvoir accéder à un avatar en connaissant sa phrase de contact.

#### `hps1` : hash du début de la phrase secrète sur un document `comptas`
Cet attribut de comptas est indéxé de manière à pouvoir accéder à un compte en connaissant sa phrase secrète (connexion).

#### Cache locale des `espaces comptas versions avatars groupes tribus` dans une instance d'un serveur
- les `comptas` sont utilisées à chaque mise à jour de notes.
- les `versions` sont utilisées à chaque mise à jour des avatars, de ses chats, notes, sponsorings.
- les `avatars groupes tribus` sont également souvent accédés.

**Les conserver en cache** par leur `id` est une bonne solution : mais en _FireStore_ (ou en SQL multi-process) il peut y avoir plusieurs instances s'exécutant en parallèle. Il faut en conséquence interroger la base pour savoir s'il y a une version postérieure et ne pas la charger si ce n'est pas le cas en utilisant un filtrage par `v`. Ce filtrage se faisant sur l'index n'est pas décompté comme une lecture de document quand le document n'a pas été trouvé parce que de version déjà connue.

En Firestore l'attribut calculé `id_v` permet d'effectuer ce filtrage (alors qu'en SQL l'index composé id / v est utilisable).

La mémoire cache est gérée par LRU (tous types de documents confondus)

## Généralités
**Les clés AES et les PBKFD** sont des bytes de longueur 32. Un texte crypté a une longueur variable :
- quand le cryptage est spécifié _libre_ le premier byte du texte crypté est le numéro du _salt_ choisi au hasard dans une liste pré-compilée : un texte donné 'AAA' ne donnera donc pas le même texte crypté à chaque fois ce qui empêche de pouvoir tester l'égalité de deux textes cryptés au vu de leur valeur cryptée.
- quand le cryptage est _fixe_ le numéro de _salt_ est 1 : l'égalité de valeurs cryptées traduit l'égalité de leur valeurs sources.

**Un entier sur 53 bits est intègre en Javascript** (9,007,199,254,740,991 soit 16 chiffres décimaux si le premier n'est pas 9). Il peut être issu de 6 bytes aléatoires.

Le hash (_integer_) de N bytes est un entier intègre en Javascript.

Le hash (_integer_) d'un string est un entier intègre en Javascript.

Les date-heures sont exprimées en millisecondes depuis le 1/1/1970, un entier intègre en Javascript (ce serait d'ailleurs aussi le cas pour une date-heure en micro-seconde).

Les dates sont exprimées en `aaaammjj` sur un entier (géré par la class `AMJ`). En base ce sont des dates UTC, elles peuvent s'afficher en date _locale_.

**Les clé RSA** sont de longueurs différentes pour la clé de cryptage (publique) et de décryptage (privée). Le résultat d'un cryptage a une longueur fixe de 256 bytes. Deux cryptages RSA avec la même clé d'un même texte donnent deux valeurs cryptées différentes.

#### Nom complet d'un avatar / groupe
Le **nom complet** d'un avatar / groupe est un couple `[nom, cle]`
- `nom` : nom lisible et signifiant, entre 6 et 20 caractères. Le nom `Comptable` est réservé. Le Comptable n'a pas de nom.
- `cle` : 32 bytes aléatoires. Clé de cryptage.
  - Le premier byte donne le _type_ de l'id, qu'on retrouve comme troisième chiffre de l'id :
    - 1 : comptable.
    - 2 : avatar.
    - 3 : groupe,
  - Les autres bytes sont aléatoires, sauf pour le Comptable où ils sont tous 0.
- A l'écran le nom est affiché sous la forme `nom@xyzt` (sauf `Comptable`) ou `xyzt` sont les 4 derniers chiffres de l'id.

**La clé d'une tribu** est composée par :
- byte 0 : 0,
- bytes 1 et 2 : numéro de la tribu, numéro d'ordre de sa déclaration par le Comptable,
- autres bytes aléatoires.

> Depuis la _clé_ d'une tribu, avatar, groupe on sait donc toujours recalculer son `id` et donc son `ns`.

> Une id **courte** est une id SANS les deux premiers chiffres de l'espace, donc relative à son espace.

**Dans les noms,** les caractères `< > : " / \ | ? *` et ceux dont le code est inférieur à 32 (donc de 0 à 31) sont interdits afin de permettre d'utiliser le nom complet comme nom de fichier.

### Authentification
L'administrateur technique a une phrase de connexion dont le hash est enregistré dans la configuration d'installation. Il n'a pas d'id. Une opération de l'administrateur est repérée parce que son _token_ donne ce hash.

Les opérations liées aux créations de compte ne sont pas authentifiées, elles vont justement enregistrer leur authentification.  
- Les opérations de GC et cells de type _ping_ ne le sont pas non plus.  
- Toutes les autres opérations le sont.

Une `sessionId` est tirée au sort par la session juste avant tentative de connexion : elle est supprimée à la déconnexion.

> **En mode SQL**, un WebSocket est ouvert et identifié par le `sessionId` qu'on retrouve sur les messages afin de s'assurer qu'un échange entre session et serveur ne concerne pas une session antérieure fermée.

> **En mode Firestore**, le serveur peut s'interrompre sans interrompre la session UI: les abonnements sont gérés dans la session UI, il n'y a pas de WebSocket et le token d'authentification permet d'indentifier la session UI. En revanche le serveur du Firestore ne doit pas tomber.

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
- `shax` : SHA de X (PBKFD de la phrase secrète complète).
- `hps1` : hash du PBKFD du début de la phrase secrète.

Le serveur recherche l'`id` du compte par `hps1` (index de `comptas`)
- vérifie que le SHA de `shax` est bien celui enregistré dans `compta` en `shay`.
- inscrit en mémoire `sessionId` avec l'`id` du compte et un `ttl`.

# Détail des documents

### Sous-objet `notification`
Les notifications servent à transmettre une information importante aux comptes avec plusieurs niveaux :
- **notification simple** d'information importante dont le compte doit tenir compte, typiquement pour réduire son volume, contacter le Comptable, etc.
- **notification bloquante**, une procédure de blocage est engagée:
  - **1-écritures bloquées** : compte avec un comportement de mode _avion_ mais pouvant toutefois chatter avec le comptable et ses sponsors.
  - **2-lectures et écritures bloquées** : le compte ne peut plus **que** chatter avec ses sponsors ou le Comptable et n'a plus accès à ses autres données.

**Enfin le compte est bloqué** (connexion impossible): la procédure a conduit à la disparition des comptes concernés. Cet état n'est pas observable que dans la situation particulière d'une tribu _bloquée_, la création de comptes par le comptable y étant interdite.

**Le Comptable a un degré de liberté** supérieur aux autres comptes:
- en niveau 1 et 2 il peut: 
  - gérer les tranches de quotas, création, gestion de quotas, gestion des comptes et de leurs quotas,
  - chatter avec les comptes,
  - gérer les notifications aux tribus et comptes.
- en niveau bloqué, il ne peut plus rien faire. 

On trouve des notifications aux niveaux suivants :
- **G-niveau global** d'un espace, émise par l'Administrateur (cryptée par la clé du Comptable) à destination de **tous** les comptes.
- **T-niveau tranche** à destination de **tous** les comptes de la tranche. Cryptée par la clé de la tribu et émise :
  - soit par le Comptable,
  - soit par un sponsor de la tranche : toutefois quand il existe une notification du Comptable elle ne peut pas être modifiée par un sponsor.
- **C-niveau compte** à destination d'un seul compte. Cryptée par la clé de sa tribu et émise :
  - soit par le Comptable,
  - soit par un sponsor de la tranche : toutefois quand il existe une notification du Comptable elle ne peut pas être modifiée par un sponsor.

Un compte peut donc faire l'objet de 0 à 3 notifications :
- le niveau applicable au jour J est le plus dégradé (le plus élevé).
- les 3 textes sont lisibles, avec leur source (Administrateur, Comptable, Sponsor).
- un compte ayant un niveau de blocage positif ne _signe plus_ ses connexions, ceci le conduira à sa disparition si la situation persiste un an.

**_data_ d'une notification :**
- `idSource`: id court de la source, du Comptable ou du sponsor, par convention 0 pour l'administrateur.
- `jbl` : jour de déclenchement de la procédure de blocage sous la forme `aaaammjj`, 0 s'il n'y a pas de procédure de blocage en cours.
- `nj` : en cas de procédure ouverte, nombre de jours après son ouverture avant de basculer en niveau 2.
- `texte` : texte informatif, pourquoi, que faire ...
- `dh` : date-heure de dernière modification (informative).

**Le _niveau_ d'un blocage dépend du jour d'observation**. On en déduit aussi:
- le nombre de jours restant avant d'atteindre le niveau **2-lectures et écritures bloquées** quand on est au niveau **1-écritures bloquées**.
- le nombre de jours avant disparition du compte, connexion impossible (niveau **3-compte bloqué**).

> Une autre forme de notification est gérée : le taux maximum d'utilisation du volume V1 ou V2 par rapport à son quota.

> Le document `compta` a une date-heure de lecture qui indique _quand_ il a lu les notifications.

## Documents `espaces`
_data_ :
- `id` : de l'espace de 10 à 89.
- `v` : 1..N
- `org` : code de l'organisation propriétaire.

- `notif` : notification de l'administrateur, cryptée par la clé du Comptable.
- `t` : numéro de _profil_ de quotas dans la table des profils définis dans la configuration (chaque profil donne un couple de quotas q1 q2).

## Documents `gcvols`
_data_ :
- `id` : id du compte disparu.

- `cletX` : clé de la tribu cryptée par la clé K du Comptable.
- `it` : index d'enregistrement du compte dans cette tribu.

Un document gcvols est créé par le GC à la détection de la disparition d'un compte, son document `versions` étant _zombi_. Il accède à son document `comptas`, et y récupère `cletX it`. Après création du `gcvols`, le document `comptas`, désormais inutile, est purgé.

Le Comptable lors de sa prochaine ouverture de session, récupère tous les gcvols et les traite :
- il obtient l'`id` de la tribu en décryptant `cletX`, `it` lui donne l'indice du compte disparu dans la table `act` de cette tribu. 
- l'item `act[it]` est y détruit, ce qui de facto accroît les quotas attribuables.
- la synthèse de la tribu est mise à jour.

## Documents `tribu`
_data_:
- `id` : numéro d'ordre de création de la tribu.
- `v` : 1..N

- `cletX` : clé de la tribu cryptée par la clé K du comptable.
- `q1 q2` : quotas totaux de la tribu.
- `stn` : statut de la notification de tribu: _0:aucune 1:simple 2:bloquante 3:bloquée_
- `notif`: notification de niveau tribu cryptée par la clé de la tribu.
- `act` : table des comptes de la tribu. L'index `it` dans cette table figure dans la propriété `it` du `comptas` correspondant :
  - `idT` : id court du compte crypté par la clé de la tribu.
  - `nasp` : si sponsor `[nom, cle]` crypté par la cle de la tribu.
  - `notif`: notification de niveau compte cryptée par la clé de la tribu (null s'il n'y en a pas).
  - `stn` : statut de la notification _du compte_: _0:aucune 1:simple 2:bloquante_
  - `q1 q2` : quotas attribués.
  - `v1 v2` : volumes **approximatifs** effectivement utilisés: recopiés de `comptas` lors de la dernière connexion du compte, s'ils ont changé de plus de 10%. **Ce n'est donc pas un suivi en temps réel** qui imposerait une charge importante de mise à jour de `tribus / syntheses` à chaque mise à jour d'un compteur de `comptas` et des charges de synchronisation conséquente.

Un sponsor (ou le Comptable) peut accéder à la liste des comptes de sa tranche : toutefois il n'a pas accès à leur carte de visite, sauf si l'avatar est connu par ailleurs, chats au moment du sponsoring ou ultérieur par phrase de contact, appartence à un même groupe ...

L'ajout / retrait de la qualité de `sponsor` n'est effectué que par le Comptable au delà du sponsoring initial par un sponsor.

## Documents `syntheses`
La mise à jour de tribu est de facto peu fréquente : une _synthèse_ est recalculée à chaque mise à jour de `stn, q1, q2` ou d'un item de `act`.

_data_:
- `id` : id de l'espace.
- `v` : date-heure d'écriture (purement informative).

- `atr` : table des synthèses des tribus de l'espace. L'indice dans cette table est l'id court de la tribu. Chaque élément est la sérialisation de:
  - `q1 q2` : quotas de la tribu.
  - `a1 a2` : sommes des quotas attribués aux comptes de la tribu.
  - `v1 v2` : somme des volumes (approximatifs) effectivement utilisés.
  - `ntr1` : nombre de notifications tribu_simples.
  - `ntr2` : nombre de notifications tribu bloquantes.
  - `ntr3` : nombre de notifications tribu bloquées.
  - `nbc` : nombre de comptes.
  - `nbsp` : nombre de sponsors.
  - `nco1` : nombres de comptes ayant une notification simple.
  - `nco2` : nombres de comptes ayant une notification bloquante.

`atr[0]` est la somme des `atr[1..N]` calculé en session, pas stocké.

## Documents `comptas`
_data_ :
- `id` : numéro du compte, id de son avatar principal.
- `v` 1..N.
- `hps1` : le hash du PBKFD du début de la phrase secrète du compte.

- `shay`, SHA du SHA de X (PBKFD de la phrase secrète).
- `kx` : clé K du compte, cryptée par X (PBKFD de la phrase secrète courante).
- `dhvu` : date-heure de dernière vue des notifications par le titulaire du compte, cryptée par la clé K.
- `sp` : 1: est sponsor
- `cletX` : clé de la tribu cryptée par la clé K du comptable.
- `cletK` : clé de la tribu cryptée par la clé K du compte : si cette clé a une longueur de 256, elle est cryptée par la _clé publique RSA_ du compte (en cas de changement de tribu forcé par le comptable).
- `it` : index du compte dans la table `act` de sa tribu.
- `mavk` : map des avatars du compte. 
  - _clé_ : id court de l'avatar cryptée par la clé K du compte.
  - _valeur_ : couple `[nom clé]` de l'avatar crypté par la clé K du compte.
- `compteurs`: compteurs sérialisés (non cryptés), dont `q1 q2` les quotas actuels du compte qui sont dupliqués dans son entrée `act` de sa tribu.

**Pour le Comptable seulement**
-`atr` : table des tribus : `{clet, info, q1, q2}` crypté par la clé K du comptable.
  - `clet` : clé de la tribu (donne aussi son id, index dans `act / astn`).
  - `info` : texte très court pour le seul usage du comptable.
  - `q1 q2` : quotas globaux de la tribu.
- `astn` : table des statuts de notification des tribus _0:aucune 1:simple 2:bloquante_.

La première tribu d'`id` 1 est la tribu _primitive_, celle du comptable et est indestructible.

**Remarques :**  
- Le document est mis à jour à minima à chaque mise à jour d'une note (volumes dans compteurs).
- La version de `comptas` lui est spécifique (ce n'est pas la version de l'avatar principal du compte).
- `cletX it` sont transmis par le GC dans un document `gcvols` pour notifier au Comptable, quel est le compte détecté disparu (donc de sa tribu).
- Le fait d'accéder à `atr` permet d'obtenir la _liste des tribus existantes_ de l'espace. Le serveur peut ainsi recalculer la statistique de l'espace (agrégation des compteurs des tribus) en scannant ces tribus.

## Documents `versions`
_data_ :
- `id` : id d'avatar / groupe
- `v` : 1..N, plus haute version attribuée aux documents de l'avatar / groupe dont leurs sous-collections.
- `dlv` : date de fin de vie, peut être future pour un avatar, est toujours dépassée pour un groupe. Date de purge définitive un an plus tard.
- `{v1 q1 v2 q2}`: pour un groupe, volumes et quotas des notes.

## Documents `avatars`
_data_:
- `id` : id de l'avatar.
- `v` : 1..N.
- `vcv` : version de la carte de visite afin qu'une opération puisse détecter (sans lire le document) si la carte de visite est plus récente que celle qu'il connaît.
- `hpc` : hash de la phrase de contact.

**Données n'existant que pour un avatar principal**
- `mck` : map des mots-clés du compte cryptée par la clé K -la clé est leur code 1-99- ("code": nom@catégorie).
- `memok` : mémo personnel du compte.

**Données disponibles pour tous les avatars**
- `pub` : clé publique RSA.
- `privk`: clé privée RSA cryptée par la clé K.
- `cva` : carte de visite cryptée par la clé _CV_ de l'avatar `{v, photo, info}`.
- `lgrk` : map :
  - _clé_ : `ni` : numéro d'invitation dans le groupe. Hash de la clé inversée du groupe crypté par la  clé de l'avatar.
  - _valeur_ : cryptée par la clé K du compte de `[nomg, clég, im]` reçu sur une invitation. Pour une invitation en attente de refus / acceptation _valeur_ est cryptée par la clé publique RSA de l'avatar
  - une entrée est effacée par la résiliation du membre au groupe ou son effacement d'invitation explicite par un animateur ou l'avatar lui-même (ce qui l'empêche de continuer à utiliser la clé du groupe).
- `pck` : PBKFD de la phrase de contact cryptée par la clé K.
- `napc` : `[nom, cle]` de l'avatar cryptée par le PBKFD de la phrase de contact.

**Invitation à un groupe**  
L'invitant connaît le `[nom, clé]` de l'invité qui est déjà dans la liste des membres en tant que simple contact. L'invitation consiste à :
- inscrire un terme `[nomg, cleg, im]` dans `lgrk` de son avatar (ce qui donne la clé du groupe à l'invité, donc accès à la carte de visite du groupe) en le cryptant par la clé publique RSA l'invité,
- l'acceptation par l'avatar transcode l'entrée de `lgrk` par sa clé K.

### Cartes de visites
La création / mise à jour s'opère dans le document `avatars`.

**Mises à jour des cartes de visite des membres**
- la première inscription se fait à l'ajout de l'avatar comme _contact_ du groupe.
- en session, lorsque la page listant les membres d'un groupe est ouverte, elle envoie une requête au serveur donnant la liste des couples `[id, v]` des `ids` des membres et de leur version de carte de visite détenue dans le document `membre`.
- pour chacune ayant une version postérieure, le serveur la met à jour dans `membre`.
- ceci permet de voir en session des cartes de visite toujours à jour et d'éviter d'effectuer une opération longue à chaque mise à jour des cartes de visite par un avatar pour tous les groupes dont il est membre.

**Mise à jour dans les chats**
- à la mise à jour d'un chat, les cartes de visites des deux côtés sont rafraîchies (si nécessaire).
- en session au début d'un processus de consultation des chats, la session fait rafraîchir incrémentalement les cartes de visite qui ne sont pas à jour dans les chats: un chat ayant `vcv` en index, la nécessité de mise à jour se détecte sur une lecture d'index sans lire le document correspondant.

## Documents `chats`
Un chat est ne disparaît qu'à la disparition des deux avatars en cause.

Un chat est une ardoise commune à deux avatars I et E:
- vis à vis d'une session :
  - I est l'avatar _interne_,
  - E est un avatar _externe_ connu comme _contact_.
- pour être écrite par I :
  - I doit connaître le `[nom, cle]` de E : membre du même groupe, chat avec un autre avatar du compte, ou obtenu en ayant fourni la phrase de contact de E.
  - le chat est dédoublé, une fois sur I et une fois sur E.
- un chat a une clé de cryptage `cc` propre générée à sa création (première écriture):
  - cryptée par la clé K,
  - ou cryptée par la clé publique de l'avatar I (par exemple) : dans ce cas la première écriture de contenu de I remplacera cette clé par celle cryptée par K.
- un chat a un comportement d'ardoise : chaque écriture de l'un _écrase_ la totalité du contenu pour les deux. Un numéro séquentiel détecte les écritures croisées risquant d'ignorer la mise à jour de l'un par celle de l'autre.
- si I essaie d'écrire à E et que E a disparu, le statut `st` de I vaut 1 pour informer la session.

L'`id` d'un exemplaire d'un chat est le couple `id, ids`.

_data_:
- `id`: id de A,
- `ids`: hash du cryptage de `idA_court/idB_court` par la clé de A.
- `v`: 1..N.
- `vcv` : version de la carte de visite.

- `st` : statut:
  - 0 : le chat est _apriori_ vivant des 2 côtés
  - 1 : _l'autre_ a été détecté disparu : 
- `mc` : mots clés attribués par l'avatar au chat.
- `cva` : `{v, photo, info}` carte de visite de _l'autre_ au moment de la création / dernière mise à jour du chat, cryptée par la clé de _l'autre_.
- `cc` : clé `cc` du chat cryptée par la clé K du compte de I ou par la clé publique de I.
- `seq` : numéro de séquence de changement du texte.
- `contc` : contenu crypté par la clé `cc` du chat.
  - `na` : `[nom, cle]` de _l'autre_.
  - `dh`  : date-heure de dernière mise à jour.
  - `txt` : texte du chat.

### _Contact direct_ entre A et B
Supposons que B veuille ouvrir un chat avec A mais n'en connaît pas le nom / clé.

A peut avoir communiqué à B sa _phrase de contact_ qui ne peut être enregistrée par A que si elle est, non seulement unique, mais aussi _pas trop proche_ d'une phrase de contact déjà déclarée.

B peut écrire un chat à A à condition de fournir cette _phrase de contact_:
- l'avatar A a mis à disposition son nom complet `[nom, cle]` crypté par le PBKFD de la phrase de contact.
- muni de ces informations, B peut écrire un chat à A.
- le chat comportant le `[nom cle]` de B, A est également en mesure d'écrire sur ce chat, même s'il ignorait avant le nom complet de B.

## Documents `sponsorings`
P est le parrain-sponsor, F est le filleul-sponsorisé.

_data_:
- `id` : id de l'avatar sponsor.
- `ids` : hash de la phrase de parrainage, 
- `v`: 1..N.
- `dlv` : date limite de validité

- `st` : statut. _0: en attente réponse, 1: refusé, 2: accepté, 3: détruit / annulé_
- `pspk` : phrase de sponsoring cryptée par la clé K du sponsor.
- `bpspk` : PBKFD de la phrase de sponsoring cryptée par la clé K du sponsor.
- `dh`: date-heure du dernier changement d'état.
- `descr` : crypté par le PBKFD de la phrase de sponsoring:
  - `na` : `[nom, cle]` de P.
  - `cv` : `{ v, photo, info }` de P.
  - `naf` : `[nom, cle]` attribué au filleul.
  - `clet` : clé de sa tribu.
  - `sp` : vrai si le filleul est lui-même sponsor.
  - `quotas` : `[v1, v2]` quotas attribués par le sponsor.
- `ardx` : ardoise de bienvenue du sponsor / réponse du filleul cryptée par le PBKFD de la phrase de sponsoring

**Remarques**
- la `dlv` d'un sponsoring peut être prolongée (jamais rapprochée). Le sponsoring est purgé par le GC quotidien à cette date, en session et sur le serveur, les documents ayant atteint cette limite sont supprimés et ne sont pas traités.
- Le sponsor peut annuler son `sponsoring` avant acceptation, en cas de remord son statut passe à 3.

**Si le filleul refuse le sponsoring :** 
- Il écrit dans `ardx` la raison de son refus et met le statut du `sponsorings` à 1. 

**Si le filleul ne fait rien à temps :** 
- `sponsorings` finit par être purgé par `dlv`. 

**Si le filleul accepte le sposoring :** 
- Le filleul crée son compte / avatar principal: `naf` donne l'id de son avatar et son nom. L'identifiant de la tribu pour le compte sont obtenu de `clet`.
- la `compta` du filleul est créée et créditée des quotas attribués par le parrain. Si le sponsor n'est pas sponsor de sa tribu, les quotas attribués au filleul lui sont déduits.
- la `tribu` est mise à jour (quotas attribués), le filleul est mis dans la liste des comptes `act` de `tribu`.
- un mot de remerciement est écrit par le filleul au parrain sur `ardx` **ET** ceci est dédoublé dans un chat filleul / sponsor.
- le statut du `sponsoring` est 2.

## Documents `notes`
La clé de cryptage `cles` d'une note est selon le cas :
- *note personnelle d'un avatar A* : la clé K de l'avatar.
- *note d'un groupe G* : la clé du groupe G.

Le droit de mise à jour d'une note est contrôlé par le couple `x p` :
- `x` : pour une note de groupe, indique quel membre (son `im`) a l'exclusivité d'écriture et le droit de basculer la protection.
- `p` indique si le texte est protégé contre l'écriture ou non.

**Note temporaire et permanente**
Par défaut à sa création une note est _permanente_. Pour une note _temporaire_ :
- son `st` contient la _date limite de validité_ indiquant qu'elle sera automatiquement détruite à cette échéance.
- une note temporaire peut être prolongée, tout en restant temporaire.
- par convention le `st` d'une note permanente est égal à `99999999`. Une note temporaire peut être rendue permanente par :
  - l'avatar propriétaire pour une note personnelle.
  - un des animateurs du groupe pour une note de groupe.
- **une note temporaire ne peut pas avoir de fichiers attachés**.

_data_:
- `id` : id de l'avatar ou du groupe.
- `ids` : identifiant relatif à son avatar.
- `v` : 1..N.

- `st` :
  - `99999999` pour un _permanent_.
  - `aaaammjj` date limite de validité pour un _temporaire_.
- `im` : exclusivité dans un groupe. L'écriture et la gestion de la protection d'écriture sont restreintes au membre du groupe dont `im` est `ids`. 
- `p` : _0: pas protégé, 1: protégé en écriture_.
- `v1` : volume du texte.
- `v2` : volume total des fichiers attachés.
- `mc` :
  - note personnelle : vecteur des index de mots clés.
  - note de groupe : map sérialisée,
    - _clé_ : `im` de l'auteur (0 pour les mots clés du groupe),
    - _valeur_ : vecteur des index des mots clés attribués par le membre.
- `txts` : crypté par la clé de la note.
  - `d` : date-heure de dernière modification du texte.
  - `l` : liste des auteurs pour une note de groupe.
  - `t` : texte gzippé ou non.
- `mfas` : map des fichiers attachés.
- `refs` : triplet `[id_court, ids, nomp]` crypté par la clé de la note, référence de sa  note _parent_.

**_Remarque :_** une note peut être explicitement supprimée. Afin de synchroniser cette forme particulière de mise à jour pendant un an (le délai maximal entre deux login), le document est conservé _zombi_ avec un _data_ absente / null. Il sera purgé avec son avatar / groupe.

**Mots clés `mc`:**
- Note personnelle : `mc` est un vecteur d'index de mots clés. Les index sont ceux du compte et de l'organisation.
- Note de groupe : `mc` est une map :
  - _clé_ : `im`, indice du membre dans le groupe. Par convention 0 désigne le groupe lui-même.
  - _valeur_ : vecteur d'index des mots clés. Les index sont ceux personnels du membre, ceux du groupe, ceux de l'organisation.

**Map des fichiers attachés :**
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

La suppression d'un note s'accompagne de la suppressions de N fichiers dans un seul _répertoire_.

## Documents `transferts`
_data_:
- `id` : id du groupe ou de l'avatar du note.
- `ids` : `idf` du fichier en cours de chargement.
- `dlv` : date-limite de validité pour nettoyer les uploads en échec sans les confondre avec un en cours.

## Documents `groupes`
Un groupe est caractérisé par :
- son entête : un document `groupes`.
- la liste de ses membres : des documents `membres` de sa sous-collection `membres`.

L'hébergement d'un groupe est noté par :
- `imh`: indice membre de l'avatar hébergeur. 
- `idhg` : id du **compte** hébergeur crypté par la clé du groupe.
- `dfh`: date de fin d'hébergement qui vaut 0 tant que le groupe est hébergé.

Le compte peut mettre fin à son hébergement:
- `dfh` indique le jour de la fin d'hébergement. Les notes ne peuvent plus être mis à jour _en croissance_ quand `dfh` existe. 
- à `dfh`, 
  - le GC met `dlv` dans le `versions` du groupe à la date du jour.
  - les documents `groupe notes membres` sont purgés par le GC.
  - le groupe est retiré au fil des connexions et des synchronisations des maps `lgrk` des avatars qui le référencent (ce qui peut prendre jusqu'à un an).
  - le document `versions` du groupe sera purgé par le GC à `dlv` (dans 365 jours).

**Les membres d'un groupe** reçoivent lors de leur création (quand ils sont inscrits en _contact_) un indice membre `ids` :
- cet indice est attribué en séquence : le premier membre est celui du créateur du groupe a pour indice 1.
- le statut de chaque membre d'index `ids` est stocké dans `ast[ids]`

**Modes d'invitation**
- _simple_ : dans ce mode (par défaut) un _contact_ du groupe peut-être invité par un animateur (un suffit).
- _unanime_ : dans ce mode il faut que _tous_ les animateurs aient validé l'invitation (le dernier ayant validé provoque la validation).
- pour passer en mode _unanime_ il suffit qu'un seul animateur le demande.
- pour revenir au mode _simple_ depuis le mode _unanime_, il faut que tous les animateurs aient validé ce retour.

**Oubli et disparition**
- la _disparition_ correspond au fait que l'avatar du membre n'existe plus, soit par non connexion au cours des 365 jours qui précèdent, soit par auto-résiliation de l'avatar.
- _l'oubli_ a été explicitement demandé, soit par le membre lui-même soit par un animateur. 
- dans les deux cas le membre est _effacé_, ni son nom, ni son identifiant, ni sa carte de visite ne sont accessibles.
- un membre _oublié / disparu_ n'apparaît plus que par #99 où 99 était son indice. Ainsi dans un note, la liste des auteurs peut faire apparaître des membres existants (connus avec nom et carte de visite) ou des membres _disparus / oubliés_ avec juste leur indice.
- toutefois si le membre est de nouveau contacté, il récupère son indice antérieur (pas un nouveau) mais son historique de dates d'invitation, début et fin d'activité sont réinitialisées. C'est une nouvelle vie dans le groupe mais avec la même identité, les notes écrites dans la vie antérieure mentionnent à nouveau leur auteur au lieu d'un numéro #99.

_data_:
- `id` : id du groupe.
- `v` :  1..N, version du groupe de ses notes et membres.
- `dfh` : date de fin d'hébergement.

- `idhg` : id du compte hébergeur crypté par la clé du groupe.
- `imh` : indice `im` du membre dont le compte est hébergeur.
- `msu` : mode _simple_ ou _unanime_.
  - `null` : mode simple.
  - `[ids]` : mode unanime : liste des indices des animateurs ayant voté pour le retour au mode simple. La liste peut être vide mais existe.
- `pe` : _0-en écriture, 1-protégé contre la mise à jour, création, suppression de notes_.
- `ast` : table des statuts des membres (dès qu'ils ont été inscrits en _contact_) :
  - 10: contact,
  - 30,31,32: **actif** (invitation acceptée) en tant que lecteur / auteur / animateur, 
  - 40: invitation refusée,
  - 50: résilié, 
  - 60,61,62: invité en tant que lecteur / auteur / animateur, 
  - 70,71,72: invitation à confirmer (tous les animateurs n'ont pas validé) en tant que lecteur / auteur / animateur, 
  - 0: disparu / oublié.
- `nag` : table des hash de la clé du membre cryptée par la clé du groupe.
- `mcg` : liste des mots clés définis pour le groupe cryptée par la clé du groupe.
- `cvg` : carte de visite du groupe cryptée par la clé du groupe `{v, photo, info}`.
- `ardg` : ardoise cryptée par la clé du groupe.

**Remarque sur `ardg`**
- texte libre que tous les membres du groupe actifs et invités peuvent lire et écrire.
- un invité qui refuse son invitation peut écrire sur l'ardoise une explication.
- on y trouve typiquement,
  - une courte présentation d'un nouveau contact, voire quelques lignes de débat (si c'est un vrai débat un note du groupe est préférable),
  - un mot de bienvenue pour un nouvel invité,
  - un mot de remerciement d'un nouvel invité.
  - des demandes d'explication de la part d'un invité.

## Documents `membres`
_data_:
- `id` : id du groupe.
- `ids`: identifiant, indice de membre relatif à son groupe.
- `v` : 1..N.
- `vcv` : version de la carte de visite du membre.
- `dlv` : date de dernière signature + 365 lors de la connexion du compte de l'avatar membre du groupe.

- `ddi` : date de la _dernière_ invitation.
- `dda` : date de début d'activité (jour de la _première_ acceptation).
- `dfa` : date de fin d'activité (jour de la _dernière_ suspension).
- `inv` : validation de la dernière invitation:
  - `null` : le membre n'a pas été invité où le mode d'invitation du groupe était _simple_ au moment de l'invitation.
  - `[ids]` : liste des indices des animateurs ayant validé l'invitation.
- `mc` : mots clés du membre à propos du groupe.
- `infok` : commentaire du membre à propos du groupe crypté par la clé K du membre.
- `nag` : `[nom, cle]` : nom et clé de l'avatar crypté par la clé du groupe.
- `cva` : carte de visite du membre `{v, photo, info}` cryptée par la clé du membre.

### Cycle de vie
- un document `membres` existe dans tous les états SAUF 0 _disparu / oublié_.
- un auteur d'un note `disparu / oublié`, apparaît avec juste un numéro (sans nom), sans pouvoir voir son membre dans le groupe.

#### Transitions d'état d'un membre:
- de contact : 
  - invitation -> invité
  - disparition -> disparu
  - demande d'oubli par un animateur -> disparu
- de invité :
  - refus -> invitation refusée
  - refus avec oubli -> disparu
  - acceptation -> actif
  - retrait d'invitation par un animateur -> contact (`dfa` est 0) OU suspendu (`dfa` non 0, il a été actif)
  - disparition -> disparu
  - demande d'oubli par un animateur -> disparu
- de actif :
  - résiliation / auto-résiliation -> résilié
  - résiliation / auto-résiliation avec oubli -> disparu
  - disparition -> disparu
- de invitation refusée :
  - invitation -> invité
  - disparition -> disparu
  - demande d'oubli par un animateur -> disparu
- de résilié :
  - invitation -> invité
  - disparition -> disparu
  - demande d'oubli par un animateur -> disparu
- de disparu / oubli : aucune transition (le document `membres` a été purgé)

**Simple contact inscrit par un membre du groupe**
- le membre du groupe qui l'a inscrit, 
  - lui a attribué un index (taille de `ast` du groupe) : a vérifié que, `nig` (le hash de sa clé crypté n'était pas déjà cité dans `nig` du groupe) et l'inscrit.
  - a marqué le statut _contact_ dans cet `ast`,
- dans `membre` seuls `nag cva` sont significatifs. 

**Invité suite à une invitation par un animateur**
- invitation depuis un état _contact_  _résilié_ _refus d'invitation_
- son statut dans `ast` passe à 60, 61, ou 62.
- dans `membres` `nag cva ddi` sont significatifs.
- inscription dans `lgrk` de son avatar (crypté par sa clé RSA publique).
- si `dda`, c'est une ré-invitation après résiliation :  dans `membre` `mc infok` peuvent être présents.

**Retrait d'invitation par un animateur**
- depuis un état _invité_,
- retiré du `lgrk` de l'avatar du membre,
- son statut dans `ast` passe à:
  - _résilié_ : si `dfa` existe, c'était un ancien membre actif,
  - _contact_ : `dfa` est 0, il n'a jamais été actif.
- dans `membres` seuls `nag cva ddi` sont significatifs, possiblement `mc infok` si le membre avait été actif. 

**Actif suite à l'acceptation d'une invitation par le membre**
- son statut dans `ast` passe à 30, 31, ou 32.
- dans `membres` :
  - `dda` : date de première acceptation est remplie si elle ne l'était pas.
  - toutes les propriétés sont significatives.
  - la carte de visite `cva` est remplie.
- le groupe est toujours inscrit dans l'avatar du membre  dans `lgrk`.

**Refus d'invitation par le membre**
- depuis un état _invité_.
- retiré du `lgrk` de l'avatar du membre,
- son statut dans `ast` passe à 40.
- si `dda`, c'était une ré-invitation après résiliation dans `membre` `mc infok` peuvent être présents.
- dans `membre` rien ne change.

**Oubli demandé par un animateur ou le membre lui-même**
- depuis un état _contact, invité, actif, résilié_
- retiré du `lgrk` de l'avatar du membre,
- actions: 
  - refus d'invitation avec oubli,
  - résiliation ou auto-résiliation avec oubli, 
  - demande par un animateur.
- son statut dans `ast` passe à 0. Son index ne sera jamais réutilisé par un autre avatar. Son entrée dans `nig` n'est PAS remise à 0 : s'il est à nouveau contacté, il obtiendra le MEME indice.
- son document `membres` est purgé.

**Résiliation d'un membre par un animateur ou auto résiliation**
- depuis un état _actif_.
- son statut passe à _résilié_ dans `ast` de son groupe.
- le membre n'a plus le groupe dans le `lgrk` de son avatar.
- dans son document `membres` `dfa` est positionnée à la date du jour.
- différences avec un état _contact_: l'avatar membre a encore des mots clés, une information et retrouvera ces informations s'il est ré-invité.

**Disparitions d'un membre**
- voir la section _Gestion des disparitions_

## Objet `compteurs`
- `j` : **date du dernier calcul enregistré** : par exemple le 17 Mai de l'année A
- **pour le mois en cours**, celui de la date ci-dessus :
  - `q1 q2`: quotas actuels.
  - `v1 v2 v1m v2m`: volumes actuels des notes et moyens sur le mois en cours.
  - `trj` : transferts cumulés du jour.
  - `trm` : transferts cumulés du mois.
- `tr8` : log() des volumes des transferts cumulés journaliers de pièces jointes sur les 7 derniers jours + total (en tête) sur ces 7 jours.
- **pour les 12 mois antérieurs** `hist` (dans l'exemple ci-dessus Mai de A-1 à Avril de A),
  - `q1 q2` quotas q1 et q2 au dernier jour du mois.
  - `v1 v2` log() des volumes moyens du mois (log de `v1m` `v2m` ci-dessus au dernier jour du mois)
  - `tr` log() du total des transferts des pièces jointes dans le mois (log de `trm` à la fin du mois).

## Mots clés, principes et gestion
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

# Gestion des disparitions

## Signatures des avatars dans `versions` et `membres`
Les comptes sont censés avoir au maximum 365 jours entre 2 connexions faute de quoi ils sont considérés comme `disparus`.

10 jours après la disparition d'un compte, 
- ses avatars secondaires vont être détectés disparus par le GC.
- ses membres dans les groupes auxquels il participe vont être détectés disparus par le GC ce qui peut entraîner la disparition de groupes n'ayant plus d'autres membres _actifs_.

Les `dlv` (date limite de validité,
- dans `versions` pour les avatars et groupes, 
- dans `membres`.

Elles sont exprimées par un entier `aaaammjj`et signalent que ce jour-là, l'avatar -le cas échéant le compte- ou le membre est considéré comme _disparu_.

A chaque connexion d'un compte, son avatar principal _prolonge_ les `dlv` de :
- son propre avatar et ses avatars secondaires dans leur document `versions`.
- des membres (sur `membres`) des groupes connus par ses avatars dans `lgrk`. 

Les `dlv` sont également fixées:
- pour un avatar, à sa création dans son `versions`.
- pour un membre d'un groupe, à l'acceptation de son invitation.

> Les `dlv` ne sont pas _prolongées_ si le document `tribus` fait l'objet d'une procédure de blocage.

**Règles:** 
- les `dlv` sont gérées par _décade_ : une `dlv` est toujours définie ou reculée à un multiple de 10 jours. Ceci évite de multiplier des mises à jour en cas de connexions fréquentes et de faire des rapprochements entre avatars / groupes en fonction de leur dernière date-heure de connexion.
- si l'avatar principal a sa `dlv` repoussée le 10 mars par exemple, ses autres avatars et ses membres seront reculés au 20 mars.
- les avatars secondaires seront en conséquence _non disparus_ pendant 10 jours alors que leur compte ne sera plus connectable:
  - sur un chat la carte de visite d'un avatar secondaire apparaîtra pendant 10 jours alors que le compte de _l'autre_ a déjà été détecté disparu.
  - les groupes pourront faire apparaître des membres pendant 10 jours alors que leur compte a déjà été détecté disparu.

### Disparition d'un compte
#### Effectuée par le GC
Le GC détecte la disparition d'un compte sur dépassement de la `dlv` dans le `versions` de son avatar principal :
- il ne connaît pas la liste de ses avatars secondaires qu'il détectera _disparu_ 10 jours plus tard.
- le GC n'a pas accès à l'`id` la tribu d'un compte et ne peut donc pas mettre à jour son élément `ast[it]` dans son document `tribus`:
  - il écrit en conséquence un document `gcvols` avec les informations tirées du document `comptas` du compte disparu (`cletX` clé de la tribu cryptée par la clé K du comptable, `it` index du compte dans sa tribu).
  - la prochaine connexion du Comptable scanne les `gcvols` et effectue la suppression de l'entrée `it` dans la tribu dont l'id est extraite de `cletX`.

La disparition d'un compte est un _supplément_ d'action par rapport à la _disparition_ d'un avatar secondaire.

#### Auto-résiliation d'un compte
Elle suppose une auto-résiliation préalable de ses avatars secondaires, puis de son avatar principal:
- l'opération de mise à jour du document `tribus` est lancée, la session ayant connaissance de l'`id` de la tribu et de l'indice `it` de l'entrée du compte dans `act` du document  `tribus`. Le mécanisme `gcvols` n'a pas besoin d'être mis en oeuvre.

### Disparition d'un avatar
#### Sur demande explicite
Dans la même transaction :
- pour un avatar secondaire, le document `comptas` est mis à jour par suppression de son entrée dans `mavk`.
- pour un avatar principal, l'opération de mise à jour du document `tribus` est lancée, 
  - l'entrée du compte dans `act` du documet `tribus` est détruite,
  - le document `comptas` est purgé.
- le document `versions` de l'avatar a sa `dlv` fixée à aujourd'hui et devient _zombi et immuable_. Ceci provoquera un peu plus tard la purge par le GC de avatars `chats notes sponsorings transferts`.
- pour tous les chats de l'avatar:
  - le chat E, de _l'autre_, est mis à jour: son `st` passe à _disparu_, sa `cva` passe à null.
- pour tous les groupes dont l'avatar est membre:
  - purge de son document `membre`.
  - mise à jour dans son document `groupes` du statut `ast` à _disparu_.
  - si c'était l'hébergeur du groupe, mise à jour des données de fin d'hébergement.
  - si c'était le dernier membre _actif_ du groupe:
    - dans le document `versions` du groupe, `dlv` est fixée à aujourd'hui et devient _zombi / immuable_, ce qui permet à une synchronisation avec une autre session (ou une connexion) de détecter la disparition du groupe.

Dans les autres sessions ouvertes sur le même compte :
- si c'est l'avatar principal, la session, 
  - est notifiée par un changement du document `tribus` (la disparition de `comptas` n'est pas notifiée -c'est une purge-).
  - constate dans le document `tribus` la disparition de l'entrée du compte par compraison avec l'état connu antérieurement,
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

#### Effectuée par le GC
Le GC détecte la disparition d'un avatar par la `dlv` dans `versions` inférieure ou égale à aujourd'hui, état _zombi_ : **le compte a déjà disparu**.

**Conséquences :**
- il reste des chats référençant cet avatar et dont le statut n'est pas encore marqué _disparu_ (mais le GC n'y a pas accès).
- il reste des groupes dont le statut du membre correspondant n'est pas _disparu_ et des documents `membres` référençant un avatar (principal) disparu.

### Disparition d'un membre
#### Résiliation ou auto résiliation d'un membre
C'est une opération _normale_:
- purge de son document `membres`.
- mise à jour dans son document `groupes` de son statut dans `ast` à _disparu_.
- si c'était l'hébergeur du groupe, mise à jour des données de fin d'hébergement.
- si c'était le dernier membre _actif_ du groupe :
  - `dlv` est mise à aujourd'hui dans le document `versions` du groupe, devient _zombi / immuable_. Ceci permet aux autres sessions de détecter la disparition du groupe.

#### Effectuée par le GC
Détection par la `dlv` inférieure à aujourd'hui (état _zombi_) du `membres`.
- suppression du document `membres`,
- mise à jour de son état dans le document `groupes`,
- si c'est le dernier actif, `dlv` de `versions` du groupe est mise à aujourd'hui (devient zombi / immuable).

### Chat : détection de la disparition de l'avatar E
A la connexion d'une session les chats avec des avatars E disparus ne sont pas détectés.

Lors d'une synchronisation de son chat (I), l'auto suppression de l'avatar E dans une autre session est détectée par l'état _disparu_ de E inscrit sur le chat (I).

Lors de l'ouverture de la page listant les _chats_ d'un de ses avatars, 
- la session reçoit les cartes de visite mises à jour ET les avis de disparitions des contacts E.
- lors de l'écriture d'un chat, la session reçoit aussi ce même avis de disparition éventuelle de l'avatar E.
- le _contact_ E est marqué _disparu_ en mémoire (le chat I y est mis à jour ainsi qu'en IDB).

> Un _contact_ peut donc apparaître _à tort_ en session alors que l'avatar / compte correspondant a été résilié du fait, a) qu'il est un des comptes de la tribu de la session, b) qu'un chat est ouvert avec lui. Toutefois l'ouverture du chat ou de la page des chats, rétablit cette distorsion temporelle provisoire.

# Opérations GC
### Singleton `checkpoint` (id 1)
_data_ :
- `id` : 1
- `v` : date-time de sa dernière mise à jour ou 0 s'il n'a jamais été écrit.

- `start` : date-heure de lancement du dernier GC.
- `duree` : durée de son exécution en ms.
- `nbTaches` : nombre de taches terminées avec succès sur 6.
- `log` : trace des exécutions des tâches: {}
  - `nom` : nom.
  - `retry` : numéro de retry.
  - `start` : date-heure de lancement.
  - `duree` : durée en ms.
  - `err` : si sortie en exception, son libellé.
  - `stats` : {} compteurs d'objets traités (selon la tâche).

### Gestion des documents `versions` _zombi_
Un document `versions` zombi a une `dlv` antérieure à aujourd'hui : il faut purger toutes les sous-collections correspondantes, plus le document `avatars` ou `groupes` correspondant.

Afin d'éviter que le GC ne tente d'effectue à nouveau cette opération les jours suivants alors que ces documents ont déjà été purgés, la `dlv` du documents versions est reculée d'un an, sans changer de version: le nettoyage des sous-collections ne s'effectue donc que pour les versions ayant une `dlv` passée mais pas passée de plus d'un an.

In fine les documents `versions` dont la `dlv` est passée de plus de 2 ans sont purgées.

### `GCHeb` : traitement des fins d'hébergement
L'opération récupère toutes les ids des documents `groupes` où `dfh` est inférieure ou égale au jour courant.

Une transaction par groupe :
- dans le document `versions` du groupe, la `dlv` est positionnée à aujord'hui (devient zombi).

### `GCGro` : Détection des groupes orphelins et suppression des membres
L'opération récupère toutes les `id / ids` des documents `membres` dont la `dlv` est inférieure ou égale au jour courant.

Une transaction par document `groupes`:
- mise à jour des statuts des membres perdus,
- suppression de ces documents `membres`,
- si le groupe est orphelin (n'a plus de membres actifs), suppression du groupe:
  - la `dlv` de son document `versions` est mise à aujourd'hui (il est zombi).

### `GCPag` : purge des avatars et des groupes
L'opération récupère toutes les `id` des documents `versions` dont la `dlv` est postérieure auj - 365 et antérieure ou égale à auj.

Dans l'ordre pour chaque `id`:
- par compte, une transaction de récupération du volume (si `comptas` existe encore, sinon c'est que ça a déjà été fait),
- purge de leurs sous-collections,
- purge de leur avatar / groupe,
- purge de leurs fichiers,
- HORS TRANSACTION forçage de la `dlv` du document `versions` à aujourd'hui moins 2 ans.

**Une transaction pour chaque compte :**
- son document `comptas` :
  - est lu pour récupérer `cletX it`;
  - un document `gcvols` est inséré avec ces données : son `id` est celle du compte.
  - les `gcvols` seront traités par la prochaine ouverture de session du comptable de l'espace ce qui supprimera l'entrée du compte dans tribu (et de facto libèrera des quotas).
  - le document `comptas` est purgé afin de ne pas récupérer le volume plus d'une fois.

### `GCFpu` : traitement des documents `fpurges`
L'opération récupère tous les items d'`id` de fichiers depuis `fpurges` et déclenche une purge sur le Storage.

Les documents `fpurges` sont purgés.

### `GCTra` : traitement des transferts abandonnés
L'opération récupère toutes les documents `transferts` dont les `dlv` sont antérieures ou égales à aujourd'hui.

Le fichier `id / idf` cité dedans est purgé du Storage des fichiers.

Les documents `transferts` sont purgés.

### `GCDlv` : purge des versions / sponsorings obsolètes
L'opération récupère tous les documents `versions` de `dlv` antérieures à jour j - 2 ans. Ces documents sont purgés.

L'opération récupère toutes les documents `sponsorings` dont les `dlv` sont antérieures ou égales à aujourd'hui. Ces documents sont purgés.

## Lancement global quotidien
Le traitement enchaîne, en asynchronisme de la requête l'ayant lancé : 
- `GCHeb GCGro GCPag GCFpu GCTra GCDlv`

En cas d'exception de l'un deux, une seule relance est faite après une attente d'une heure.

> Remarque : le traitement du lendemain est en lui-même une reprise.

> Pour chaque opération, il y a N transactions, une par document à traiter, ce qui constitue un _checkpoint_ naturel fin.

# Index

## SQL
`sqlite/schema.sql` donne les ordres SQL de création des tables et des index associés.

Rien de particulier : sont indexés les colonnes requérant un filtrage ou un accès direct par la valeur de la colonne.

## Firestore
`firestore.index.json` donne le schéma des index: le désagrément est que pour tous les attributs il faut indiquer s'il y a ou non un index et de quel type, y compris pour ceux pour lesquels il n'y en a pas.

**Les règles génériques** suivantes ont été appliquées:

_data_ n'est jamais indexé.

Il n'y a pas _d'index composite_. Mais en fait dans l'esprit les attributs `id_v` et `id_vcv` calculés (pour Firestore seulement) avant création / mise à jour d'un document, sont bel et bien des pseudo index composites mais simplement déclarés comme index:
- `id_v` est un string `id/v` où `id` est sur 16 chiffres et `v` sur 9 chiffres.
- `id_vcv` est un string `id/vcv` où `id` est sur 16 chiffres et `vcv` sur 9 chiffres.

Ces attributs apparaissent dans:
- tous les documents _majeurs_ pour `id_v`,
- `avatars chats membres` pour `id_vcv`.

En conséquence les attributs `id v vcv` ne sont **pas** indexés dans les documents _majeurs_.

`id` est indexée dans `gcvols` et `fpurges` qui n'ont pas de version `v` et dont l'`id` doit être indexée pour filtrage par l'utilitaire `export/delete`.

Dans les sous-collections versionnées `notes chats membres sponsorings`: `id ids v` sont indexées. Pour `sponsorings` `ids` sert de clé d'accès direct et a donc un index **collection_group**, pour les autres l'index est simple.

Dans la sous-collection non versionnée `transferts`: `id ids` sont indexées mais pas `v` qui n'y existe pas.

`dlv` est indexée,
- simple sur `versions`,
- **collection_group** sur les sous-collections `chats sponsorings membres`.

Autres index:
- `hps1` sur `comptas`: accès à la connexion par phrase secrète.
- `hpc` sur `avatars`: accès direct par la phrase de contact.
- `dfh` sur `groupes`: détection par le GC des groupes sans hébergement.

# IndexedDB dans les session UI

Un certain nombre de documents sont stockés en session UI dans la base locale IndexedDB et utilisés en modes _avion_ et _synchronisé_.
- compte: 'id' vaut '1'. Une seule instance du document `comptas`, celle de la session.
- tribus: 'id',
- comptas: 'id',
- avatars: 'id',
- chats: '[id+ids]',
- sponsorings: '[id+ids]',
- groupes: 'id',
- membres: '[id+ids]',
- notes: '[id+ids]'.

La clé _simple_ `id` en string est cryptée par la clé K du compte et encodée en base 64 URL.

Les deux termes de clés `id` et `ids` sont chacune en string crypté par la clé K du compte et encodée en base 64 URL.

Le formar _row_ d'échange est un objet de la forme `{ _nom, id, ..., _data_ }`.

En IDB les _rows_ sont sérilisés et cryptés par la clé K du compte.

Il y a donc une stricte identité entre les documents extraits de SQL / Firestore et leurs états stockés en IDB

_**Remarque**_: en session UI, d'autres documents figurent aussi en IndexedDB pour,
- la gestion des fichiers locaux: `avnote fetat fdata loctxt locfic locdata`
- la mémorisation de l'état de synchronisation de la session: `avgrversions sessionsync`.


# Données persistantes sur le serveur
## Espaces de noms
L'ensemble des documents est _partitionné en "espaces"_:
- des singletons globaux sont des documents contenant des données d'administration technique.
- il y a un document `espaces` par partition / espace de nom dont l'id est une **entier de de 10 à 69**.
- tous les autres documents ont un id de 16 chiffres (et un ids secondaire pour les sous collections) dont les 2 premiers sont l'id de leur espace de nom.

Un espace est également identifié par le code de l'organisation propriétaire:
- ce code org a de 4 à 12 lettres minuscules, chiffres, tirets.
- dans un Storage de fichiers ce code symbolique est la racine du stockage de l'espace. 

Il est techniquement simple:
- d'extraire / exporter tous les documents d'un espace (dont _son_ document `espaces`) par simple condition sur la valeur de leurs ids.
- de purger un espace selon les mêmes critères.

> Il s'agit bien d'un _partitionnement_ : aucun document d'une partition ne référence un document d'une autre partition.

> A l'intérieur d'une partition, les ids référencées sont des ids _raccourcies_, SANS les deux premiers chiffres qualifiant l'espace, donc en _relatif_ de leur espace. 
>L'importation_ d'un espace N dans une base existante se fait en donnant le nouveau numéro d'espace dans la base cible (et qui peut être différent de N). 
>Les sous-répertoires du Storage correspondant à des ids, utilisent aussi les ids _raccourcies_.

> **L'administrateur technique** a pour rôle unique de gérer les espaces:
- les créer / les détruire,
- définir leurs quotas à disposition du comptable de chaque espace: il existe deux quotas,
  - q1 : volume maximal autorisé des textes des notes,
  - q2 : volume total autorisé des fichiers attachés aux notes.
- gérer une _notification / blocage_ par espace.

### Comptable de chaque espace
Pour un espace 29 par exemple il existe un compte 2910000000000000 qui est le **comptable** de l'espace. 

Le comptable dispose des quotas globaux de l'espace attribués par l'administrateur technique. Il définit un certain nombre de **sous-quotas** et confie chacun de ses sous-quotas à des comptes _sponsors_ qui peuvent les distribués aux comptes qu'ils ont sponsorisé.

Par convention on dénomme `tribu` l'ensemble des comptes partageant un sous-quota.

> Le rôle d'un _comptable_ est de gérer la répartition des comptes en tribus et d'affecter des quotas aux tribus. 

#### Sous-quotas
La déclaration d'un sous-quota, d'une tribu, par le comptable d'un espace consiste à définir :
- une clé de cryptage `clet` générée aléatoirement à la création de la tribu :
  - **les 2 premiers bytes donnent l'id de la tribu**, son numéro d'ordre de création par le comptable partant e de 1,
- un très court texte `info` signifiant pour le comptable,
- les sous-quotas `q1` et `q2` attribués.

`clet` est immuable, `info q1 q2` peuvent être mis à jour par le comptable.

En plus des possibilités habituelles d'un compte, le comptable peut :
- créer / supprimer des _tribus_ et gérer leurs quotas de volumes V1 et V2,
- changer l'affectation d'un compte à une tribu,
- changer le pouvoir de _sponsor de sa tribu_ d'un compte (sauf pour lui-même),
- gérer des _notifications / blocages_ s'appliquant à des comptes précis ou à tous les comptes d'une tribu.

Un comptable :
- ne peut pas se résilier lui-même,
- ne peut pas changer de tribu, il est rattaché à la tribu _primitive_ de son espace (cette tribu ne peut pas être supprimée).
- supprimer son attribut _sponsor_,
- accepte l'ouverture de **chats** avec n'importe quel compte.

### Comptes _sponsors_
Les quotas `q1 q2` attribués à chaque compte sont prélevés sur un sous-quota : en d'autres termes, tout compte fait partie d'une _tribu_.

Un compte est créé par _sponsoring_,
- soit d'un compte existant _sponsor_ : le compte créé à des quotas prélevés dans la tribu de son sponsor.
- soit du comptable : le compte créé à des quotas prélevés dans la tribu choisie par le comptable.

Les comptes ayant un pouvoir de **sponsor** peuvent:
- sponsoriser la création de nouveaux comptes, _sponsor_ eux-mêmes ou non,
- gérer la répartition des quotas entre les comptes de leur tribu,
- gérer une _notification / blocage_ pour les comptes de leur tribu.

## Présentation en Collections / Documents :
- les attributs **indexés** sont:
  - `id, ids` : les identifiants primaires et secondaires pour les _sous documents_.
  - `org` : l'identifiant d'une organisation.
  - `v` : numéro de version d'un document (entier croissant), 
  - `vcv` : pour la version de la carte de visite.
  - `dlv` : date limite de validité :
    - `versions` (avatars et groupes) 
    - `membres`,
    - `sponsorings`,
    - `transferts`.
  - `dfh` : date de fin d'hébergement sur `groupes`.
  - `hps1` : clé d'accès secondaires directes aux documents `comptas`.
  - `hpc` : clé d'accès secondaires directes aux documents `avatars`.
  - _index composés_ :  
    - `iv` : `id + v`
    - `ivc` : `id + vcv`
- les attributs _data_ (non indexés) contiennent des données sérialisées opaques.

## Structure générale

    Collections                   Attributs: ** indexé sur collection group

    /Collection `singletons`
      Document `1` (checkpoint)   id (1)

    /Collection `espaces`
      Documents                   id org v (id: 10..59)

    /Collection `syntheses`
      Documents                   id v (id: 10..59)

    /Collection `gcvols`        
      Documents                   id

    /Collection `tribus`
      Documents                   id v

    /Collection `comptas`
      Documents                   id v hps1

    /Collection `versions`
      Documents                   id v dlv

    /Collection 'purges'
      Documents                   id

    /Collection 'fpurges'
      Documents                   id

    /Collection `avatars`
      Document                    id v vcv hpc
        /Collection `notes`
          Documents               id ids v
        /Collection `sponsorings`
          Document `sponsoring`   id **ids v **dlv
        /Collection `chats`
          Documents               id ids v vcv
        /Collection `transferts`
          Document `transfert`    id ids **dlv

    /Collection `groupes`
      Document `groupe`           id v dfh
        /Collection `membres`
          Document membre         id ids v vcv **dlv        
        /Collection `notes`
          Document `note`         id ids v       
        /Collection `transferts`  
          Document `transfert`    id ids **dlv

La _clé primaire_ est `id` pour les collections et `id + ids` pour les sous-collections.

Tous les documents, ont un attribut _data_ qui porte les informations sérialisées du document.
- les attributs externalisés hors de _data_ le sont parce qu'ils sont utilisés comme identifiants et / ou champs indexés.

#### Documents d'une collection majeure
Les documents _majeurs_ sont ceux des collections `tribus comptas avatars groupes`.
- leur identifiant porte le nom `id` et est un entier.
- chaque document porte une version `v`:
  - `tribus` et `comptas` ont leur propre version gérée dans le document lui-même.
  - `avatars` et `groupes` ont leurs versions gérées par le document `versions` portant leur id (voir ci-dessous)

#### Gestion des versions dans `versions`
- un document `avatar` d'id `ida` et les documents de ses sous collections `chats notes transferts sponsorings` ont une version prise en séquence continue fixée dans le document `versions` ayant pour id `ida`.
- idem pour un document `groupe` et ses sous-collections `membres notes transferts`.
- toute mise à jour du document maître (avatar ou groupe) et de leur sous-documents provoque l'incrémentation du numéro de version dans `versions` et l'inscription de cette valeur comme version du (sous) document mis à jour.

Un document `version` gère aussi :
- `dlv` : la date de fin de vie de son avatar ou groupe.
- en _data_ pour un groupe :
  - `v1 q1` : volume et quota dee textes des notes du groupe.
  - `v2 q2` : volume et quota dee fichiers des notes du groupe.

#### Documents d'une sous-collection d'un document majeur :
- `chats notes transferts sponsorings` d'un **avatar**.
- `membres notes transferts` d'un **groupe**.

Leur identifiant relatif à leur document majeur est `ids`.

#### Documents _synchronisables_ en session
Chaque session détient localement le sous-ensemble des données de la portée bien délimitée qui la concerne: en mode synchronisé les documents sont stockés en base IndexedDB (IDB) avec le même contenu qu'en base centrale.

L'état en session est conservé à niveau en _s'abonnant_ à un certain nombre de documents et de sous-collections:
- (1) les documents `avatars comptas` de l'id du compte
- (2) pour les comptes _sponsor_ le document `tribus` de l'id de leur tribu, tirée de (1)
- (3) les documents `avatars` des avatars du compte - listé par (1)
- (4) les documents `groupes` des groupes dont les avatars sont membres - listés par (3)
- (5) les sous-collections `notes chats sponsorings` des avatars - listés par (3)
- (6) les sous-collections `membres notes` des groupes - listés par (4)
- (7) le document `espaces` de son espace.
- le comptable, en plus d'être abonné à sa tribu, peut temporairement s'abonner àune autre tribu _courante_.

Au cours d'une session au fil des synchronisations, la portée va donc évoluer depuis celle déterminée à la connexion:
- des documents ou collections de documents nouveaux sont ajoutés à IDB (et en mémoire de la session),
- des documents ou collections sont à supprimer de IDB (et de la mémoire de la session).

Une session a une liste d'ids abonnées :
- l'id de son compte : quand un document `compta` change il est transmis à la session.
- les ids de ses `groupes` et `avatars` : quand un document `version` ayant une de ces ids change, il est transmis à la session. La tâche de synchronisation de la session va chercher le document majeur et ses sous documents ayant des versions postérieures à celles détenues en session.
- sa `tribu` actuelle (qui peut changer).
- implicitement le document `espaces` de son espace.
- **pour le Comptable** : en plus ponctuellement une seconde `tribu` _courante_.

**Remarque :** en session ceci conduit au respect de l'intégrité transactionnelle pour chaque objet majeur mais pas entre objets majeurs dont les mises à jour pourraient être répercutées dans un ordre différent de celui opéré par le serveur.
- en **SQL** les notifications pourraient être regroupées par transaction et transmises dans l'ordre.
- en **FireStore** ce n'est pas possible : la session pose un écouteur sur des objets `espace compta tribu versions` individuellement, l'ordre d'arrivée des modifications ne peut pas être garanti entre objets majeurs.

#### `dlv` : **date limite de validité** 
Ces dates sont données en jour `aaaammjj` (UTC) et apparaissent dans : 
- (a) `versions membres`,
- (b) `sponsorings`,
- (c) `transferts`.

Un document ayant une `dlv` **antérieure au jour courant** est un **zombi**, considéré comme _disparu / inexistant_ :
- en session sa réception a pour une signification de _destruction / disparition_ : il est possible de recevoir de tels avis de disparition plusieurs fois pour un même document.
- il ne changera plus de version ni d'état, son contenu est _vide_, pas de _data_ : c'est un **zombi**.
- un zombi reste un an en tant que zombi afin que les sessions rarement connectées puissent en être informées, puis est purgé définitivement.

**Sur _versions des avatars_ :**
- **jour auquel l'avatar sera officiellement considéré comme _disparu_**.
- la `dlv` (indexée) est reculée à l'occasion de l'ouverture d'une session pour _prolonger_ la vie de l'avatar correspondant.
- les `dlv` permettent au GC de récupérer tous les _avatars disparus_.

**Sur _membres_ :**
- **jour auquel l'avatar sera officiellement considéré comme _disparu ou ne participant plus au groupe_**.
- la `dlv` (indexée) est reculée à l'occasion de l'ouverture d'une session pour _prolonger_ la participation de l'avatar correspondant au groupe.
- les `dlv` permettent au GC de récupérer tous les _participations disparues_ et in fine de détecter la disparition des groupes quand tous les participants ont disparu.
- l'index est _groupe de collection_ afin de s'appliquer aux membres de tous les groupes.

**Sur _versions des groupes_ :**
- soit il n'y pas de `dlv` (0), soit la `dlv` est égale ou dépasse le jour courant : on ne trouve jamais dans une `versions` de groupe une `dlv` _future_ (contrairement aux `versions` des avatars et `membres`).
- pour _supprimer_ un groupe on lui fixe dans son `versions` une `dlv` du jour courant, il n'a plus de _data_, désormais _zombi et immuable_. Son `versions` sera purgé un an plus tard.

**Sur _sponsorings_:**
- jour à partir duquel le sponsoring n'est plus applicable ni pertinent à conserver. Les sessions suppriment automatiquement à la connexion les sponsorings ayant dépassé leur `dlv` (idem pour les synchronisations).
- il y a donc des sponsorings avec une `dlv` dans le futur : celle-ci peut être prolongée mais jamais avancée.
- dès atteinte du jour de `dlv`, un sponsorings est purgé (au moins purgeable).

**Sur _transferts_:**
- **jour auquel il est considéré que le transfert tenté a définitivement échoué**.
- un `transferts` est _immuable_, jamais mis à jour : il est créé, supprimé explicitement ou purgé à atteinte de sa `dlv`.
- permet au GC de détecter les transferts en échec et de nettoyer le Storage.
- l'index est _groupe de collection_ afin de s'appliquer aux fichiers des groupes comme des avatars.

#### `dfh` : **date de fin d'hébergement** sur un groupe
La **date de fin d'hébergement** sur un groupe permet de détecter le jour où le groupe sera considéré comme disparu. 

A dépassement de la `dfh` d'un groupe, le GC purge ce groupe et inscrit la `dlv` du jour dans son `versions`.

#### Index de _groupe de collection_: `dlv ids`
Un tel index sur les sous-documents permet une indexation globale et pas seulement dans la collection. En SQL ce concept n'existe pas (la notion de sous-collection étant virtuelle).
- `dlv` : date limite de validité,
  - sur _membres_ pour détecter les membres disparus.
  - sur _transferts_ pour détecter les transferts définitivement échoués de nettoyer le Storage.
- `ids` : hash de la phrase de parrainage sur `sponsorings` afin de rendre un sponsorings accessible par index sans connaître le sponsor.

#### Cache locale des `espaces comptas versions avatars groupes tribus` dans une instance d'un serveur
- les `comptas` sont utilisées à chaque mise à jour de notes.
- les `versions` sont utilisées à chaque mise à jour des avatars, de ses chats, notes, sponsorings.
- les `avatars groupes tribus` sont également souvent accédés.

**Les conserver en cache** par leur `id` est une bonne solution : mais en _FireStore_ (ou en SQL multi-process) il peut y avoir plusieurs instances s'exécutant en parallèle. Il faut en conséquence interroger la base pour savoir s'il y a une version postérieure et ne pas la charger si ce n'est pas le cas en utilisant un filtrage par `v`. Ce filtrage se faisant sur l'index n'est pas décompté comme une lecture de document quand le document n'a pas été trouvé parce que de version déjà connue.

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
    - 1 : compte / avatar principal.
    - 2 : avatar secondaire.
    - 3 : groupe,
  - Les autres bytes sont aléatoires, sauf pour le Comptable où ils sont tous 0.
- A l'écran le nom est affiché sous la forme `nom@xyzt` (sauf `Comptable`) ou `xyzt` sont les 4 derniers chiffres de l'id.

**Dans les noms,** les caractères `< > : " / \ | ? *` et ceux dont le code est inférieur à 32 (donc de 0 à 31) sont interdits afin de permettre d'utiliser le nom complet comme nom de fichier.

#### Les ids
Les singletons une id entière 1, 2 ... qui permet de les accéder.

Les `espaces` de nom ont pour id un entier de 10 à 59 : on retrouve cette id en tête de tous les ids des documents de l'espace.

Les `tribus` ont une id qui est le numéro d'ordre de création par le comptable.

Les `purges` ont pour id celle d'un avatar ou d'un groupe.

Les `fpurges` ont une id entière aléatoire.

Une `id` de compte / avatar et groupe est composée de 16 chiffres `nntaa..`, _entier safe_ en Javascript :
- `nn` : de 10 à 59. Numéro d'espace.
- `t` : 
  - 1: avatar principal / compte
  - 2: avatar secondaire
  - 3: groupe
- `aa...` : 13 chiffres aléatoires.
  - pour le comptable c'est 13 zéros.
  - pour les autres c'est un hash des 32 bytes de la clé random du document.

Un id **courte** est une id SANS les deux premiers chiffres de l'espace, donc relative à son espace.

**Pour chaque espace `nn`, un compte de nom réservé `Comptable`**
- son id est `nn 1 0 000 000 000 000` : le numéro de l'espace suivi de 1 et 13 zéros.
- sa clé de 32 bytes vaut : `[1, 0, 0 ...]`.
- il n'a pas de nom `''` mais apparaît à l'affichage avec un libellé configurable `Comptable`.
- il n'a pas de carte de visite.

**Sous-documents**
- l'id d'un `sponsoring`, `ids` est le hash de la phrase de reconnaissance.
- l'id d'un `chat` est un numéro `ids` construit depuis la clé de _l'autre_ avatar du chat.
- l'id d'un `note` est un numéro `ids` aléatoire relatif à celui de son avatar ou groupe.
- l'id d'un `membre` est `ids` un indice croissant depuis 1 relatif à son groupe.

### Authentification
L'administrateur technique a une phrase de connexion dont le hash est enregistré dans la configuration d'installation. Il n'a pas d'id. Une opération de l'administrateur est repérée parce que son _token_ donne ce hash.

Les opérations liées aux créations de compte ne sont pas authentifiées, elles vont justement enregistrer leur authentification.  
- Les opérations de GC et cells de type _ping_ ne le sont pas non plus.  
- Toutes les autres opérations le sont.

Une `sessionId` est tirée au sort par la session juste avant tentative de connexion : elle est supprimée à la déconnexion.

> **En mode SQL**, un WebSocket est ouvert et identifié par le `sessionId` qu'on retrouve sur les messages afin de s'assurer qu'un échange entre session et serveur ne concerne pas une session antérieure fermée.

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
- `hps1` : hash du PBKFD de la ligne 1 de la phrase secrète.

Le serveur recherche l'id du compte par `hps1` (index de `comptas`)
- vérifie que le SHA de `shax` est bien celui enregistré dans `compta` en `shay`.
- inscrit en mémoire `sessionId` avec l'id du compte et un `ttl`.

## Collection `singletons`

### Document `1` : checkpoint
Attribut opaque _data_ : contient les informations de point de reprise du GC.

## Collection `espaces`
Un document par espace (considéré comme faisant partie de la _partition_).

**Document:** - `id` : entier aléatoire
- `id` : de l'espace de 10 à 59.
- _org_ : code identifiant à 12 caractères de son organisation.
- _data_ : notifications et taille.

## Document `syntheses`
Un document par espace, mis à jour à chaque mise à jour d'une tribu de l'espace. Non synchronisé.

_data_:
- `id` : id de l'espace
- `v`
- _data_
  - `atr` : table des synthèses des tribus de l'espace. L'indice dans cette table est l'id court de la tribu. Chaque élément est la sérialisation des compteurs de synthèse.

## Collection `gcvols`
Il y a autant de documents que de comptes ayant été détectés disparus et dont les quotas n'ont pas encore été rendus à leur tribu par une session du Comptable.

C'est un avis de disparition d'un compte que seul le comptable peut décrypter et traiter pour mette à jour sa tribu : cette opération de GC des `gcvols` est effectuée à la connexion du comptable.

**Document:** - `id` : entier aléatoire
- `id` : id du compte disparu.
- _data_ : 
  - `cletX` : clé de la tribu cryptée par la clé K du Comptable.
  - `it` : index du compte dans cette tribu.

## Collection `purges`
Un document par id de groupe ou d'avatar dont les données sont à purger par le GC.

**Document:** - `id` : de l'avatar ou du groupe.

## Collection `fpurges`
Un document purge de fichiers à exécuter par le GC.

**Document:** - `id` : entier aléatoire
- `id` : id aléatoire.
- _data_ : 
  - `idag` : id d'un groupe ou d'un avatar.
  - `ldif` : liste des idf à supprimer dans le répertoire de l'avatar / groupe.

## Collection `tribus`
Cette collection liste les tribus déclarées sur le réseau et les comptes dont les quotas y sont prélevés.

Les comptes récupèrent à la connexion leur tribu.

Le comptable est le seul qui peut, de plus, accéder en cours de sa session à une seconde tribu _courante_,

**Documents:** - `id` : numéro d'ordre de création de la tribu  
Chaque document donne un descriptif de la tribu et la liste de ses parrains.
- `id` : numéro de la tribu.
- `v`
- _data_ : données de la tribu, synthèse et liste des comptes.
  - `cletX` : clé de la tribu cryptée par la clé K du comptable.
  - `q1 q2` : quotas totaux de la tribu.
  - `stn` : statut de la notification de tribu: _aucune simple bloquante_
  - `notiftT`: notification de niveau tribu cryptée par la clé de la tribu.
  - `act` : table des comptes de la tribu. L'index `it` dans cette liste figure dans la propriété `it` du `comptas` correspondant :
    - `idT` : id court du compte crypté par la clé de la tribu.
    - `sp` : est sponsor ou non.
    - `stn` : statut de la notification _du compte_: _aucune simple bloquante_
    - `q1 q2` : quotas attribués.

### Collection `comptas`

**Documents:**  - `id` : numéro du compte
Un document par compte rattaché à sa tribu portant :
- ses compteurs d'occupation d'espace
- le descriptif de son alerte quand il y en a une.

**Attributs:**
- `id` : numéro du compte
- `v`
- `hps1` : le hash du PBKFD du début de la phrase secrète du compte.
- _data_ : il contient en particulier:
  - `shay`, le SHA du SHA de X (PBKFD de la phrase secrète).
  - `cletX` : clé de la tribu cryptée par la clé K du comptable.
  - `cletK` : clé de la tribu cryptée par la clé K du compte : si cette clé a une longueur de 256, elle est cryptée par la clé publique RSA du compte (en cas de changement de tribu forcé par le comptable).
  - `it` : index du compte dans la table `act` de sa tribu.
  - `notifcT` : notification de niveau compte cryptée par la clé de la tribu.
  - `mavk` : map des avatars du compte. 
    - _clé_ : id court de l'avatar cryptée par la clé K du compte.
    - _valeur_ : couple `[nom clé]` de l'avatar crypté par la clé K du compte.

**Pour le Comptable seulement**
  -`atrX` : table des tribus cryptée par la clé K du comptable : `[cle, info, q1, q2]`
    - la première tribu est la tribu _primitive_, celle du comptable et est indestructible.
    - l'index d'une tribu dans cette table est son id.
  - `astn` : table des statuts de notification des tribus _aucune simple bloquante_.

### Collection `versions`

**Documents:**  - `id` : numéro d'un avatar ou d'un groupe

**Attributs:**
- `id` : id d'avatar / groupe.
- `v` : plus haute version attribuée aux documents de l'avatar / groupe.
- `dlv` : signature de vie + 365 (aaaammjj).
- _data_ :
  - `v`, 
  - `vols`: `{v1, v2, q1, q2}` pour un groupe

## Collection `avatars`
Cette collection a un document par avatar principal ou secondaire.

**Documents** - `id` : id de l'avatar
Deux variantes, l'avatar principal ayant des données supplémentaires. 

**Attributs:**
- `id` : id de l'avatar.
- `v` : version.
- `vcv` : version de la carte de visite.
- `hpc` : hash de la phrase de contact.
- _data_ : sérialisation des autres attributs.
  - `lgrk` : map :
    - _clé_ : `ni` : numéro d'invitation dans le groupe. Hash du `rnd` inverse du groupe crypté par le `rnd` de l'avatar.
    - _valeur_ : cryptée par la clé K du compte de `[nomg, cleg, im]` reçu sur une invitation. Pour une invitation en attente de refus / acceptation _valeur_ est cryptée par la clé publique RSA de l'avatar.

### Sous-collection `notes`
Elle compte un document par note.

**Documents** : `ids`, numéro de note dans son avatar.
- `id` : id de son avatar.
- `ids` : identifiant relatif à son avatar.
- `v` : sa version.
- _data_ : données sérialisées de le note.
  - `mfas` : map des fichiers attachés.
    _clé_ : `idf`, id du fichier aléatoire.
  - `refs` : couple `[id_court, ids]` crypté par la clé de la note, référence de sa  note _parent_.

Une note est _logiquement supprimée_ quand sa _data_ est absente / null (elle est _zombi_ et désormais immuable). La suppression est synchronisable par changement de la version `v` : elle est purgée lors de la purge de son avatar.

### Sous-collection `transferts`
Elle comporte un document par transfert de fichier en cours pour une note de l'avatar (ou de groupe).

L'upload d'un fichier est long. Ce document permet de gérer un commit à 2 phases:
- _phase 1_ : début de l'upload : insertion d'un document identifiant le fichier commençant à être uploadé,
- _phase 2_ : validation du fichier par le commit du document `note` : suppression du `transferts`.

**Documents:** - `ids` : `idf`, identifiant aléatoire du fichier (de facto relatif au groupe / avatar de sa note)

**Attributs:**
- `id` : id de son avatar (ou son groupe).
- `ids` : `idf`, identifiant aléatoire du fichier (de facto relatif au groupe / avatar de sa note)
- `dlv` : date de validité permettant de purger les fichiers uploadés (ou pas d'ailleurs) sur échec du commit entre les phases 1 et 2. Ceci permet de faire la différence entre un upload en cours et un vieil upload manqué.
- _data_ : aucune autre propriété.

### Sous-collection `sponsorings`
Un rendez-vous est identifié par une _phrase de reconnaissance_ convenue entre les deux avatars A et B pour le sponsoring de B par A.

Il y a un document par sponsoring en cours.

**Documents:** - `ids`, hash de la phrase secrète de reconnaissance

**Attributs:**
- `id` : id de l'avatar ayant fixé le rendez-vous.
- `ids` : hash de la phrase secrète de reconnaissance
- `v`
- `dlv` : purge automatique des sponsorings.
- _data_ : autres propriétés sérilaisées
  - `descr` :  données du rendez-vous cryptée par X, le PBKFD de la phrase de reconnaissance.
    - `na` : `[nom, cle]` du sponsor.
    - `cv` : `{ v, photo, info }` du sponsor (cryptée par sa clé `cle` ci-dessus).
    - `naf` : `[nom, cle]` attribué au compte sponsorisé.
    - `clet` : clé de sa tribu.
    - `sp` : vrai si le filleul est lui-même sponsor.
    - `quotas` : `[q1, q2]` quotas attribués par le parrain.

### Sous-collection `chats`
Elle comporte un document par chat ouvert avec un avatar (externe, pas un avatar du compte).

Un chat est éternel, une fois créé il ne disparaît qu'à la disparition des avatars en cause.

Un chat est dédoublé sur chacun des deux avatars partageant le chat.

**Documents:** - `ids`, numéro du chat pour l'avatar

**Attributs**
- `id` : id de son avatar.
- `ids` : identifiant du chat relativement à son avatar. hash du cryptage de `idA_court/idB_court` par le `rnd` de A.
- `v`
- `vcv`: version de la carte de visite.
- _data_ : contenu du chat crypté par la clé de l'avatar. 
  - `contc` : contenu crypté par la clé `cc` du chat.
    - `na` : `[nom, cle]` de _l'autre_.
    - `dh`  : date-heure de dernière mise à jour.
    - `txt` : texte du chat.

#### Avatars _externes_ E connaissant l'avatar A, chat entre avatars
- les membres des groupes dont A est membre.
- tout avatar C ayant ouvert un jour un chat avec A (quand qu'ils étaient membres d'un même groupe ou par récupération d'une _phrase de contact_), même si maintenant ces deux conditions ne sont plus remplies.

Le Comptable est un _faux_ avatar externe puisqu'il est connu par une constante: de ce fait il peut faire l'objet d'un chat, voire d'être contacté pour invitation à un groupe.

Tout _avatar externe_ E connaissant A peut lui écrire un chat qui est dédoublé avec une copie pour A et une copie pour E.
- un chat reste vivant jusqu'à disparition d'un des deux avatars.

## Collection `groupes`
Cette collection comporte un document par groupe existant.

**Documents :** - `id` : id du groupe
- `id` : id du groupe,
- `v`
- `dfh` : date de fin d'hébergement. Le groupe s'auto détruit à cette date là, sauf si un compte a repris l'hébergement, `dfh` étant alors remise à 0.
- _data_ : données du groupe.
  - `ast` : table des statuts des membres (dès qu'ils ont été inscrits en _contact_)
  - `nag` : table des hash de la clé courte du membre crypté par la clé du groupe.

### Sous-collection `membres`
Elle comporte un document membre par membre.

**Documents:** 
- `id` : id du groupe.
- `ids`: indice de membre relatif à son groupe, numéro d'ordre de création, indice dans `ast`, `nag` de groupe..
- `dlv` : date de disparition inscrite lors de la connexion du compte de l'avatar membre du groupe.
- `v`
- _data_ : données du membre.
  - `nag` : `[nom, cle]` : nom et clé de l'avatar crypté par la clé du groupe.
  - `cva` : carte de visite de l'avatar membre `{v, photo, info}` cryptée par sa clé.

### Sous-collection `notes`
Comme les `notes` d'un avatar.

### Sous-collection `transferts`
Comme les `transferts` des avatars.

# Détail des documents

### Sous-objet notification
Les notifications servent à transmettre une information importante aux comptes avec plusieurs niveaux :
- **notification simple** d'information importante dont le compte doit tenir compte, typiquement pour réduire son volume, contacter le Comptable, etc.
- **notification bloquante**, une procédure de blocage est engagée:
  - **1-écritures bloquées** : compte avec un comportement de mode _avion_ mais pouvant toutefois chatter avec le comptable et ses sponsors.
  - **2-lectures et écritures bloquées** : le compte ne peut plus **que** chatter avec ses sponsors ou le Comptable et n'a plus accès à ses autres données.

**Enfin le compte est bloqué** (connexion impossible): la procédure a conduit à la disparition des comptes concernés. Cet état n'est pas observable que dans la situation particulière d'une tribu _bloquée_, la création de comptes par le comptable y étant interdite.

**Le Comptable a un degré de liberté** supérieur aux autres comptes:
- en niveau 1 et 2 il peut: 
  - gérer les tribus, création, gestion de quotas, gestion des comptes et de leurs quotas,
  - chatter avec les comptes,
  - gérer les notifications aux tribus et comptes.
- en niveau bloqué, il ne peut plus rien faire. 

On trouve des notifications aux niveaux suivants :
- **G-niveau global** d'un espace, émise par l'Administrateur (cryptée par la clé du Comptable) à destination de **tous** les comptes.
- **T-niveau tribu** à destination de **tous** les comptes de la tribu. Cryptée par la clé de la tribu et émise :
  - soit par le Comptable,
  - soit par un sponsor de la tribu : toutefois quand il existe une notification du Comptable elle ne peut pas être modifiée par un sponsor.
- **C-niveau compte** à destination d'un seul compte. Cryptée par la clé de sa tribu et émise :
  - soit par le Comptable,
  - soit par un sponsor de la tribu : toutefois quand il existe une notification du Comptable elle ne peut pas être modifiée par un sponsor.

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

## Document `espace`
_data_ :
- `id` : de l'espace de 10 à 89.
- `v`
- `org` : code de l'organisation propriétaire

- `notif` : notification de l'administrateur, cryptée par la clé du Comptable.
- `t` : numéro de _profil_ de quotas dans la table des profils définis dans la configuration (chaque profil donne un couple de quotas q1 q2).

## Document `gcvol`
_data_ :
- `id` : id du compte disparu.

- `cletX` : clé de la tribu cryptée par la clé K du Comptable.
- `it` : index du compte dans cette tribu.

Le comptable obtient l'`id` de la tribu en décryptant `cletX`, `it` lui donne l'indice du compte disparu dans la table `act` de cette tribu. Cet élément est détruit (ce qui de facto accroît les quotas attribuables).

## Document `tribu`
_data_:
- `id` : numéro d'ordre de création de la tribu.
- `v`

- `cletX` : clé de la tribu cryptée par la clé K du comptable.
- `q1 q2` : quotas totaux de la tribu.
- `stn` : statut de la notification de tribu: _0:aucune 1:simple 2:bloquante 3:bloquée_
- `notif`: notification de niveau tribu cryptée par la clé de la tribu.
- `act` : table des comptes de la tribu. L'index `it` dans cette liste figure dans la propriété `it` du `comptas` correspondant :
  - `idT` : id court du compte crypté par la clé de la tribu.
  - `nasp` : si sponsor `[nom, cle]` crypté par la cle de la tribu.
  - `notif`: notification de niveau compte cryptée par la clé de la tribu.
  - `stn` : statut de la notification _du compte_: _aucune simple bloquante_
  - `q1 q2` : quotas attribués.
  - `v1 v2` : volumes **approximatifs** effectivement utilisés: recopiés de comptas lors de la dernière connexion du compte, s'ils ont changé de plus de N%. **Ce n'est donc pas un suivi en temps réel** qui imposerait une charge importante de mise à jour de tribu à chaque mise à jour d'un compteur de `comptas` et des charges de synchronisation conséquente.

Un sponsor peut accéder à la liste des comptes de sa tribu : toutefois il n'a accès à leur carte de visite que s'il les connaît pasr ailleurs, chats au moment du sponsoring ou ultérieur par phrase de contact, appartence à un même groupe ...

De même pour le comptable.

L'ajout / retrait de la qualité de `sponsor` n'est effectué que par le comptable au delà du sponsoring initial par un sponsor.

## Document `syntheses`
La mise à jour de tribu est de facto peu fréquente : une _synthèse_ est recalculée à chaque mise à jour de `stn, q1, q2` ou d'un item de `act`.

_data_:
- `id` : id de l'espace
- `v` : date-heure d'écriture

- `atr` : table des synthèses des tribus de l'espace. L'indice dans cette table est l'id court de la tribu. Chaque élément est la sérialisation de:
  - `q1 q2` : quotas de la tribu.
  - `a1 a2` : sommes des quotas attribués aux comptes de la tribu.
  - `v1 v2` : somme des volumes (approximatifs) effectivement utilisés.
  - `ntr1` : nombre de notifications tribu_simples
  - `ntr2` : nombre de notifications tribu bloquantes
  - `ntr3` : nombre de notifications tribu bloquées
  - `nbc` : nombre de comptes.
  - `nbsp` : nombre de sponsors.
  - `nco1` : nombres de comptes ayant une notification simple.
  - `nco2` : nombres de comptes ayant une notification bloquante.

atr[0] est la somme des atr[1..N]. Calculé en session, pas stocké.

## Document `compta`
_data_ :
- `id` : numéro du compte
- `v`
- `hps1` : le hash du PBKFD du début de la phrase secrète du compte.

- `shay`, le SHA du SHA de X (PBKFD de la phrase secrète).
- `kx` : clé K du compte, cryptée par le PBKFD de la phrase secrète courante.
- `dhvu` : date-heure de dernière vue des notifications par le titulaire du compte, cryptée par la clé K.
- `sp` : 1: est sponsor
- `cletX` : clé de la tribu cryptée par la clé K du comptable.
- `cletK` : clé de la tribu cryptée par la clé K du compte : si cette clé a une longueur de 256, elle est cryptée par la clé publique RSA du compte (en cas de changement de tribu forcé par le comptable).
- `it` : index du compte dans la table `act` de sa tribu.
- `notifcT` : notification de niveau compte cryptée par la clé de la tribu.
- `mavk` : map des avatars du compte. 
  - _clé_ : id court de l'avatar cryptée par la clé K du compte.
  - _valeur_ : couple `[nom clé]` de l'avatar crypté par la clé K du compte.
- `compteurs`: compteurs sérialisés (non cryptés), dont `q1 q2` les quotas actuels du compte qui sont dupliqués dans son entrée de sa tribu.

**Pour le Comptable seulement**
-`atr` : table des tribus : `{clet, info, q1, q2}` crypté par la clé K du comptable.
  - `clet` : clé de la tribu (donne aussi son id, index dans `atrx / astn`).
  - `info` : texte très court pour le seul usage du comptable.
  - `q1 q2` : quotas globaux de la tribu.
- `astn` : table des statuts de notification des tribus _aucune simple bloquante_.

La première tribu est la tribu _primitive_, celle du comptable et est indestructible.

**Remarques :**  
- Le document est mis à jour à minima à chaque mise à jour d'une note (volumes dans compteurs).
- La version de `compta` lui est spécifique (ce n'est pas la version de l'avatar principal du compte).
- `cletX it` sont transmis par le GC dans un document `gcvols` pour notifier au Comptable, quel est le compte détecté disparu (donc de sa tribu).
- Le fait d'accéder à `atr` permet d'obtenir la _liste des tribus existantes_ de l'espace. Le serveur peut ainsi recalculer la statistique de l'espace (agrégation des compteurs des tribus) en scannant ces tribus.

## Document `version`
_data_ :
- `id` : id d'avatar / groupe
- `v` : plus haute version attribuée aux documents de l'avatar / groupe.
- `dlv` : date de fin de vie, peut être future pour un avatar, est toujours dépassée pour un groupe. Date de purge définitive un an plus tard.
- `{v1 q1 v2 q2}`: pour un groupe, volumes et quotas des notes.

## Document `avatar`
_data_:
- `id`, 
- `v`,
- `vcv` : version de la carte de visite afin qu'une opération puisse détecter (sans lire le document) si la carte de visite est plus récente que celle qu'il connaît.
- `hpc` : hash de la phrase de contact.

**données n'existant que pour un avatar principal**
- `mck` : map des mots-clés du compte cryptée par la clé K -la clé est leur code 1-99- ("code": nom@catégorie).
- `memok` : mémo personnel du compte.

**données disponibles pour tous les avatars**
- `pub` : clé publique RSA
- `privk`: clé privée RSA cryptée par la clé K.
- `cva` : carte de visite cryptée par la clé _CV_ de l'avatar `{v, photo, info}`.
- `lgrk` : map :
  - _clé_ : `ni` : numéro d'invitation dans le groupe. Hash du `rnd` inverse du groupe crypté par le `rnd` de l'avatar.
  - _valeur_ : cryptée par la clé K du compte de `[nomg, clég, im]` reçu sur une invitation. Pour une invitation en attente de refus / acceptation _valeur_ est cryptée par la clé publique RSA de l'avatar
  - une entrée est effacée par la résiliation du membre au groupe ou son effacement d'invitation explicite par un animateur ou l'avatar lui-même (ce qui l'empêche de continuer à utiliser la clé du groupe).
- `pck` : PBKFD de la phrase de contact cryptée par la clé K.
- `napc` : `[nom, cle]` de l'avatar cryptée par le PBKFD de la phrase de contact.

**Invitation à un groupe**  
L'invitant connaît le `[nom, clé]` de l'invité qui est déjà dans la liste des membres en tant que pressenti. L'invitation consiste à :
- inscrire un terme `[nomg, cleg, im]` dans `lgrk` de son avatar (ce qui donne la clé du groupe à l'invité, donc accès à la carte de visite du groupe) en le cryptant par la clé publique RSA l'invité,
- l'acceptation par l'avatar transcode l'entrée de `lgrk` par la clé K.

### Cartes de visites
**Mise à jour: avatar et tribu**
La création / mise à jour s'opère dans son `avatar`.

**Mises à jour des cartes de visite des membres**
- la première inscription se fait à l'ajout de l'avatar comme _contact_ du groupe.
- en session, lorsque la page listant les membres d'un groupe est ouverte, elle envoie une requête au serveur donnant la liste des couples `[id, v]` des `ids` des membres et de leur version de carte de visite détenue dans le document `membre`.
- pour chacune ayant une version postérieure, le serveur la met à jour dans `membre`.
- ceci permet de voir en session des cartes de visite toujours à jour et d'éviter d'effectuer une opération longue à chaque mise à jour des cartes de visite par un avatar pour tous les groupes dont il est membre.

**Mise à jour dans les chats**
- à la mise à jour d'un chat, les cartes de visites des deux côtés sont rafraîchies (si nécessaire).
- en session au début d'un processus de consultation des chats, la session fait rafraîchir incrémentalement les cartes de visite qui ne sont pas à jour dans les chats: un chat ayant `vcv` en index, la nécessité de mise à jour se détecte sur une lecture d'index sans lire le document correspondant.

## Document `chat`
Un chat est éternel, une fois créé il ne disparaît qu'à la disparition des avatars en cause.

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

L'id d'un chat est le couple `id, ids` (du côté de A)

_data_:
- `id`: id de A,
- `ids`: hash du cryptage de `idA_court/idB_court` par le `rnd` de A.
- `v`
- `vcv` : version de la carte de visite.

- `st` : statut:
  - 0 : le chat est vivant des 2 côtés
  - 1 : _l'autre_ a été détecté disparu : 
- `mc` : mots clés attribués par l'avatar au chat
- `cva` : `{v, photo, info}` carte de visite de _l'autre_ au moment de la création / dernière mise à jour du chat, cryptée par la clé CV de _l'autre_.
- `cc` : clé `cc` du chat cryptée par la clé K du compte de I ou par la clé publique de I.
- `seq` : numéro de séquence de changement du texte.
- `contc` : contenu crypté par la clé `cc` du chat.
  - `na` : `[nom, cle]` de _l'autre_.
  - `dh`  : date-heure de dernière mise à jour.
  - `txt` : texte du chat.

### _Contact direct_ entre A et B
Supposons que B veuille ouvrir un chat avec A mais n'en connaît pas le nom / clé.

A peut avoir communiqué à B sa _phrase de contact_ qui ne peut être enregistrée par A que si elle est, non seulement unique, mais aussi _pas trop proche_ d'une phrase de contact déjà déposée.

B peut écrire un chat à A à condition de fournir cette _phrase de contact_:
- l'avatar A a mis à disposition son nom complet `[nom, cle]` crypté par le PBKFD de la phrase de contact.
- muni de ces informations, B peut écrire un chat à A.
- le chat comportant le `[nom cle]` de B, A est également en mesure d'écrire sur ce chat, même s'il ignorait avant le nom complet de B.

## Document `sponsoring`
P est le parrain-sponsor, F est le filleul-sponsorisé.

_data_:
- `id` : id de l'avatar sponsor.
- `ids` : hash de la phrase de parrainage, 
- `v`
- `dlv` : date limite de validité

- `st` : statut. 0: en attente réponse, 1: refusé, 2: accepté, 3: détruit / annulé
- `pspk` : phrase de sponsoring cryptée par la clé K du sponsor.
- `bpspk` : PBKFD de la phrase de sponsoring cryptée par la clé K du sponsor.
- `dh`: date-heure du dernier changement d'état
- `descr` : crypté par le PBKFD de la phrase de sponsoring
  - `na` : `[nom, cle]` de P.
  - `cv` : `{ v, photo, info }` de P.
  - `naf` : `[nom, cle]` attribué au filleul.
  - `clet` : clé de sa tribu.
  - `sp` : vrai si le filleul est lui-même sponsor (créé par le Comptable, le seul qui peut le faire).
  - `quotas` : `[v1, v2]` quotas attribués par le parrain.
- `ardx` : ardoise de bienvenue du sponsor / réponse du filleul cryptée par le PBKFD de la phrase de sponsoring

**Remarques**
- la `dlv` d'un sponsoring peut être prolongée (jamais rapprochée). Le sponsoring est purgé par le GC quotidien à cette date, en session et sur le serveur, les documents ayant atteint cette limite sont supprimés et ne sont pas traités.
- Le sponsor peut annuler son `sponsoring` avant acceptation, en cas de remord son statut passe à 3.

**Si le filleul refuse le sponsoring :** 
- Il écrit dans `ard` au parrain expliquant sa raison et met le statut du `sponsoring` à 1. 

**Si le filleul ne fait rien à temps :** 
- `sponsoring` finit par être purgé par `dlv`. 

**Si le filleul accepte le parrainage :** 
- Le filleul crée son compte / avatar principal: `naf` donne l'id de son avatar et son nom. Les infos de tribu pour le compte sont obtenu de `clet`.
- la `compta` du filleul est créée et créditée des quotas attribués par le parrain.
- la `tribu` est mise à jour (quotas attribués), le filleul est mis dans la liste des comptes `act` de `tribu`.
- un mot de remerciement est écrit par le filleul au parrain sur `ard` **ET** ceci est dédoublé dans un chat filleul / sponsor.
- le statut du `sponsoring` est 2.

## Document `note`
La clé de cryptage du note `cles` est selon le cas :
- *note personnelle d'un avatar A* : la clé K de l'avatar.
- *note d'un groupe G* : la clé du groupe G.

Le droit de mise à jour d'une note est contrôlé par le couple `x p` :
- `x` : pour une note de groupe, indique quel membre (son `im`) a l'exclusivité d'écriture et le droit de basculer la protection.
- `p` indique si le texte est protégé contre l'écriture ou non.

**Note temporaire et permanente**
Par défaut à sa création une note est _permanente_. Pour une note _temporaire_ :
- son `st` contient la _date limite de validité_ indiquant qu'elle sera automatiquement détruite à cette échéance.
- une note temporaire peut être prolongée, tout en restant temporaire.
- par convention le `st` d'une note permanente est égal à `99999999`. Une note temporaire peut être rendue permanent par :
  - l'avatar propriétaire pour une note personnelle.
  - un des animateurs du groupe pour une note de groupe.
- **une note temporaire ne peut pas avoir de fichiers attachés**.

_data_:
- `id` : id de l'avatar ou du groupe.
- `ids` : identifiant relatif à son avatar.
- `v` : sa version.

- `st` :
  - `99999999` pour un _permanent_.
  - `aaaammjj` date limite de validité pour un _temporaire_.
- `im` : exclusivité dans un groupe. L'écriture et la gestion de la protection d'écriture sont restreintes au membre du groupe dont `im` est `ids`. 
- `p` : 0: pas protégé, 1: protégé en écriture.
- `v1` : volume du texte
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
- `refs` : couple `[id_court, ids]` crypté par la clé de la note, référence de sa  note _parent_.

**_Remarque :_** une note peut être explicitement supprimé. Afin de synchroniser cette forme particulière de mise à jour pendant un an (le délai maximal entre deux login), le document est conservé _zombi_ avec un _data_ absente / null. Il sera purgé avec son avatar / groupe.

**Mots clés `mc`:**
- Note personnelle : `mc` est un vecteur d'index de mots clés. Les index sont ceux du compte et de l'organisation.
- Note de groupe : `mc` est une map :
  - _clé_ : `im`, indice du membre dans le groupe. Par convention 0 désigne le groupe lui-même.
  - _valeur_ : vecteur d'index des mots clés. Les index sont ceux personnels du membre, ceux du groupe, ceux de l'organisation.

**Map des fichiers attachés :**
- _clé_ `idf`: numéro aléatoire généré à la création. L'identifiant _externe_ est `id_court` du groupe / avatar, `idf`
- _valeur_ : `{ nom, info, dh, type, gz, lg, sha }` crypté par la clé S de la note.

**Identifiant de stockage :** `org/id_court/idf`
- `org` : code de l'organisation (domaine ...).
- `id_court` : id _court_ de l'avatar / groupe auquel la note appartient.
- `idf` : identifiant aléatoire du fichier.

En imaginant un stockage sur file-system,
- l'application a un répertoire racine par espace,
- il y un répertoire par avatar / groupe ayant des notes ayant des fichiers attachés,
- pour chacun, un fichier par fichier attaché.

_Un nouveau fichier attaché_ est stocké sur support externe **avant** d'être enregistré dans son document `note`. Ceci est noté dans un document `transfert` de la sous-collection `transferts` des transferts en cours. 
Les fichiers créés par anticipation et non validés dans une `note` comme ceux qui n'y ont pas été supprimés après validation de la note, peuvent être retrouvés par un GC qui peut s'exécuter en lisant seulement les _clés_ de la map `mafs`.

La purge d'un avatar / groupe s'accompagne de la suppression de son _répertoire_. 

La suppression d'un note s'accompagne de la suppressions de N fichiers dans un seul _répertoire_.

## Document `transfert`
_data_:
- `id` : id du groupe ou de l'avatar du note.
- `ids` : `idf` du fichier en cours de chargement.
- `dlv` : date-limite de validité pour nettoyer les uploads en échec sans les confondre avec un en cours.

## Document `groupe`
Un groupe est caractérisé par :
- son entête : un document `groupe`.
- la liste de ses membres : des documents `membre` de sa sous-collection `membres`.

L'hébergement d'un groupe est noté par :
- `imh`: indice membre de l'avatar hébergeur. 
- `idhg` : id du **compte** hébergeur crypté par la clé du groupe.
- `dfh`: date de fin d'hébergement qui vaut 0 tant que le groupe est hébergé.

Le compte peut mettre fin à son hébergement:
- `dfh` indique le jour de la fin d'hébergement. Les notes ne peuvent plus être mis à jour _en croissance_ quand `dfh` existe. 
- à `dfh`, 
  - le GC purge le groupe.
  - `dlv` dans le `versions` du groupe est mis à la date du jour + 365 jours.
  - les notes et membres sont purgés.
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
- toutefois si le membre est de nouveau contacté, il récupère son indice antérieur (pas un nouveau) mais son historique de dates d'invitation, début et fin d'activité sont réinitialisées. C'est une nouvelle vie dans le groupe mais avec la même identité, les notes écrits dans la vie antérieure mentionnent à nouveau leur auteur au lieu d'un numéro #99.

_data_:
- `id` : id du groupe.
- `v` : version, du groupe, ses notes, ses membres. 
- `iv`
- `dfh` : date de fin d'hébergement.

- `idhg` : id du compte hébergeur crypté par la clé du groupe.
- `imh` : indice `im` du membre dont le compte est hébergeur.
- `msu` : mode _simple_ ou _unanime_.
  - `null` : mode simple.
  - `[ids]` : mode unanime : liste des indices des animateurs ayant voté pour le retour au mode simple. La liste peut être vide mais existe.
- `pe` : 0-en écriture, 1-protégé contre la mise à jour, création, suppression de notes.
- `ast` : table des statuts des membres (dès qu'ils ont été inscrits en _contact_) :
  - 10: contact, 
  - 30,31,32: **actif** (invitation acceptée) en tant que lecteur / auteur / animateur, 
  - 40: invitation refusée,
  - 50: résilié, 
  - 60,61,62: invité en tant que lecteur / auteur / animateur, 
  - 70,71,72: invitation à confirmer (tous les animateurs n'ont pas validé) en tant que lecteur / auteur / animateur, 
  - 0: disparu / oublié.
- `nag` : table des hash de la clé du membre cryptée par la clé du groupe.
- `mcg` : liste des mots clés définis pour le groupe cryptée par la clé du groupe cryptée par la clé du groupe.
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

## Document `membre`
_data_:
- `id` : id du groupe.
- `ids`: identifiant, indice de membre relatif à son groupe.
- `v`
- `vcv` : version de la carte de visite du membre
- `dlv` : date de dernière signature + 365 lors de la connexion du compte de l'avatar membre du groupe.

- `ddi` : date de la _dernière_ invitation
- `dda` : date de début d'activité (jour de la _première_ acceptation)
- `dfa` : date de fin d'activité (jour de la _dernière_ suspension)
- `inv` : validation de la dernière invitation:
  - `null` : le membre n'a pas été invité où le mode d'invitation du groupe était _simple_ au moment de l'invitation.
  - `[ids]` : liste des indices des animateurs ayant validé l'invitation.
- `mc` : mots clés du membre à propos du groupe.
- `infok` : commentaire du membre à propos du groupe crypté par la clé K du membre.
- `nag` : `[nom, cle]` : nom et clé de l'avatar crypté par la clé du groupe.
- `cva` : carte de visite du membre `{v, photo, info}` cryptée par la clé du membre.

### Cycle de vie
- un document `membre` existe dans tous les états SAUF 0 _disparu / oublié_.
- un auteur d'un note `disparu / oublié`, apparaît avec juste un numéro (sans nom), sans pouvoir voir son membre dans le groupe.

#### Transitions d'état d'un membre:
- de contact : 
  - invitation -> invité
  - disparition -> disparu
  - demande d'oubli par un animateur -> disparu
- de invité :
  - refus -> invitation refusée
  - refus fort -> oubli
  - acceptation -> actif
  - retrait d'invitation par un animateur -> contact (`dfa` est 0) OU suspendu (`dfa` non 0, il a été actif)
  - disparition -> disparu
  - demande d'oubli par un animateur -> disparu
- de actif :
  - résiliation / auto-résiliation -> résilié
  - résiliation / auto-résiliation forte -> disparu
  - disparition -> disparu
- de invitation refusée :
  - invitation -> invité
  - disparition -> disparu
  - demande d'oubli par un animateur -> disparu
- de résilié :
  - invitation -> invité
  - disparition -> disparu
  - demande d'oubli par un animateur -> disparu
- de disparu / oubli : aucune transition (`membre` a été purgé)

**Simple contact inscrit par un membre du groupe**
- le membre du groupe qui l'a inscrit, 
  - lui a attribué un index (taille de `ast` du groupe) : a vérifié que, `nig` (le hash de son `rnd` crypté n'était pas déjà cité dans `nig` du groupe) et l'inscrit.
  - a marqué le statut _contact_ dans cet `ast`,
- dans `membre` seuls `nag cva` sont significatifs. 

**Invité suite à une invitation par un animateur**
- invitation depuis un état _contact_  _résilié_ _refus d'invitation_
- son statut dans `ast` passe à 60, 61, ou 62.
- dans `membre` `nag cva ddi` sont significatifs.
- inscription dans `lgrk` de son avatar (crypté par sa clé RSA publique).
- si `dda`, c'est une ré-invitation après résiliation :  dans `membre` `mc infok` peuvent être présents.

**Retrait d'invitation par un animateur**
- depuis un état _invité_,
- retiré du `lgrk` de l'avatar du membre,
- son statut dans `ast` passe à 
  - _résilié_ : si `dfa` existe, c'était un ancien membre actif
  - _contact_ : `dfa` est 0, il n'a jamais été actif.
- dans `membre` seuls `nag cva ddi` sont significatifs, possiblement `mc infok` si le membre avait été actif. 

**Actif suite à l'acceptation d'une invitation par le membre**
- son statut dans `ast` passe à 30, 31, ou 32.
- dans membre :
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
  - refus d'invitation _forte_,
  - résiliation ou auto-résiliation _forte_, 
  - demande par un animateur.
- son statut dans `ast` passe à 0. Son index ne sera **jamais** réutilisé. Son entrée dans `nig` n'est PAS remise à 0 : s'il est à nouveau contacté, il obtiendra le MEME indice.
- son document `membre` est purgé.

**Résiliation d'un membre par un animateur ou auto résiliation**
- depuis un état _actif_.
- son statut passe à _résilié_ dans `ast` de son groupe.
- le membre n'a plus le groupe dans le `lgrk` de son avatar.
- dans son document `membre` `dfa` est positionnée à la date du jour.
- différences avec un état _contact_: l'avatar membre a encore des mots clés, une information et retrouvera ces informations s'il est ré-invité.

**Disparitions d'un membre**
- voir la section _Gestion des disparitions_

## Objet `compteurs`
- `j` : **date du dernier calcul enregistré** : par exemple le 17 Mai de l'année A
- **pour le mois en cours**, celui de la date ci-dessus :
  - `q1 q2`: quotas actuels.
  - `v1 v2 v1m v2m`: volume actuel des notes et moyens sur le mois en cours.
  - `trj` : transferts cumulés du jour.
  - `trm` : transferts cumulés du mois.
- `tr8` : log des volumes des transferts cumulés journaliers de pièces jointes sur les 7 derniers jours + total (en tête) sur ces 7 jours.
- **pour les 12 mois antérieurs** `hist` (dans l'exemple ci-dessus Mai de A-1 à Avril de A),
  - `q1 q2` quotas q1 et q2 au dernier jour du mois.
  - `v1 v2` log des volumes moyens du mois (log de `v1m` `v2m` ci-dessus au dernier jour du mois)
  - `tr` log du total des transferts des pièces jointes dans le mois (log de `trm` à la fin du mois).

## Mots clés, principes et gestion
Les mots clés sont utilisés pour :
- filtrer / caractériser à l'affichage les **chats** accédés par un compte.
- filtrer / caractériser à l'affichage les **groupes (membres)** accédés par un compte.
- filtrer / caractériser à l'affichage les **notes**, personnels ou partagés avec un groupe.

La **définition** des mots-clés (avatar et groupe) est une map :
- _clé_ : indice du mot-clé de 1 à 255,
- _valeur_ : texte `catégorie/label du mot-clé`.

Affectés à un membre ou note, c'est un array de nombre de 1 à 255 (Uin8Array).

Les mots clés d'indice,
- 1-99 : sont ceux d'un compte.
- 100-199 : sont ceux d'un groupe.
- 200-255 : sont ceux définis en configuration (généraux dans l'application).

# Gestion des disparitions

## Signatures des avatars dans `version` et `membre`
Les comptes sont censés avoir au maximum 365 jours entre 2 connexions faute de quoi ils sont considérés comme `disparus`.

10 jours après la disparition d'un compte, 
- ses avatars secondaires vont être détectés disparus par le GC.
- ses membres dans les groupes auxquels il participe vont être détectés disparus par le GC ce qui peut entraîner la disparition de groupes n'ayant plus d'autres membres _actifs_.

Les `dlv` (date limite de validité) sont exprimées par un entier `aaaammjj`: elles signalent que ce jour-là, l'avatar -le cas échéant le compte- ou le membre est considéré comme _disparu_.

A chaque connexion d'un compte, son avatar principal _prolonge_ les `dlv` de :
- son propre avatar et ses avatars secondaires dans leur document `version`.
- des membres (sur `membre`) des groupes connus par ses avatars dans `lgrk`. 

Les `dlv` sont également fixées:
- pour un avatar, à sa création dans son `versions`.
- pour un membre d'un groupe, à l'acceptation de son invitation.

> Les `dlv` ne sont pas _prolongées_ si le document `tribus` fait l'objet d'une procédure de blocage.

**Règles:** 
- les `dlv` sont gérées par _décade_ : une `dlv` est toujours définie ou reculée à un multiple de 10 jours.
- ceci évite de multiplier des mises à jour en cas de connexions fréquentes et de faire des rapprochements entre avatars / groupes en fonction de leur dernière date-heure de connexion.
- si l'avatar principal a sa `dlv` repoussée le 10 mars par exemple, ses autres avatars et ses membres seront reculés au 20 mars.
- les avatars secondaires seront en conséquence _non disparus_ pendant 10 jours alors que leur compte ne sera plus connectable :
  - sur un chat la carte de visite d'un avatar secondaire apparaîtra pendant 10 jours alors que le compte de _l'autre_ a déjà été détecté disparu.
  - les groupes pourront faire apparaître des membres pendant 10 jours alors que leur compte a déjà été détecté disparu.

### Disparition d'un compte
#### Effectuée par le GC
Le GC détecte la disparition d'un compte sur dépassement de la `dlv` de son avatar principal :
- il ne connaît pas la liste de ses avatars secondaires qu'il détectera _disparu_ 10 jours plus tard.
- le GC n'a pas accès à la connaissance de la tribu d'un compte et ne peut donc pas mettre à jour `tribu`:
  - le GC ne peut ni lire ni supprimer l'entrée du compte dans `tribu`.
  - il écrit en conséquence un document `gcvol` avec les informations tirées du `compta` du compte disparu (`cletX` clé de la tribu cryptée par la clé K du comptable, `it` index du compte dans sa tribu).
  - la prochaine connexion du Comptable scanne les `gcvol` et effectue la suppression de l'entrée `it` dans la tribu dont l'id est extraite de `cletK`.

La disparition d'un compte est un _supplément_ d'action par rapport à la _disparition_ d'un avatar secondaire.

#### Auto-résiliation d'un compte
Elle suppose une auto-résiliation préalable de ses avatars secondaires, puis de son avatar principal:
- l'opération de mise à jour de `tribu` est lancée, la session ayant connaissance de l'id de la tribu et de l'entrée du compte dans `tribu.act`. Le mécanisme `gcvol` n'a pas besoin d'être mis en oeuvre.

### Disparition d'un avatar
#### Sur demande explicite
Dans la même transaction :
- pour un avatar secondaire, le document `compta` est mis à jour par suppression de son entrée dans `mavk`.
- pour un avatar principal, l'opération de mise à jour de `tribu` est lancée, 
  - l'entrée du compte dans `tribu.act` est détruite,
  - le document `compta` est purgé.
- le documents `avatar` est purgé.
- le document `versions` de l'avatar a sa `dlv` fixée au jour `jdtr` du GC (il est _zombi et immuable_).
- l'id de l'avatar est inscrite dans `purge`.
- pour tous les chats de l'avatar:
  - le chat E, de _l'autre_, est mis à jour : son `st` passe à _disparu_, sa `cva` passe à null.
- purge des sponsorings de l'avatar.
- pour tous les groupes dont l'avatar est membre:
  - purge de son document `membre`.
  - mise à jour dans son `groupe` du statut `ast` à _disparu_.
  - si c'était l'hébergeur du groupe, mise à jour des données de fin d'hébergement.
  - si c'était le dernier membre _actif_ du groupe:
    - dans `versions` du groupe, `dlv` est mis au jour `jdtr` (il devient _zombi / immuable_), ce qui permet à une synchronisation avec une autre session (ou une connexion) de détecter la disparition du groupe.
    - purge du groupe puisque plus personne ne le référence (et donc qu'aucune session ne pouvait être dessus).
    - l'id du groupe est inscrite dans `purge`.

Dans les autres sessions ouvertes sur le même compte :
- si c'est l'avatar principal : 
  - la session est notifiée par un changement de `tribu`. Remarque : la disparition de compta n'est pas notifiée -c'est une purge-.
  - y constate la disparition de l'entrée du compte,
  - **la session est close** SANS mise à jour de la base IDB (les connexions en mode _avion_ restent possibles). 
- si c'est un avatar secondaire :
  - la session est notifiée d'un changement de `compta` et détecte la suppression d'un avatar.
  - la session supprime en mémoire ce qui est relatif à cet avatar : si c'était l'avatar courant, l'avatar primaire devient courant.
  - la session supprime toutes les entrées de IDB relatives à l'avatar.

Lors des futures connexions sur le même compte:
- si le compte n'existe plus la connexion de ne peut pas avoir lieu en _synchronisé ou incognito_.
- en mode _synchronisé_ les avatars et groupes qui étaient en IDB et ne sont plus existants sont purgés de IDB.

Dans les autres sessions ouvertes sur d'autres comptes, la synchronisation fait apparaître :
- par `tribu` : un compte qui disparaît dans `tribu` entre l'état courant et le nouvel état,
- par `chat` : un statut _disparu_ et une carte de visite absente,
- par `versions` _zombi_ des groupes : détection des groupes disparus, ce qui entraîne aussi la suppression des document `membres` correspondant en mémoire (et en IDB).

#### Effectuée par le GC
Le GC détecte la disparition d'un avatar par atteinte de sa `dlv` : **le compte a déjà disparu**.

**Conséquences :**
- il reste des chats référençant cet avatar et dont le statut n'est pas encore marqué _disparu_ (mais le GC n'y a pas accès).
- il reste des groupes dont le statut du membre correspondant n'est pas _disparu_ et des documents `membres` référençant un avatar (principal) disparu.

### Disparition d'un membre
#### Résiliation ou auto résiliation d'un membre
C'est une opération _normale_:
- purge de son document `membre`.
- mise à jour dans son `groupe` du statut `ast` à _disparu_.
- si c'était l'hébergeur du groupe, mise à jour des données de fin d'hébergement.
- si c'était le dernier membre _actif_ du groupe :
  - `dlv` du jour `djtr` dans `versions` du groupe, devient _zombi / immuable_. Ceci permet aux autres sessions de détecter la disparition du groupe.
  - purge du `groupe` puisque plus personne ne le référence (et donc qu'aucune session ne peut être dessus, la synchronisation de `versions` ayant permis de détecter la disparition).
  - l'id du groupe est inscrite dans `purge`.

### Chat : détection de la disparition de l'avatar E
A la connexion d'une session les chats avec des avatars E disparus ne sont pas détectés.

Lors d'une synchronisation de son chat (I), l'auto suppression de l'avatar E dans une autre session est détecté par l'état _disparu_ de E inscrit sur le chat (I).

Lors de l'ouverture de la page listant les _chats_ d'un de ses avatars, 
- la session reçoit les CV mises à jour ET les avis de disparitions des contacts E.
- lors de l'écriture d'un chat, la session reçoit aussi ce même avis de disparition éventuelle de l'avatar E.
- le _contact_ E est marqué _disparu_ en mémoire (le chat I y est mis à jour ainsi qu'en IDB).
- si l'avatar disparu est un avatar principal ET de la même tribu, l'opération `DisparitionCompte` peut être lancée : elle requiert l'id de la tribu et le nom complet de l'avatar, infos disponibles dans la mémoire de la session. Ceci permet d'anticiper le retrait du compte de sa tribu sans devoir attendre l'ouverture de la prochaine session du comptable et le traitement des `gcvol`.

> Un _contact_ peut donc apparaître "à tort" en session alors que l'avatar / compte correspondant a été résilié du fait, a) qu'il est un des comptes de la tribu de la session, b) qu'un chat est ouvert avec lui. Toutefois l'ouverture du chat ou de la page des chats, rétablit cette distorsion temporelle provisoire.

# Opérations GC, documents `log` et `purges`
### Singleton `checkpoint` (id 1)
Propriétés :
- `id` : 1
- `v` : date-time de sa dernière mise à jour ou 0 s'il n'a jamais été écrit.
- `_data_` : sérialisation de son contenu.
  - `start` : date-heure de lancement du dernier GC
  - `duree` : durée de son exécution en ms
  - `nbTaches` : nombre de taches terminées avec succès (sur 6)
  - `jdtr` : jour du dernier traitement GCRes terminé avec succès.
  - `log` : trace des exécutions des tâches : {}
    - `nom` : nom
    - `retry` : numéro de retry
    - `start` : date-heure de lancement
    - `duree` : durée en ms
    - `err` : si sortie en exception, son libellé
    - `stats` : {} compteurs d'objets traités (selon la tâche)

### `purges` : liste des ids des avatars / groupes à purger
Ces documents n'ont qu'une seule propriété id : l'id d'un avatar ou d'un groupe à purger.

### `GCRes` : traitement des résiliations
Soit `jdtr` le jour de la dernière exécution avec succès de GcRes.

L'opération récupère toutes les `id` des `versions` dont la `dlv` est **postérieure ou égale à `jdtr` et antérieure ou égale à la date du jour**:
- les comptes détectés non utilisés depuis un an,
- les avatars secondaires de ces comptes un peu plus tard,
- les membres des groupes accédés par ces compte.

**Une transaction pour chaque compte :**
- son document compta :
  - est lu pour récupérer `cletX it`;
  - un document `gcvol` est inséré avec ces données : son id est celle du compte.
  - les gcvol seront traités par la prochaine ouverture de session du comptable de l'espace ce qui supprimera l'entrée du compte dans tribu (et de facto libèrera des quotas).
  - le document compta est purgé.
- traitement de résiliation de son avatar

**Une transaction pour chaque avatar :**
- le document avatar est purgé
- l'id de l'avatar est inséré dans `purges`.
- le document version de l'avatar est purgé.

**Une transaction pour chaque membre `im` d'un groupe `idg` :**
Le document `membre` est purgé (son état dans ast de son groupe le rend non accessible).

Le document `groupe` est lu et le statut de `im` dans son `ast` est 0 (disparu):
- s'il existe encore un membre actif dans le groupe, la version est incrémentée et le document groupe écrit.
- sinon le groupe doit disparaître :
  - la dlv du document version du groupe est mise à jdtr - 1 jour (ce qui l'exclura des prochains traitement GcRes). versions servira pendant un an à notifier les autres sessions de la disparition du groupe.
  - le document groupe est purgé.
  - l'id du groupe est inséré dans `purges`.

### `GCHeb` : traitement des fins d'hébergement
L'opération récupère toutes les ids des document groupe où dfh est postérieure ou égale au jour courant.

Une transaction par groupe :
- dans le document version du groupe, dlv est positionnée à jdtr - 1 jour (ce qui l'exclura des prochaines opérations GcRes).
- le document groupe est purgé,
- l'id du groupe est inscrite dans purge.

### `GCPrg` : traitement des documents `purges`
Une transaction pour chaque document :
- suppression du Storage des fichiers de l'avatar / groupe.
- purge des notes, chats, transferts, membres du document.

### `GCTra` : traitement des transferts abandonnés
L'opération récupère toutes les documents transferts dont les dlv sont antérieures ou égales au jour J.

Le fichier id / idf cité dedans est purgé du Storage des fichiers.

Les documents transferts sont purgés.

### `GCFpu` : traitement des documents `fpurges`
Une transaction pour chaque document : suppression du Storage de ces fichiers.

### `GCDlv` : purge des versions / sponsorings obsolètes
L'opération récupère toutes les versions de dlv antérieures à jour j - 400. Ces documents sont purgés.

L'opération récupère toutes les documents sponsorings dont les dlv sont antérieures ou égales au jour J. Ces documents sont purgés.


## Lancement global quotidien
Le traitement enchaîne, en asynchronisme de la requête l'ayant lancé : 
- `GCRes GCHeb GCSpo GCTra GCObs GCPrg`

En cas d'exception de l'un deux, une seule relance est faite après une attente d'une heure.

> Remarque : le traitement du lendemain est en lui-même une reprise.

> Pour chaque opération, il y a N transactions, une par document à traiter, ce qui constitue un _checkpoint_ naturel fin.

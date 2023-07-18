# Données persistantes sur le serveur
## Espaces de noms
L'ensemble des documents est _partitionné en "espaces de nommage"_:
- des singletons globaux nommés sont des documents contenant des données d'administration technique.
- il y a un document `espaces` par partition / espace de nom dont l'id est une **entier de de 10 à 89**.
- tous les autres documents ont un id de 16 chiffres (et un ids secondaire pour les sous collections) dont les 2 premiers sont l'id de leur espace de nom.

Il est techniquement simple:
- d'extraire / exporter tous les documents d'un espace (dont _son_ document `espaces`) par simple condition sur la valeur de leurs ids.
- de purger un espace selon les mêmes critères.

> Il s'agit bien d'un _partitionnement_ : aucun document d'une partition ne référence un document d'une autre partition.

> _L'importation_ d'un espace N dans une base existante n'est concevable que si dans cette base N n'est pas déjà affecté. Dans les documents d'un espace il y a des liens vers d'autres documents (du même espace) : ces liens étant cryptés il n'est possible, ni de les lire, ni de les changer off-line.

> **L'administrateur technique** a pour rôle unique de gérer les espaces:
- les créer / les détruire,
- définir leurs quotas utilisables par le comptable de chaque espace,
- gérer une _notification / blocage_ par espace.

### Comptable de chaque espace : gestion des _tribus_
Pour un espace 29 par exemple il existe un compte 2900000000000000 qui est le comptable de l'espace. En plus des possibilités habituelles d'un compte, le comptable peut :
- créer / supprimer des _tribus_ et gérer leurs quotas de volumes V1 et V2,
- changer l'affectation d'un compte à une tribu,
- changer le pouvoir de _sponsor de sa tribu_ d'un compte (sauf pour lui-même),
- gérer des _notifications / blocages_ s'appliquant à des comptes précis ou à tous les comptes d'une tribu.

> Le rôle d'un _comptable_ est de gérer la répartition des comptes en tribus et d'affecter des quotas aux tribus. 

### Comptes _sponsors_ de leur tribu
Chaque compte fait partie d'une tribu, même le comptable qui est rattaché à la tribu _primitive_ de son espace. Un compte est créé dans une tribu par sponsoring,
- soit d'un compte existant _sponsor_ de sa tribu,
- soit du comptable dans la tribu choisie par le comptable.

Dans chaque tribu les comptes ayant un pouvoir de sponsor peuvent:
- sponsoriser la création de nouveaux comptes dans leur tribu,
- gérer la répartition des quotas entre les comptes de la tribu,
- gérer une _notification / blocage_ pour les comptes de leur tribu.

> Le comptable ne peut pas : se résilier lui-même, changer de tribu, supprimer son propre attribut _sponsor_.

## Présentation en Collections / Documents :
- les attributs **indexés** sont:
  - `id, ids` : les identifiants primaires et secondaires pour les _sous documents_.
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
      Document `checkpoint`

    /Collection `espaces`
      Documents                   id (numéro de 10 à 99)

    /Collection `gcvols`        
      Documents                   id

    /Collection `tribus`
      Documents                   id v iv

    /Collection `tribu2s`
      Documents                   id v iv

    /Collection `comptas`
      Documents                   id v iv hps1

    /Collection `versions`
      Documents                   id v iv dlv

    /Collection `avatars`
      Document                    id v iv vcv ivc hpc
        /Collection `notes`
          Documents               id ids v iv
        /Collection `sponsorings`
          Document `sponsoring`   id **ids v iv **dlv
        /Collection `chats`
          Documents               id ids v iv vcv ivc
        /Collection `transferts`
          Document `transfert`    id ids **dlv

    /Collection `groupes`
      Document `groupe`           id v iv dfh
        /Collection `membres`
          Document membre         id ids v iv vcv ivc **dlv        
        /Collection `notes`
          Document `note`       id ids v iv         
        /Collection `transferts`  
          Document `transfert`    id ids **dlv

    Collection  Attrs non indexés     Attrs indexés     Attrs collectionGroup
    singletons  _data_

    La _clé primaire_ est id:
    espace      id
    gcvols      id _data_
    tribus      id v _data_           iv
    tribu2s     id v _data_           iv
    comptas     id v _data_           iv hps1
    versions    id v _data_           iv dlv
    avatars     id v vcv _data_       iv ivc hpc
    groupes     id v _data_           iv dfh

    La _clé primaire_ est id+ids
    notes     id ids v _data_       iv
    sponsorings id v _data_           iv                dlv ids
    chats       id ids vcv v _data_   iv  ivc              
    membres     id ids vcv v _data_   iv  ivc           dlv
    transferts  id ids                                  dlv


Tous les documents, ont un attribut _data_ (mais toujours {} pour `transferts`), qui porte les informations sérialisées du document.
- les attributs externalisés hors de _data_ le sont parce qu'ils sont utilisés comme identifiants et / ou champs indexés.
- les attributs `iv ivc` ne sont pas explicitement présents dans _data_ étant calculables depuis `id, v, vcv` (calculés par l'écriture en base).

#### Documents d'une collection majeure
Les documents _majeurs_ sont ceux des collections `tribus tribu2s comptas avatars groupes`.
- leur identifiant porte le nom `id` et est un entier.
- chaque document porte une version `v`:
  - `tribus` et `comptas` ont leur propre version gérée dans le document lui-même.
  - `avatars` et `groupes` ont leurs versions gérées par le document `versions` portant leur id (voir ci-dessous)

#### Gestion des versions dans `versions`
- un document `avatar` d'id `ida` et les documents de ses sous collections `chats notes transferts sponsorings` ont une version prise en séquence continue fixée dans le document `versions` ayant pour id `ida`.
- idem pour un document `groupe` et ses sous-collections `membres notes transferts`.
- toute mise à jour du document maître (avatar ou groupe) et de leur sous-documents provoque l'incrémentation du numéro de version dans `versions` et l'inscription de cette valeur comme version du (sous) document mis à jour.

Un document `version` gère aussi :
- `dlv` : la signature de vie de son avatar ou groupe.
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
- (2) le document `tribus` de l'id de la tribu du compte - connu par (1)
- (3) les documents `avatars` des avatars du compte - listé par (1)
- (4) les documents `groupes` des groupes dont les avatars sont membres - listés par (3)
- (5) les sous-collections `notes chats sponsorings` des avatars - listés par (3)
- (6) les sous-collections `membres notes` des groupes - listés par (4)
- (7) le document `espaces` de son espace.
- pour le comptable, abonnement à **toutes** les tribus.

Au cours d'une session au fil des synchronisations, la portée va donc évoluer depuis celle déterminée à la connexion:
- des documents ou collections de documents nouveaux sont ajoutés à IDB (et en mémoire de la session),
- des documents ou collections sont à supprimer de IDB (et de la mémoire de la session).

Une session a une liste d'ids abonnées :
- l'id de son compte : quand un document `compta` change il est transmis à la session.
- les ids de ses `groupes` et `avatars` : quand un document `version` ayant une de ces ids change, il est transmis à la session. La tâche de synchronisation de la session va chercher le document majeur et ses sous documents ayant des versions postérieures à celles détenues en session.
- sa `tribu tribu2` actuelle (qui peut donc changer) pour un compte normal.
- implicitement le document `espaces` de son espace.
- **pour le Comptable** : en plus, 
  - implicitement toutes les `tribu`,
  - ponctuellement une `tribu2` _courante_.

**Remarque :** en session ceci conduit au respect de l'intégrité transactionnelle pour chaque objet majeur mais pas entre objets majeurs dont les mises à jour pourraient être répercutées dans un ordre différent de celui opéré par le serveur.
- en **SQL** les notifications pourraient être regroupées par transaction et transmises dans l'ordre.
- en **FireStore** ce n'est pas possible : la session pose un écouteur sur des objets `compta tribu versions` individuellement, l'ordre d'arrivée des modifications ne peut pas être garanti entre objets majeurs.

#### Id-version : `iv`
Un `iv` est constitué sur 16 chiffres :
- en tête des 10 premiers chiffres de l'`id` du document majeur.
- suivi sur 6 chiffres de `v`, numéro de la version.

Un `iv` permet de filtrer un document précis selon sa version. Il sert:
- **à gérer une mémoire cache dans le serveur des documents majeurs** récemment accédés : si la version actuelle est déjà en cache, le document _n'est pas_ chargé (seul l'index est accédé pour vérification).
- **à remettre à jour en session _incrémentalement_ UN document majeur ET ses sous-documents** en ne chargeant à la connexion QUE les documents plus récents que la version de leur document majeur détenue dans la session.

Comme un `iv` ne comporte pas une `id` complète mais seulement ses 10 premiers chiffres, de temps en temps (mais très rarement) le filtrage _peut_ retourner des _faux positifs_ qu'il faut retirer du résultat en vérifiant leur `id` dans le document.

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
- soit il n'y pas de `dlv` (0), soit la `dlv` dépasse le jour courant : on ne trouve jamais dans une versions de groupe une `dlv` _future_ (contrairement aux `versions` des avatars et `membres`).
- pour _supprimer_ un groupe on lui fixe une `dlv` du jour courant, il n'y a plus de _data_, il est désormais _zombi et immuable_ et sera purgé un an plus tard.

**Sur _sponsorings_:**
- jour à partir duquel le sponsoring n'est plus applicable ni pertinent à conserver. Les sessions suppriment automatiquement à la connexion les sponsorings ayant dépassé leur `dlv` (idem pour les synchronisations).
- il y a donc des sponsorings avec une `dlv` dans le futur : celle-ci peut être prolongée mais jamais avancée.
- dès dépassement du jour de `dlv`, un sponsorings est purgé (au moins purgeable).

**Sur _transferts_:**
- **jour auquel il est considéré que le transfert tenté a définitivement échoué**.
- un `transferts` est _immuable_, jamais mis à jour : il est créé, supprimé explicitement ou purgé à atteinte de sa `dlv`.
- permet au GC de détecter les transferts en échec et de nettoyer le Storage.
- l'index est _groupe de collection_ afin de s'appliquer aux fichiers des groupes comme des avatars.

#### `dfh` : **date de fin d'hébergement** sur un groupe
La **date de fin d'hébergement** sur un groupe permet de détecter le jour où le groupe sera considéré comme disparu. 

A dépassement de la `dfh` d'un groupe, le GC purge ce groupe et inscrit une `dlv` son `versions`.

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

**Les conserver en cache** par leur `id` est une bonne solution : mais en _FireStore_ (ou en SQL multi-process) il peut y avoir plusieurs instances s'exécutant en parallèle. Il faut en conséquence interroger la base pour savoir s'il y a une version postérieure et ne pas la charger si ce n'est pas le cas en utilisant un filtrage par `iv`. Ce filtrage se faisant sur l'index n'est pas décompté comme une lecture de document quand le document n'a pas été trouvé parce que de version déjà connue.

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

#### Nom complet d'un avatar / groupe / tribu
Le **nom complet** d'un avatar / groupe / tribu est un couple `[nom, cle]`
- `nom` : nom lisible et signifiant, entre 6 et 20 caractères. Le nom `Comptable` est réservé. Le Comptable n'a pas de nom.
- `cle` : 32 bytes aléatoires. Clé de cryptage.
  - Le premier byte de 10 à 89 donne l'id de l'espace, qu'on retrouve dans les deux premiers chiffres.
  - Le second byte donne le _type_ de l'id, qu'on retrouve comme troisième chiffre de l'id :
    - 0 : compte / avatar principal.
    - 1 : avatar secondaire.
    - 2 : groupe,
    - 3 : tribu.
  - Les autres bytes sont aléatoires, sauf pour le Comptable où ils sont tous 0.
- A l'écran le nom est affiché sous la forme `nom@xyzt` (sauf `Comptable`) ou `xyzt` sont les 4 derniers chiffres de l'id.

**Dans les noms,** les caractères `< > : " / \ | ? *` et ceux dont le code est inférieur à 32 (donc de 0 à 31) sont interdits afin de permettre d'utiliser le nom complet comme nom de fichier.

#### Les ids
Les singletons une id, un code court, qui permet de les accéder.

Les `espaces` de nom ont pour id un entier de 10 à 89 : on retrouve cette id en tête de tous les ids des documents de l'espace.

Une `id` est composé de 16 chiffres `nntaa..`, _entier safe_ en Javascript :
- `nn` : de 10 à 89. Numéro d'espace.
- `t` : 
  - 0: avatar principal / compte
  - 1: avatar secondaire
  - 2: groupe
  - 3: tribu
- `aa...` : 13 chiffres aléatoires.
  - pour le comptable c'est 13 zéros.
  - pour les autres c'est un hash des 32 bytes de la clé random du document (13 derniers chiffres, zéros à gauche si nécessaire)

**Pour chaque espace `nn`, un compte de nom réservé `Comptable`**
- son id est `nn 0 0 000 000 000 000` : le numéro de l'espace suivi de 14 zéros.
- sa clé de 32 bytes vaut : `[nn, 0, 0 ...]` : nn et 31 0.
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
- Les opérations de tests de type _ping_ ne le sont pas non plus.  
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

### Document `checkpoint`
Attribut opaque _data_ : contient les informations de point de reprise du GC.

## Collection `espaces`
Un document par espace (considéré comme faisant partie de la _partition_).

**Document:** - `id` : entier aléatoire
- `id` : de l'espace de 10 à 89.
- _data_ : notifications et taille.

## Collection `gcvols`
Il y a autant de documents que de comptes ayant été détectés disparus et dont les quotas n'ont pas encore été rendus à leur tribu par une session du Comptable. C'est un avis de disparition d'un compte que seul le comptable peut décrypter et traiter pour mette à jour sa tribu.

**Document:** - `id` : entier aléatoire
- `id` : id du compte disparu.
- _data_ : 
  - compteurs récupérés du document `compta` du compte. `q1, q2, v1, v2`
  - `nctkc` : `[nom, cle]` de la tribu qui doit récupérer les quotas **crypté par la clé K du comptable**.
  - `napt` : `[nom, rnd]` du compte disparu crypté par la clé t de sa tribu (décodée de `nctkc.rnd`). Le hash de `rnd` est la clé d'accès de l'élément du compte dans la `mbtr` de `tribu2` pour supprimer cette entrée.

## Collection `tribus` et `tribu2s`
Cette collection liste les tribus déclarées sur le réseau et les comptes rattachés à la tribu.

Le comptable est le seul qui,
- récupère à la connexion l'ensemble des tribus,
- est abonné aux modifications des tribus (pas seulement de la sienne).

Les données d'une tribu sont réparties sur 2 documents :
- `tribus` : une entête de synthèse,
- `tribu2s`: la liste des comptes de la tribu.

Le Comptable n'a besoin que ponctuellement du détail `tribu2s` que pour une seule tribu courante de travail.

Toute modification d'un `tribu2s` implique une mise à jour du `tribus` de même id (l'inverse n'est pas vrai). `tribus` est le gestionnaire de version des deux documents et une mise à jour d'un `tribu2s` lui confère la même version que celle du `tribus` associé (et mis à jour).

**Documents:** - `id` : numéro de la tribu  
Chaque document donne un descriptif de la tribu et la liste de ses parrains.
- `id` : numéro de la tribu 
- `v`
- `iv`
- _data_ : données de la tribu, synthèse (`tribus`) ou liste des comptes (`tribu2s`).

### Collection `comptas`

**Documents:**  - `id` : numéro du compte
Un document par compte rattaché à sa tribu portant :
- ses compteurs d'occupation d'espace
- le descriptif de son alerte quand il y en a une.

**Attributs:**
- `id` : numéro du compte
- `v`
- `iv`
- `hps1` : le hash du PBKFD de la ligne 1 de la phrase secrète du compte.
- _data_ : il contient en particulier `shay`, le SHA du SHA de X (PBKFD de la phrase secrète).

### Collection `versions`

**Documents:**  - `id` : numéro d'un avatar ou d'un groupe

**Attributs:**
- `id` : id d'avatar / groupe.
- `v` : plus haute version attribuée aux documents de l'avatar / groupe.
- `dlv` : signature de vie + 365 (aaaammjj).
- `iv`
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
- `iv`
- `vcv` : version de la carte de visite.
- `ivc` : calculée comme iv (9 + 6 chiffres) mais la version est celle de la mise à jour de la carte de visite.
- `hpc` : hash de la phrase de contact.
- _data_ : sérialisation des autres attributs. **Un avatar principal / compte est reconnaissable par son `id`** et comporte des données supplémentaires dans _data_.

### Sous-collection `notes`
Elle compte un document par note.

**Documents** : `ids`, numéro de note dans son avatar.
- `id` : id de son avatar.
- `ids` : identifiant relatif à son avatar.
- `v` : sa version.
- `iv`
- _data_ : données sérialisées de le note.

Une note est _logiquement supprimée_ quand sa _data_ est absente / null (il est _zombi_ et désormais immuable). La suppression est synchronisable par changement de la version `v` : il est purgé lors de la purge de son avatar.

### Sous-collection `transferts`
Elle comporte un document par transfert de fichier en cours pour une note de l'avatar.

L'upload d'un fichier est long. Ce document permet de gérer un commit à 2 phases:
- phase 1 : début de l'upload : insertion d'un document identifiant le fichier commençant à être uploadé,
- phase 2 : validation du fichier par le commit du document `note` : suppression du document.

**Documents:** - `ids` identifiant du fichier relatif à l'avatar de sa note.

**Attributs:**
- `id` : id de son avatar.
- `ids` : id du fichier relatif à l'avatar de sa note
- `dlv` : date de validité permettant de purger les fichiers uploadés (ou pas d'ailleurs) sur échec du commit entre les phases 1 et 2. Ceci permet de faire la différence entre un upload en cours et un vieil upload manqué.

### Sous-collection `sponsorings`
Un rendez-vous est identifié par une _phrase de reconnaissance_ convenue entre les deux avatars A et B pour le sponsoring de B par A.

Il y a un document par sponsoring en cours.

**Documents:** - `ids`, hash de la phrase secrète de reconnaissance

**Attributs:**
- `id` : id de l'avatar ayant fixé le rendez-vous.
- `ids` : hash de la phrase secrète de reconnaissance
- `v`
- `iv`
- `dlv` : purge automatique des sponsorings.
- _data_ : données du rendez-vous.

### Sous-collection `chats`
Elle comporte un document par chat ouvert avec un avatar (externe, pas un avatar du compte).

Un chat est éternel, une fois créé il ne disparaît qu'à la disparition des avatars en cause.

Un chat est dédoublé sur chacun des deux avatars partageant le chat.

**Documents:** - `ids`, numéro du chat pour l'avatar

**Attributs**
- `id` : id de son avatar.
- `ids` : identifiant du chat relativement à son avatar, hash du cryptage de `idA/idB` par le `rnd` de A.
- `v`
- `vcv`
- `iv`
- `ivc`
- _data_ : contenu du chat crypté par la clé de l'avatar. Contient le `[nom, clé]` de l'émetteur.

#### Avatars _externes_ E connaissant l'avatar A, chat entre avatars
- les membres des groupes dont A est membre.
- les comptes de sa tribu,
- tout avatar C ayant ouvert un jour un chat avec A (quand qu'ils étaient membres d'un même groupe ou étaient de la même tribu, même si maintenant ces deux conditions ne sont plus remplies).

Le Comptable est un _faux_ avatar externe puisqu'il est connu par une constante: de ce fait il peut faire l'objet d'un chat, voire d'être contacté pour invitation à un groupe.

Tout _avatar externe_ E connaissant A peut lui écrire un chat qui est dédoublé avec une copie pour A et une copie pour E.
- si A ne détruit pas un chat, il va disposer d'une liste de _contacts_ qui lui ont écrit.
- en supprimant le dernier chat avec E émis par E, A perd toute connaissance de E si c'était la seule raison pour laquelle il connaissait E.

## Collection `groupes`
Cette collection comporte un document par groupe existant.

**Documents :** - `id` : id du groupe
- `id` : id du groupe,
- `v`
- `iv`
- `dfh` : date de fin d'hébergement. Le groupe s'auto détruit à cette date là (sauf si un compte a repris l'hébergement, `dfh` étant alors remise à 0)
- _data_ : données du groupe.

### Sous-collection `membres`
Elle comporte un document membre par membre.

**Documents:** 
- `id` : id du groupe.
- `ids`: indice de membre relatif à son groupe.
- `dlv` : date de dernière signature lors de la connexion du compte de l'avatar membre du groupe.
- `v`
- `iv`
- _data_ : données du membre. Contient en particulier [photo, info], la carte de visite de l'avatar.

### Sous-collection `notes`
Elle compte un document par note.

**Documents:**
- `id` : id du groupe.
- `ids` : identifiant relatif à son groupe.
- `v` : sa version.
- `iv`
- _data_ : données sérialisées de la note.

Une note est _supprimée_ quand sa _data_ est absente / null (il est _zombi et immuable_). La suppression est synchronisable par changement de la version `v` : il sera purgé lors de la purge de son groupe.

### Sous-collection `transferts`
Elle comporte un document par transfert de fichier en cours pour une note du groupe.

L'upload d'un fichier est long. Ce document permet de gérer un commit à 2 phases:
- phase 1 : début de l'upload : insertion d'un document identifiant le fichier commençant à être uploadé,
- phase 2 : validation du fichier par le commit du document `note` : suppression du document.

**Documents:** 
- `ids` identifiant du fichier relatif au groupe de sa note.
- `id` : id de son groupe.
- `ids` : id du fichier relatif au groupe de sa note
- `dlv` : date de validité permettant de purger les fichiers uploadés (ou pas d'ailleurs) sur échec du commit entre les phases 1 et 2. Ceci permet de faire la différence entre un upload en cours et un vieil upload manqué.

# Détail des documents
## Sous-objets _génériques_
Ce sont des _structures_ qu'on peut trouver dans les _data_ de plusieurs documents,
- sérialisées,
- cryptées par une clé qui dépend du contexte où se trouve la structure.

### Notification
Les notifications servent à transmettre une information importante aux comptes avec plusieurs niveaux :
- **0-notification** d'information importante dont le compte doit tenir compte, typiquement pour réduire son volume, contacter le Comptable, etc.
- 1-2 la procédure de blocage est engagée:
  - **1-écritures bloquées** : compte avec un comportement de mode _avion_ mais peut toutefois chatter avec le comptable et les sponsors.
  - **2-lectures et écritures bloquées** : le compte ne peut plus **que** chatter avec son sponsor ou le Comptable et n'a plus accès à ses autres données.
- **3-compte bloqué** (connexion impossible): la procédure a conduit à la disparition des comptes concernés et à l'interdiction d'en créer d'autres sur la cible de la notification. Cet état n'est pas observable que dans des situations particulières (dans une tribu _bloquée_ on ne peut plus créer de compte).

**Le Comptable a un degré de liberté** supérieur aux autres comptes:
- en niveau 1 et 2 il peut: 
  - gérer les tribus, création, gestion de quotas, gestion des comptes et de leurs quotas,
  - chatter avec les comptes,
  - gérer les notifications aux tribus et comptes.
- en niveau 3, il ne peut plus rien faire. 

On trouve des notifications aux niveaux suivants :
- **G-niveau global** d'un espace, émise par l'Administrateur (cryptée par la clé du Comptable) à destination de **tous** les comptes.
- **T-niveau tribu** à destination de **tous** les comptes de la tribu. Cryptée par la clé de la tribu et émise :
  - soit par le Comptable,
  - soit par un sponsor de la tribu : toutefois quand il existe une notification du Comptable elle ne peut pas être modifiée par un sponsor.
- **C-niveau compte** à destination d'un seul compte. Cryptée par la clé de la tribu et émise :
  - soit par le Comptable,
  - soit par un sponsor de la tribu : toutefois quand il existe une notification du Comptable elle ne peut pas être modifiée par un sponsor.

Un compte peut donc faire l'objet de 0 à 3 notifications :
- le niveau applicable au jour J est le plus dégradé (le plus élevé).
- les 3 textes sont lisibles, avec leur source (Administrateur, Comptable, Sponsor).
- un compte ayant un niveau de blocage positif ne _signe plus_ ses connexions, ceci le conduira à la disparition si la situation persiste un an.

**_data_ d'une notification :**
- `idSource`: id de la source, du Comptable ou du sponsor, par convention 0 pour l'administrateur.
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
- `id` : de l'espace de 10 à 89.
- `v`

_data_:
- `notif` : notification de l'administrateur, cryptée par la clé du Comptable.
- `stats`: statistiques sérialisées de l'espace par le comptable {'ntr', 'a1', 'a2', 'q1', 'q2', 'nbc', 'nbsp', 'ncoS', 'ncoB'}
- `t` : taille de l'espace, de 1 à 9, fixé par l'administrateur
  son poids relatif dans l'ensemble des espaces.

## Document `gcvol`
- `id` : entier pseudo aléatoire, hash de `nctkc`.

_data_:
- `nctkc` : `[nom, cle]` de la tribu qui doit récupérer les quotas **crypté par la clé K du comptable**.
- `nat`: `[nom, clé]` de l'avatar principal du compte crypté par la clé de la tribu.
- `q1, q2, v1, v2`: quotas et volumes à rendre à la tribu, récupérés sur le `compta` du compte détecté disparu.

Le comptable obtient l'id et la clé de la tribu en décryptant `nctkc`, ce qui lui permet d'obtenir le `[nom, clé]` de l'avatar disparu : il peut ainsi,
- mettre à jour la `tribu`, 
- supprimer le compte de la liste des comptes de la tribus dans `tribu2`,
- mettre à jour les compteurs de quotas déjà affectés au niveau de la tribu.

## Document `tribu`
Données de synthèse d'une tribu.

_data_:
- `id` : numéro de la tribu
- `v` : sa version

- `nctkc` : `[nom, rnd]` de la tribu crypté par la clé K du comptable.
- `infok` : commentaire privé du comptable crypté par la clé K du comptable.
- `notif` : notification comptable / sponsor à la tribu (cryptée par la clé de la tribu).
- `cpt` : sérialisation non cryptée des compteurs suivants:
  - `a1 a2` : sommes des quotas attribués aux comptes de la tribu.
  - `q1 q2` : quotas actuels de la tribu
  - `nbc` : nombre de comptes.
  - `nbsp` : nombre de sponsors.
  - `ncoS` : nombres de comptes ayant une notification simple.
  - `ncoB` : nombres de comptes ayant une notification bloquante.

## Document `tribu2`
Liste des comptes d'une tribu.

_data_:
- `id` : numéro de la tribu
- `v` : sa version

- `mbtr` : map des membres de la tribu:
  - _clé_ : hash de la clé `rnd` du compte.
  - _valeur_ :
    - `na` : `[nom, rnd]` du compte crypté par la clé de la tribu.
    - `sp` : si `true` / présent, c'est un sponsor.
    - `q1 q2` : quotas attribués de volumes V1 et V2 (redondance dans l'attribut `compteurs` de `compta`)
    - `ntfb` : true si la notification est bloquante
    - `notif` : notification du compte (cryptée par la clé de la tribu).
    - `cv` : `{v, photo, info}`, carte de visite du compte cryptée par _sa_ clé (le `rnd` ci-dessus).

Le Comptable a la clé des tribus, c'est lui qui les créé et les supprime : elles sont cryptées dans `nctkc` de `compta`.

Tous les comptes connaissent le `nom, rnd` de leur tribu (donc leur id) : ce couple a été crypté par, 
- soit la clé K du compte à sa création (acceptation du sponsoring),
- soit par la clé _CV_ du compte lors du changement de tribu d'un compte par le Comptable, ce dernier ayant obtenu du compte demandeur son `[nom, rnd]` dans le chat de demande de changement de tribu.

Un compte peut accéder à la liste des comptes de sa tribu. 

L'ajout / retrait de la qualité de `sponsor` n'est effectué que par le comptable.

### Synchronisations et `versions`
Les versions de `tribu / tribu2` leur sont spécifiques et servent juste en synchronisation à garantir la progression sans retour dans le passé.

A la connexion d'une session, le chargement n'utilise pas la version (_comme si_ celle détenue en IDB était 0).

**Synchronisation d'un compte standard**
- abonné à **une** id de tribu, reçoit les mises à jour de tribu et tribu2.

**Synchronisation du comptable**
- abonné à l'id de la tribu "primitive", en reçoit les mises à jour de `tribu` et `tribu2`.
- abonné par défaut à toutes les mises à jour de tribu (toutes).
- à la déclaration d'une tribu _courante_, début du processus sur _la_ page de détail de cette tribu,
  - reçoit le `tribu2` (sans considération de version),
  - devient abonné à cette `tribu2` (donc en plus de primitive),
  - à la fin du processus de travail sur cette tribu courante, sé désabonne.

**Synchronisation des avatars et groupes**
- abonnement des sessions à leurs avatars et groupes,
- reçoivent les changements des `versions` correspondantes.

## Document `compta`
_data_:
- `id` : numéro du compte
- `v` : version
- `hps1` : hash du PBKFD de la ligne 1 de la phrase secrète du compte : sert d'accès au document `compta` à la connexion au compte.
- `shay` : SHA du SHA de X (PBKFD de la phrase secrète). Permet de vérifier la détention de la phrase secrète complète.
- `kx` : clé K du compte, cryptée par le PBKFD de la phrase secrète courante.
- `dhvu` : date-heure de dernière vue des notifications par le titulaire du compte, cryptée par la clé K.
- `mavk` : map des avatars du compte. 
  - _clé_ : id de l'avatar cryptée par la clé K du compte.
  - _valeur_ : `[nom clé]` : son nom complet cryptée par la clé K du compte.
- `nctk` : `[nom, clé]` de la tribu crypté par la clé K du compte, ou temporairement par la clé _CV_ du compte quand c'est le comptable qui l'a définie sur un changement de tribu.
- `nctkc` : `[nom, clé]` de la tribu crypté par la clé K **du Comptable**: 
- `napt`: `[nom, clé]` de l'avatar principal du compte crypté par la clé de la tribu.
- `compteurs`: compteurs sérialisés (non cryptés).

**Remarques :**  
- Le document est mis à jour à minima à chaque mise à jour d'une note (volumes dans compteurs).
- La version de `compta` lui est spécifique (ce n'est pas la version de l'avatar principal du compte).
- `napt nctkc` sont transmis par le GC dans un document `gcvols` pour notifier au Comptable, quel est le compte détecté disparu et sa tribu. L'entrée d'un compte disparu dans tribu2.mbtr est à supprimer après disparition du compte et c'est le Comptable qui peut faire ça en récupérant le rnd du compte disparu dans napt.

## Document `version`
_data_ :
- `id` : id d'avatar / groupe
- `v` : plus haute version attribuée aux documents de l'avatar / groupe.
- `dlv` : date de fin de vie, peut être future pour un avatar, est toujours dépassée pour un groupe. Date de purge définitive un an plus tard.
- `iv`
- `{v1 q1 v2 q2}`: pour un groupe, volumes et quotas des notes.

## Document `avatar`

**_data_  : données n'existant que pour un avatar principal**
- `mck` : map des mots-clés du compte cryptée par la clé K -la clé est leur code 1-99- ("code": nom@catégorie).
- `memok` : mémo personnel du compte.

**_data_ : données disponibles pour les avatars primaires et secondaires**
- `id`, 
- `v`,
- `vcv` : version de la carte de visite afin qu'une opération puisse détecter (sans lire le document) si la carte de visite est plus récente que celle qu'il connaît.

- `pub` : clé publique RSA
- `privk`: clé privée RSA cryptée par la clé K.
- `cva` : carte de visite cryptée par la clé _CV_ de l'avatar `{v, photo, info}`.
- `lgrk` : map :
  - _clé_ : Hash de l'id de l'avatar cryptée par la clé du groupe.
  - _valeur_ : cryptée par la clé K du compte de `[nomg, clég, im]` reçu sur une invitation. Pour une invitation en attente de refus / acceptation _valeur_ est cryptée par la clé publique RSA de l'avatar
  - une entrée est effacée par la résiliation du membre au groupe ou son effacement d'invitation explicite par un animateur ou l'avatar lui-même (ce qui l'empêche de continuer à utiliser la clé du groupe).
- `pck` : PBKFD de la phrase de contact cryptée par la clé K.
- `hpc` : hash de la phrase de contact.
- `napc` : `[nom, clé]` de l'avatar cryptée par le PBKFD de la phrase de contact.

**Invitation à un groupe**  
L'invitant connaît le `[nom, clé]` de l'invité qui est déjà dans la liste des membres en tant que pressenti. L'invitation consiste à :
- inscrire un terme `[nomg, cleg, im]` dans `lgrk` de son avatar (ce qui donne la clé du groupe à l'invité, donc accès à la carte de visite du groupe) en le cryptant par la clé publique RSA l'invité,
- l'acceptation par l'avatar transcode l'entrée de `lgrk` par la clé K.

### Cartes de visites
**Mise à jour: avatar et tribu**
- la création / mise à jour s'opère dans son `avatar` et dans `tribu2` (dans son élément).

**Mises à jour des cartes de visite des membres**
- la première inscription se fait à l'ajout de l'avatar comme _contact_ du groupe.
- en session, lorsque la page listant les membres d'un groupe est ouverte, elle envoie une requête au serveur donnant la liste des couples `[id, v]` des ids des membres et de leur version de carte de visite détenue dans le document `membre`.
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
  - I doit connaître le `[nom, cle]` de E : membre du même groupe, compte de la tribu, chat avec un autre avatar du compte, ou obtenu en ayant fourni la phrase de contact de E.
  - le chat est dédoublé, une fois sur I et une fois sur E.
- un chat a une clé de cryptage `cc` propre générée à sa création (première écriture):
  - cryptée par la clé K,
  - ou cryptée par la clé publique de l'avatar I (par exemple) : dans ce cas la première écriture de contenu de I remplacera cette clé par celle cryptée par K.
- un chat a un comportement d'ardoise : chaque écriture de l'un _écrase_ la totalité du contenu pour les deux. Un numéro séquentiel détecte les écritures croisées risquant d'ignorer la maj de l'un par celle de l'autre.
- si I essaie d'écrire à E et que E a disparu, le statut `st` de I vaut 1 pour informer la session.

L'id d'un chat est le couple `id, ids`. Du côté de A:
- `id`: id de A,
- `ids`: hash du cryptage de `idA/idB` par le `rnd` de A.

_data_:
- `id`
- `ids` : identifiant du chat relativement à son avatar, hash du cryptage de `idA/idB` par le `rnd` de A.
- `v`
- `vcv` : version de la carte de visite

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
- l'avatar A a mis à disposition son nom complet `[nom, clé]` crypté par le PBKFD de la phrase de contact.
- muni de ces informations, B peut écrire un chat à A.
- le chat comportant le `[nom clé]` de B, A est également en mesure d'écrire sur ce chat, même s'il ignorait avant le nom complet de B.

## Document `sponsoring`
P est le parrain-sponsor, F est le filleul-sponsorisé.

_data_
- `id` : id de l'avatar sponsor.
- `ids` : hash de la phrase de parrainage, 
- `v`
- `dlv` : date limite de validité

- `st` : statut. 0: en attente réponse, 1: refusé, 2: accepté, 3: détruit / annulé
- `pspk` : phrase de sponsoring cryptée par la clé K du sponsor.
- `bpspk` : PBKFD de la phrase de sponsoring cryptée par la clé K du sponsor.
- `descr` : crypté par le PBKFD de la phrase de sponsoring
  - `na` : `[nom, cle]` de P.
  - `cv` : `{ v, photo, info }` de P.
  - `naf` : `[nom, cle]` attribué au filleul.
  - `nct` : `[nom, cle]` de sa tribu.
  - `sp` : vrai si le filleul est lui-même sponsor (créé par le Comptable, le seul qui peut le faire).
  - `quotas` : `[v1, v2]` quotas attribués par le parrain.
- `ardx` : ardoise de bienvenue du sponsor / réponse du filleul cryptée par le PBKFD de la phrase de sponsoring

**Remarques**
- la `dlv` d'un sponsoring peut être prolongée (jamais rapprochée). Le sponsoring est purgé par le GC quotidien après cette date, en session et sur le serveur, les documents ayant dépassé cette limite sont supprimés et ne sont pas traités.
- Le sponsor peut annuler son `sponsoring` avant acceptation, en cas de remord son statut passe à 3.

**Si le filleul refuse le sponsoring :** 
- Il écrit dans `ard` au parrain expliquant sa raison et met le statut du `sponsoring` à 1. 

**Si le filleul ne fait rien à temps :** 
- `sponsoring` finit par être purgé par `dlv`. 

**Si le filleul accepte le parrainage :** 
- Le filleul crée son compte / avatar principal: `naf` donne l'id de son avatar et son nom. Les infos de tribu pour le compte sont obtenu de `nct`.
- la `compta` du filleul est créée et créditée des quotas attribués par le parrain.
- la `tribu` est mise à jour (quotas attribués), le filleul est mis dans la liste des comptes dans `tribu2`.
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
- son `st` contient la _date limite de validité_ indiquant qu'il sera automatiquement détruit à cette échéance.
- une note temporaire peut être prolongé, tout en restant temporaire.
- par convention le `st` d'une note permanent est égal à `99999999`. Un temporaire peut être rendu permanent par :
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
- `refs` : couple `[id, ids]` crypté par la clé de la note référençant une autre note _référence de voisinage_ qui par principe, lui, n'aura pas de `refs`.

**_Remarque :_** une note peut être explicitement supprimé. Afin de synchroniser cette forme particulière de mise à jour pendant un an (le délai maximal entre deux login), le document est conservé _zombi_ avec un _data_ absente / null. Il sera purgé avec son avatar / groupe.

**Mots clés `mc`:**
- Note personnelle : `mc` est un vecteur d'index de mots clés. Les index sont ceux du compte et de l'organisation.
- Note de groupe : `mc` est une map :
  - _clé_ : `im`, indice du membre dans le groupe. Par convention 0 désigne le groupe lui-même.
  - _valeur_ : vecteur d'index des mots clés. Les index sont ceux personnels du membre, ceux du groupe, ceux de l'organisation.

**Map des fichiers attachés :**
- _clé_ `idf`: numéro aléatoire généré à la création. L'identifiant _externe_ est `id` du groupe / avatar, `idf`
- _valeur_ : `{ nom, info, dh, type, gz, lg, sha }` crypté par la clé S de la note.

**Identifiant de stockage :** `id/idf`
- `id` : id de l'avatar / groupe auquel la note appartient.
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
- `id` : id du groupe ou de l'avatar du note.
- `ids` : id relative à son note (en fait à son avatar / groupe)
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
  - `dlv`  dans le `versions` du groupe est mis à la date du jour.
  - les notes et membres sont purgés.
  - le groupe est retiré au fil des connexions et des synchronisations des maps `lgrk` des avatars qui le référencent (ce qui peut prendre jusqu'à un an).
  - le document `versions` du groupe sera purgé par le GC à `dlv` + 365 jours.

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
- `ast` : **array** des statuts des membres (dès qu'ils ont été inscrits en _contact_) :
  - 10: contact, 
  - 30,31,32: **actif** (invitation acceptée) en tant que lecteur / auteur / animateur, 
  - 40: invitation refusée,
  - 50: résilié, 
  - 60,61,62: invité en tant que lecteur / auteur / animateur, 
  - 70,71,72: invitation à confirmer (tous les animateurs n'ont pas validé) en tant que lecteur / auteur / animateur, 
  - 0: disparu / oublié.
- `nag` : **array** des hash de la clé du membre crypté par la clé du groupe.
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
  - des demandes d'explication de la part d'un invité,
  etc.

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
- `nag` : `[nom, rnd]` : nom complet de l'avatar crypté par la clé du groupe :
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

Les `dlv` (date limite de validité) sont exprimées par un entier `aaaammjj`: elles signalent que ce jour-là, l'avatar -le cas échéant le compte- ou le membre sera considéré comme _disparu_.

A chaque connexion d'un compte, son avatar principal _prolonge_ les `dlv` de :
- son propre avatar et ses avatars secondaires dans leur document `version`.
- des membres (sur `membre`) des groupes connus par ses avatars dans `lgrk`. 

Les `dlv` sont également fixées:
- pour un avatar, à sa création dans son `versions`.
- pour un membre d'un groupe, à l'acceptation de son invitation.

> Les `dlv` ne sont pas _prolongées_ si le document `tribu2s` de l'avatar principal ou de sa `tribus` font l'objet d'une procédure de blocage.

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
- le GC n'a pas accès à la connaissance de la tribu d'un compte et ne peut donc pas mettre à jour `tribu / tribu2`:
  - le GC ne peut ni lire ni supprimer l'entrée du compte dans `tribu2`, l'id de cette entrée étant le hash de la clé _CV_ du compte.
  - il écrit en conséquence un document `gcvol` avec les informations tirées du `compta` du compte disparu (id crypté de la tribu, quotas attribués au compte à rendre disponibles à sa tribu).
  - la prochaine connexion du Comptable scanne les `gcvol` et effectue la mise à jour des quotas attribués de la tribu du compte disparu en lui ajoutant ceux du compte trouvés dans `gcvol` (pour autant que le compte n'ait pas déjà été traité et retiré de `tribu2`).

La disparition d'un compte est un _supplément_ d'action par rapport à la _disparition_ d'un avatar secondaire.

#### Auto-résiliation d'un compte
Elle suppose une auto-résiliation préalable de ses avatars secondaires, puis de son avatar principal:
- l'opération de mise à jour de `tribu / tribu2` est lancée, la session ayant connaissance de l'id de la tribu et de l'entrée du compte dans `tribu2`. Le mécanisme `gccol` n'a pas besoin d'être mis en oeuvre.

### Disparition d'un avatar
#### Sur demande explicite
Dans la même transaction :
- pour un avatar secondaire, le document `compta` est mis à jour par suppression de son entrée dans `mavk`.
- pour un avatar principal, l'opération de mise à jour de `tribu / tribu2` est lancée, 
  - l'entrée du compte dans `tribu2` est détruite,
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
  - la session est notifiée par un changement de `tribu2`. Remarque : la disparition de compta n'est pas notifiée -c'est une purge-.
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
- par `tribu2` : un compte qui disparaît dans `tribu2` entre l'état courant et le nouvel état,
- par `chat` : un statut _disparu_ et une carte de visite absente,
- par `versions` _zombi_ des groupes : détection des groupes disparus, ce qui entraîne aussi la suppression des document `membres` correspondant en mémoire (et en IDB).

#### Effectuée par le GC
Le GC détecte la disparition d'un avatar par dépassement de sa `dlv` : **le compte a déjà disparu**.

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
  - est lu pour récupérer les compteurs v1 / V2 et nctkc;
  - un document gcvol est inséré avec ces données : son id est celle du compte.
  - les gcvol seront traités par la prochaine ouverture de session du comptable de l'espace ce qui réaffectera les volumes v1 v2 q1 q2 à la tribu identifiée par nctkc et supprimera l'entrée du compte dans tribu2 (la clé du compte dans mbtr étant le rnd du compte récupéré par napt).
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

ApercuTribu, volumes étranges
ApercuTribu : changer les quotas de la tribu
PageTribu: changer les quotas du compte

PageTribus filtre blocage. Aperçu tribu en chantier

TODO next :
- FicheAvatar : gérer les restrictions d'accès - Phrase de contact - Ops
- sponsoring acceptation : ATTENTION l'opération getDocSponsoringIds sur le serveur est à reprendre !!!!!!!!!!!!!!!
- revoir GestionBase : tout faux, reseau, suppression base ...

# Application front-end A-social

## Structure de la vue principale App.vue
Deux zones :
- `header` : zone fixe en haut
  - barre _Avatar_ :
    - nom de l'avatar courant: un clic ouvre le panneau droit de détail de l'avatar
    - 7 icônes ouvrant :
      - la page `blocage`,
      - la page `session` et rappelant le mode de la session (synchronisé, incognito, avion),
      - la boîte de dialogue `deconnexion`
      - `outils` : ouvre une boîte de dialogue `outils`,
        - de gestion des bases locales pour chaque compte ayant accédé en mode synchro à l'application.
        - de test des accès au serveur et à la base locale, d'une opération d'écho et d'une opération en erreur,
        - de test des phrases secrètes.
      - **de switch entre les modes** clair et foncé,
      - **de choix de la langue**,
      - le panneau gauche `aide`.
  - barre _Groupe_ : 
    - nom du groupe courant (quand il y en a un): un clic ouvre le panneau droit de détail de l'avatar,
  - barre _Titre de la page_ :
    - une icône de retour à l'accueil (sauf pour la page `accueil`)
    - pour les pages affichant une liste longue, un _bloc de navigation_,
    - le titre de la page courante,
    - pour les pages affichant une liste longue, un bouton ouvrant le panneau droite de filtre,
    - une icône d'ouverture du panneau gauche d'aide.
- `page-container` : page courante.

### Pages
Les pages occupent la partie `page-container` :
- elles ont un titre, constant et peuvent se rapporter,
  - à rien (de facto la session),
  - à l'avatar courant: `secrets groupes chats sponsorings`
  - au groupe courant : `secrets membres`

Quand la session est en état :
- 0 : non connecté, la page `login` s'affiche,
- 1 : en chargement, la page `session` s'affiche,
- 2 : connecté, toutes les autres pages, celle _par défaut_ étant `accueil`.

#### Page `login`
Page proposant le dialogue de connexion.
- elle n'est visible que quand la session n'est pas connectée.
- elle permet d'accepter un sponsoring pour un nouveau compte.
- sur option `?666` dans l'URL elle propose la création du compte du comptable.

#### Page `session`
Elle affiche l'état de la session. Elle est visible :
- quand la session est en statut 1 en cours de chargement.
- sur demande quand la session est en statut 2 : bouton `session` dans la barre _Avatar_ ou bouton `session` de la page `accueil`.

Elle affiche l'état courant du chargement de la session : une fois la session ouverte (statut 2) cet état est constant.

#### Page `accueil`
Elle comporte trois groupes de boutons ouvrant des pages ou des panneaux gauches ou droits :

**Groupe 1, relatif à la session :**
- `deconnexion` : ouvre le dialogue de confirmation de la demande déconnexion,
- `session` : ouvre la page `session`,
- `toutestribus`: pour le comptable seulement ouvre la page `toutestribus` listant toutes les tribus,
- `mesavatars` : ouvre la page `mesavatars` listant les avatars du compte,
- `mesgroupes` : ouvre la page `mesgroupes` listant tous les groupes dont au moins un des avatars du compte est membre,
- `mescontacts` : ouvre le panneau droit `mescontacts` listant tous les contacts du compte,
- `matribu` : ouvre la page `matribu`,
- `macompta` : ouvre la page `macompta`,
- `messponsorings` : ouvre la page `messponsorings` listant les sponsorings en cours pour tous les avatars du compte,
- `secretsrecents` : ouvre la page `secretsrecents` listant les secrets des groupes ayant été créés / modifiés récemment,
- `fichiersavion` : ouvre la page `fichiersavion` listant les fichiers accessibles en mode avion (modes synchronisé et avion),
- `tflocaux` : ouvre la page `tflocaux` listant les textes et fichiers locaux (modes synchronisé et avion).

**Groupe 2, relatif à l'avatar courant :**
- `apropos` : ouvre le panneau droit de détail de l'avatar,
- `secrets` : ouvre la page `avsecrets` listant les secrets de l'avatar,
- `chats` : ouvre la page `chats` listant les chats de l'avatar,
- `groupes` : ouvre la page `groupes` listant les groupes dont l'avatar est membre,
- `sponsorings` : ouvre la page listant les `sponsorings` en cours déclarés par cet avatar,
- `invitations` : ouvre la page `invitations` listant les invitations de l'avatar reçues pour participer à un groupe.

**Groupe 3, relatif au groupe courant (quand il y en a un) :**
- `apropos` : ouvre le panneau droit de détail du groupe,
- `secrets` : ouvre la page grsecrets listant les secrets du groupe,
- `membres` : ouvre la page membres listant les membres du groupe,

#### Pages en mode formulaire / liste, filtre
Les pages `mesgroupes groupes membres avsecrets grsecrets secretsrecents toutestribus` peuvent basculer entre les modes _formulaire_ et _liste_.
- en mode liste, tous les items sont listés,
- en mode formulaire, un seul item est listé et une barre de navigation permet de passer aux items précédent, suivant, premier, dernier

Un **filtre** est un panneau latéral droite qui offre le choix de paramètres de sélection et de tri pour l'une des listes ci-dessus :
- quand la fenêtre est large, le panneau de filtre est automatiquement visible,
- quand la fenêtre est étroite, le panneau apparaît / disparaît sur action sur le bouton `filtre`.

### État de la session
Store : `session-store.js`

#### `mode`
- 0 : inconnu
- 1 : synchronisé
- 2 : incognito
- 3 : avion

#### `status`
- 0 : non connecté,
- 1 : connexion en cours,
- 2 : connecté, session en cours.


### `form` : formulaire / liste
Booléen : si `true` les pages `Contacts Groupes Membres Secrets Tribus` sont en mode _formulaire_, sinon en mode _liste_.

La page `Avatars` est toujours en mode _liste_.

En mode formulaire une petite barre de navigation permet de :
- passer aux items premier / précédent / suivant / dernier de la liste courante des contacts / groupes / membres / secrets.
- en status 22 : de sélectionner le contact courant -> passage au status 30
- en status 23 : de sélectionner le groupe courant -> passage au status 35

En mode liste une flèche de sélection à gauche permet de sélectionner un _courant_ :
- status 12 : de sélectionner l'avatar courant -> passage au status 20
- en status 22 : de sélectionner le contact courant -> passage au status 30
- en status 23 : de sélectionner le groupe courant -> passage au status 35

### Sets et listes
Les couples set / liste sont :
- calculés, soit à la connexion, soit sur l'arrivée sur un status donné
- recalculés lors des synchronisations (donc pas en mode _avion_)

Les sets sont des sets **d'ids** d'avatar, contacts, groupes, membres; secrets.

Chaque liste est associé à un set. Elle est une liste ordonnée **d'objets** :
- dont l'id est dans le set associé à la liste (objets _candidats_).
- un _filtre_ décrit les critères de sélection et de tri des objets candidats.
- une liste est recalculé quand :
  - soit son set a changé,
  - soit son _filtre_ a changé
  - soit un des objets dont l'id est dans le set a changé.

**Sets / listes / filtres :**
- `setA listeA` : set des ids avatars du compte - status >= 10
- `setC listeC filtreC` : set des ids des contacts de l'avatar _courant_. status 22 24 30 31 32 
- `setG listeG filtreG` : set des ids des groupes de l'avatar _courant_. status 23 24 35 36 37 38
- `setM listeM filtreM` : set des ids des membres du groupe _courant_. status 37
- `setSC listeSC filtreS` : set des ids des secrets du contact courant. status 32
- `setSG listeSG filtreS` : set des ids des secrets du groupe courant. status 38
- `setACG setSA listeSA filtreS` : set des ids de l'avatar courant et des groupes / contacts de l'avatar courant, set de leurs secrets. status 24
- `setT listeT filtreT` : set des ids des tribus (_estComptable_). status 13

#### `setA` : set des ids avatars du compte
- calcul : à l'ouverture de session
- recalcul sur synchronisation : 
  - sur changement de l'objet _Compte_ de la session si sa liste d'avatars a changé.

`listeA` : pas de _filtre_ sur les avatars, ils sont peu nombreux. Recalcul sur synchronisation :
- un des avatars d'id dans `setA` a changé

#### `setC` : set des ids des contacts de l'avatar _courant_
- calcul : arrivée sur les status :
  - 22 : ouverture de l'onglet _Contacts_
  - 24 : ouverture de l'onglet _Secrets_ (de l'avatar courant).
  - 30 31 32 : contact courant. (32 : _Secrets_ du contact courant).

- recalcul sur synchronisation : status 22 24 30 31 32
  - si `setA` a changé
  - si l'avatar courant a changé et que son set des contacts a changé

`listeC` : associé à `filtreC`. Recalcul quand :
- `setC` a changé
- `filtreC` a changé
- un des contacts dont l'id est dans `setC` a changé

#### `setG` : set des ids des groupes de l'avatar _courant_
- calcul : arrivée sur les status :
  - 23 : ouverture de l'onglet _Groupes_
  - 24 : ouverture de l'onglet _Secrets_ (de l'avatar courant).
  - 35 36 37 38 : groupe courant. (38 : _Secrets_ du contact courant).

- recalcul sur synchronisation : status 23 24 35 36 37 38
  - si `setA` a changé
  - si l'avatar courant a changé et que son set des groupes a changé

`listeG` : associé à `filtreG`. Recalcul quand :
- `setG` a changé
- `filtreG` a changé
- un des groupes dont l'id est dans `setG` a changé

#### `setM` : set des ids des membres du groupe _courant_
- calcul : arrivée sur les status :
  - 37 : ouverture de l'onglet _Membres_

- recalcul sur synchronisation : status 37
  - si `setA` ou `setG` ont changé
  - si un membre est synchronisé dont le groupe est le groupe courant

`listeM` : associé à `filtreM`. Recalcul quand :
- `setM` a changé
- `filtreM` a changé
- un des membres dont l'id est dans `setM` a changé

#### `setSC` : set des ids des secrets du contact courant
- calcul : arrivée sur le status :
  - 32 : ouverture de l'onglet _Secrets_ du tab CS

- recalcul sur synchronisation : status 32
  - si `setC` a changé
  - si un des secrets dont l'id est du contact courant est nouveau -n'était pas dans `setSC` antérieur-.

`listeSC` : associée à `filtreS`. Recalcul quand :
- `setSC` a changé
- si `filtreS` a changé
- si un des secrets dont l'id est du contact courant a changé

#### `setSG` : set des ids des secrets du groupe courant
- calcul : arrivée sur le status :
  - 38 : ouverture de l'onglet _Secrets_ du tab GMS

- recalcul sur synchronisation : status 38
  - si `setG` a changé
  - si un des secrets dont l'id est du groupe courant est nouveau -n'était pas dans `setSG` antérieur-.

`listeSG` : associée à `filtreS`. Recalcul quand :
- `setSG` a changé
- si `filtreS` a changé
- si un des secrets dont l'id est du groupe courant a changé

#### `setACG setSA`
`setACG` : set des ids de l'avatar courant et des groupes / contacts de l'avatar courant.
- union de l'id de l'avatar courant, `setG`, `setC`

`setSA` : set des ids secrets dont l'id est dans setACG.

- calcul : arrivée sur le status :
  - 24 : ouverture de l'onglet _Secrets_ du tab ACGS

- recalcul sur synchronisation : status 24
  - si `setC` `setG` ont changé
  - si un des secrets dont l'id est dans `setACG` est nouveau -n'était pas dans `setACG` antérieur-.

`listeSA` : associée à `filtreS`. Recalcul quand :
- `setACG` a changé
- si `filtreS` a changé
- si un des secrets dont l'id est dans `setACG` a changé

#### `setT` : set des tribus seulement pour _estComptable_
- calcul : sur arrivée sur le status :
  - 13 : ouverture de l'onglet _Tribus_ du tab CAT

- recalcul sur synchronisation : status 13
  - une tribu est synchronisée et n'était pas dans setT

`listeT` : associée à `filtreT`. Recalcul quand :
- `setT` a changé
- `filtreT` a changé
- une des tribus a changé. 

#### `compte`, `prefs`, `chat`
Objets de classes Compte, Prefs, Chat du compte d'une session connectée.

#### autres ...
- `sessionId`: identifiant de session (random(6) -> base64)
- `blocage`:
  - 1 : alerte informative
  - 2 : restriction de volume
  - 3 : session passive (lecture seule)
  - 4 : session bloquée
- `sessionSync`: objet de classe SessionSync traçant l'état de synchronisation d'une session sur IDB

### Listes, maintenues à jour en modes synchronisé / incognito, constantes en avion
AV - Liste des avatars du compte : tous états > 0

GR - Liste des groupes de l'avatar courant : états 2 3 4

CT - Liste des contacts de l'avatar courant : états 2 3 4

TR - Liste des tribus (comptable) : état 1T

MB - Liste des membres du groupe courant : état 4M

SC - Liste des secrets du contact courant : état 3

SG - Liste des secrets du groupe courant : état 4S

SA - Liste des secrets de l'avatar courant (personnels, de ses groupes et de ses contacts) : état 2S

## Stores
#### `config-store`
Données de configuration récupérées au boot (par `boot/appconfig.js`) de `assets/config/app-config.json`

#### `session-store`
État courant de la session active (cf ci-dessus).

#### `avatar-store`
Map par id d'un avatar des avatars du compte (objet de classe Avatar)

## Modèle des données en mémoire
Il est consitué :
- des stores, pour toutes les données susceptibles d'être affichées ou surveillées.
- du répertoire des cartes de visite.

#### Répertoire des cartes de visite
##### Classe : `NomGenerique`
- 4 variantes : `NomAvatar`, `NomGroupe`, `NomContact`, `NomTribu`
- propriétés :
  - `nom` : nom court immuable de l'objet
  - `rnd` : u8(32) - clé d'encryption
  - `id` : 
    - pour tous les objets sauf le Comptable : `hash(rnd)`. Hash entier _js safe_ de rnd.
      - type: reste de la division par 4 de l'id: 0:avatar 1:contact 2:groupe 3:tribu
    - pour le Comptable : `IDCOMPTABLE` de api.mjs : `9007199254740988`

##### Map statique `repertoire` de `modele.mjs`
Fonctions d'accès
- `resetRepertoire ()` : réinitialisation
- `setNg (ng)` : enregistrement d'un nom générique
- `getCle (id)` : retourne le rnd du nom générique enregistré avec cette id
- `getNg (id)` : retourne le nom générique enregistré avec cette id
- `getDisparu (id)` : retourne `true` si cette id a été déclarée _disparue_
- `setDisparu (id)` : déclare cette id comme _disparue_

`repertoire` a une entrée pour :
- 1-chaque avatar du compte,
- 2-chaque groupe dont un avatar du compte est membre
- 3-chaque contact dont un avatar du compte est conjoint interne
- 4-chaque avatar externe,
  - membre d'un des groupes ci-dessus,
  - conjoint externe d'un des contacts ci-dessus

Chaque entrée a pour clé `id` et pour valeur `{ ng, x }`
- `ng` : objet `NomGenerique`
- `x` : statut de disparition, `true` si disparu sinon `undefined` (vivant).

Une entrée de répertoire est quasi immuable : la seule valeur qui _peut_ changer est `x` : inscrite à la connexion du compte, elle n'est mise à jour par synchronisation (c'est le GC qui le positionne au plus une fois).

Le répertoire grossit en cours de session mais ne se réduit jamais. Il contient des objets "obsolètes":
- avatar du compte détruit.
- groupe n'ayant plus d'avatars du compte membre.
- contact quitté par leur conjoint interne.
- avatar externe n'étant plus membre d'aucun groupe ni conjoint externe d'aucun couple.


## Remarques diverses
Dans i18.js 
- ajouter `legacy: false,` sinon choix-langue ne s'initialise pas bien
- importer configStore pour récupérer la valeur initiale de la locale

Création du configStore qui va contenir la configuration
- chargement dans appconfig.js

choix-langue
- la liste des localeOptions est récupéré de configStore
- le modèle locale est la locale de i18n


{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Quasar App: chrome",
      "url": "https://localhost:8343",
      "webRoot": "${workspaceFolder}/src",
      "sourceMapPathOverrides": {
        "webpack://asocial/./src/*": "${webRoot}/*"
      }
    },
    {
      "type": "firefox",
      "request": "launch",
      "name": "Quasar App: firefox",
      "url": "https://localhost:8343",
      "webRoot": "${workspaceFolder}/src",
      "pathMappings": [
        {
          "url": "webpack://asocial/src",
          "path": "${workspaceFolder}/src"
        }
      ]
    }
  ]
}

# Maîtrise de la consommation des ressources et du droit d'accès des comptes
Les ressources techniques ne sont, ni infinies, ni gratuites. L'organisation qui gère l'hébergement de l'application a besoin de pouvoir _contrôler / maîtriser_ les volumes des secrets et le cas échéant, si c'est sa politique, de redistribuer le coût d'hébergement sur les comptes, ou certains d'entre eux.

Par ailleurs une organisation peut souhaiter restreindre l'usage d'un compte à leurs _adhérents_ : elle doit être en mesure de supprimer l'accès à un compte si celui-ci n'en fait plus partie, ou toute autre raison comme par exemple de ne plus acquitter sa juste part des coûts d'hébergement.

## Forfaits v1 et v2 attribués aux avatars
Pour chaque avatar deux _forfaits_ sont définis :
- le forfait v1 du volume occupé par les textes des secrets.
- le forfait v2 du volume occupé par les fichiers attachés aux secrets.

#### Unités de volume pour les forfaits
- pour v1 : 0,25 MB
- pour v2 : 25 MB

Les forfaits et maximum autorisés (avatars, groupes, contacts) sont donnés en nombre d'unités ci-dessus.

Le _prix sur le marché_ du méga-octet de volume v1 est environ 10 fois supérieur à celui du méga-octet de volume v2 ... mais comme l'utilisation de v2 pour stocker des photos, des sons et des clips video est considérable par rapport à du texte, le volume v2 peut-être prépondérant selon le profil d'utilisation.

Les forfaits typiques s'étagent de 1 à 255 : (coût mensuel)
- (1) - XXS - 0,25 MB / 25 MB - 0,09c
- (4) - XS - 1 MB / 100 MB - 0,35c
- (8) - SM - 2 MB / 200 MB - 0,70c
- (16) - MD - 4 MB / 400 MB - 1,40c
- (32) - LG - 8 MB / 0,8GB - 2,80c
- (64) - XL - 16 MB / 1,6GB - 5,60c
- (128) - XXL - 32 MB / 3,2GB - 11,20c
- (255) - MAX - 64 MB / 6,4GB - 22,40c

> A tout instant une augmentation des volumes effectivement occupés par les secrets **ne peut pas faire dépasser les forfaits** attribués à leurs avatars. Un forfait forcé en dessous du volume actuellement occupé impose à n'accepter que des opérations de réduction.

> Le transfert sur le réseau des fichiers attachés (download) **est ralenti** dès qu'il s'approche ou dépasse sur les 14 derniers jours le volume v2 : la temporisation est d'autant plus forte que cet écart l'est.

## Compte : UN avatar primaire + [0, n] secondaires
Un compte est représenté par son avatar primaire, créé à la création du compte, et d'éventuels avatars secondaires créés / résiliés par l'avatar primaire -le compte-.

L'auto-résiliation de l'avatar primaire correspond à la dissolution du compte et ne peut avoir lieu qu'après avoir résilié tous les avatars secondaires.

Chaque avatar primaire comme secondaire a **une ligne comptable** qui enregistre l'état courant et l'historique de ses utilisations de volumes V1 et V2.

C'est l'avatar primaire qui alloue des forfaits de volumes V1 / V2 à ses avatars secondaires en prenant sur ses propres forfaits.

### Compteurs d'une ligne comptable
La ligne comptable d'un avatar dispose des compteurs suivants :
- `j` : **la date du dernier calcul enregistré** : par exemple le 17 Mai de l'année A
- **pour le mois en cours**, celui de la date ci-dessus :
  - `v1 v1m` volume v1 des textes des secrets : 1) moyenne depuis le début du mois, 2) actuel, 
  - `v2 v2m` volume v2 de leurs pièces jointes : 1) moyenne depuis le début du mois, 2) actuel, 
  - `trm` cumul des volumes des transferts de pièces jointes : 14 compteurs pour les 14 derniers jours.
- **forfaits v1 et v2** `f1 f2` : les derniers appliqués.
- `rtr` : ratio de la moyenne des trm / forfait v2
- **pour les 12 mois antérieurs** `hist` (dans l'exemple ci-dessus Mai de A-1 à Avril de A),
  - `f1 f2` les derniers forfaits v1 et v2 appliqués dans le mois.
  - `r1 r2` le pourcentage du volume moyen dans le mois par rapport au forfait: 1) pour v1, 2) pour v2.
  - `r3` le pourcentage du cumul des transferts des pièces jointes dans le mois par rapport au volume v2 du forfait.
- `s1 s2` : pour un avatar primaire, total des forfaits alloués à ses avatars secondaires.

### Décomptes des volumes des secrets
**Les secrets personnels** sont décomptés sur la ligne comptable de l'avatar qui les détient.

**Les secrets d'un contact** sont décomptés sur chacune des lignes comptables des avatars ayant déclaré accéder aux secrets du contact.

**Pour les secrets de groupe :**
- un avatar membre du groupe est _hébergeur_ du groupe : il peut fixer deux limites v1 / v2 de volume maximal pour les secrets du groupe.
- les secrets sont décomptés sur la ligne comptable de l'avatar hébergeur du groupe.
- l'hébergeur peut changer : les volumes occupés sont transférés du compte antérieur au compte repreneur.
- si l'hébergeur décide d'arrêter son hébergement, la mise à jour des secrets est suspendue tant qu'un repreneur ne s'est pas manifesté. Si la situation perdure au delà d'un an le groupe est déclaré disparu, les secrets sont effacés.

## LE compte du comptable
"Le" **comptable** d'une organisation est un compte particulier :
- sa phrase secrète est déclarée dans la configuration de l'organisation (son hash, pas celle en clair).
- il n'est pas limité en volumes.
- il peut avoir des _contacts_ (les parrains qu'il a créé),
- il peut faire partie de _groupes_ : il peut par exemple être invité en tant que lecteur pour juger le cas échéant du côté éthique ou non de certains secrets.
- son nom est `Comptable`,
- son id est une constante universelle ( 9007199254740988 : plus grand entier sur 53 bits divisible par 4).

Il peut déclarer des **tribus**, les doter en ressources et les bloquer, le cas échéant jusqu'à disparition.

## Tribus et leurs parrains
Une tribu rassemble un ensemble de comptes dont on souhaite maîtriser le volume global:
- tout compte n'appartient qu'à une seule tribu à un instant donné,
- le **comptable** peut, au cas par cas, passer un compte d'une tribu à une autre (fermeture d'une tribu, changement d'affectation dans l'organisation ...). 
- quand il existe un système de facturation, c'est l'échelon _tribu_ qui paye.

**Informations attachées à une tribu**  
_Identifiant_ : `[nom, cle, id]` de la tribu.
- La clé est tirée aléatoirement à la création,
- L'id est un hash de la clé.

L'identifiant `[nom, rnd]` est transmis crypté par la clé de leur `couple`,
- par le comptable lors de la création d'un compte parrain de la tribu,
- par un compte parrain lors du parrainage d'un compte de la tribu.
- par le comptable dans le cas où il change un compte de tribu.

L'identifiant (nom, clé, id) de sa tribu _cryptée par la clé publique du comptable_ est inscrite dans chaque compte primaire:
- c'est un calcul long mais le comptable _peut_ finir par associer à une tribu la liste de tous les comptes en faisant partie et obtenir les valeurs de leurs forfaits.
- _en revanche seul un compte peut savoir quels volumes occupent effectivement ses avatars_ et son taux d'utilisation de ses forfaits (le comptable ne peut connaître l'occupation réelle que globalement, pas par tribu).

**Données d'une tribu:**
- identifiant, nom et clé.
- commentaire du comptable.
- liste des parrains de la tribu maintenue à jour par le comptable sur parrainage d'un parrain et détection d'un parrain disparu.
- blocage:
  - niveau (0 à 4)
  - classe du blocage (0 à 9) reprise dans la configuration de l'organisation
  - libellé explicatif
  - date-heure de dernier changement de statut.
- volumes:
  - sommes des volumes V1 et V2 déjà attribués aux comptes de la tribu.
  - volumes V1 et V2 en réserve pour attribution aux comptes actuels et futurs de la tribu.

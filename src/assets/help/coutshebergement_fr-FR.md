@@Index général de la documentation [index](https://raw.githack.com/dsportes/asocial-doc/master/index.md)
# Maîtrise des coûts d'hébergement de l'application

> **L'administrateur technique** est le représentant technique du prestataire d'hébergement. Il n'a pas de compte mais _une clé d'accès_ à l'application pour initialiser un espace pour une organisation et effectuer quelques actions techniques: exportation d'espaces, suppressions d'espaces, notifications importantes.

Le coût d'usage de l'application pour une organisation correspond aux coûts d'hébergement des données et de traitement de celles-ci. Selon les techniques et les prestataires choisis, les coûts unitaires varient mais existent dans tous les cas.

## _Base de données_ et _fichiers_ (Storage)
Leur stockage sur "disques" ont des coûts unitaires très différents (variant d'un facteur de 1 à 25).
- les _bases de données_ requièrent un stockage très proche du serveur et des accès très rapide,
- les fichiers sont enregistrés dans des _Storage_, des stockages techniques distants ayant une gestion spécifique et économique du fait d'être soumis à peu d'accès (mais de plus fort volume).

# Abonnement : coût de l'espace occupé en permanence
Un abonnement correspond aux coûts récurrents mensuels pour un compte, même quand il ne se connecte pas.

L'abonnement est décomposé en deux lignes de coûts correspondant à l'occupation d'espace en base de données et en _storage_:
- **Prix unitaire de stockage d'un document** multiplié par le **nombre total de documents dans la base de données**: notes personnelles et notes d'un groupe hébergé par le compte, chats personnels non _raccrochés_, nombre de participations actives aux groupes.
- **Prix unitaire du stockage dans un _storage_** multiplié par le **volume total des fichiers attachés aux notes**.

Pour obtenir le coût correspondant à ces deux volumes il est pris en compte, non pas _le volume effectivement utilisé à chaque instant_ mais forfaitairement **les _volumes maximaux_ forfaitaires** auquel le compte est abonné.

> Les volumes _effectivement utilisés_ ne peuvent pas dépasser les volumes maximum de l'abonnement. Dans le cas où un changement de l'abonnement réduit a posteriori ces maximum en dessous des volumes utilisés, les volumes n'auront plus le droit de croître.

# Consommation : coût de calcul et de transfert des fichiers
La consommation correspond à l'usage effectif de l'application quand une session d'un compte est ouverte. Elle comporte 4 lignes:
- **(nl) nombre de _lectures_** (en base de données): nombre de notes lues, de chats lus, de contacts lus, de membres de groupes lus, etc.
- **(ne) nombre _d'écritures_** (en base de données): mises à jour des données, notes, chats, cartes de visite, commentaires personnels, etc.
- **(vd) volume _descendant_** (download) de fichiers téléchargés en session depuis le _Storage_.
- **(vm) volume _montant_** (upload) de fichiers envoyés dans le _storage_ pour chaque création / mise à jour d'un fichier.

## Prix unitaires de marché
_L'ordre de grandeur_ des prix du marché, donne les coûts suivants en centimes d'euro annuel:

    Unité u1 : 250 notes chats / groupes -> 0,45c/an
    Unité u2 : 100Mo                     -> 0,10c/an

    Pour un compte XXS ( 1 u1 :   250n /  1 u2 :  100Mo) ->   1,6 c/an
    Pour un compte MD  ( 8 u1 :  2000n /  8 u2 :  800Mo) ->  13,0 c/an
    Pour un compte XXL (64 u1 : 16000n / 64 u2 : 6,4Go ) -> 102,0 c/an

> Les volumes V1 apparaissent environ 25 fois plus coûteux au méga-octet que les volumes V2, mais comme les fichiers peuvent être très volumineux, le coût d'utilisation dépend de ce que chacun met en textes des notes et en fichiers attachés.

> Les volumes _effectivement utilisés_ ne peuvent pas dépasser les volumes maximaux de l'abonnement, sauf dans le cas où ceux-ci ont été volontairement réduits a posteriori en dessous des volumes actuellement utilisés.

## La consommation de calcul dépend de la façon dont chacun se sert de l'application

Ces coûts de _calcul_ correspondent directement à l'usage fait de l'application quand une session d'un compte est ouverte. Ils dépendent de _l'activité_ du titulaire du compte et de la façon dont il se sert de l'application. Le coût de calcul est la somme de 4 facteurs, chacun ayant son propre tarif:
- **(nl) nombre de _lectures_** (en base de données): nombre de notes lues, de chats lus, de contacts lus, de membres de groupes lus, etc. **Lu** signifie extrait de la base de données.
  - en utilisant un mode _synchronisé_ la très grande majorité des données étant déjà présentes sur l'appareil du titulaire du compte, les _lectures_ se résument à celles des données ayant changé ou ayant été créés depuis la fin de la session précédente. 
  - pour un même service apparent, le coût des _lectures_ peut varier, par exemple par rafraîchissement systématique des cartes de visite, ou en gardant un chat en ligne au lieu de raccrocher ...
  - en mode _avion_ le nombre de lectures est par principe nul.
- **(ne) nombre _d'écritures_** (en base de données): outre quelques écritures de gestion du compte, elles correspondent principalement aux _mises à jour des notes, chats, cartes de visite, commentaires personnels, gestion d'un groupe_.
- **(vd) volume _descendant_** (download) de fichiers téléchargés depuis le _Storage_. Chaque acte est explicitement demandé par le titulaire du compte: 
  - quand il utilise une _copie locale_ d'un fichier sur son appareil en mode _synchronisé_, le volume téléchargé est nul, sauf si le fichier a changé. 
  - il est possible de télécharger sur son appareil toutes les notes d'une sélection faite à l'écran (et potentiellement toutes celles accessibles par le compte): en mode _synchronisé_ ça ne coûte rien, SAUF s'il a été demandé de télécharger aussi les fichiers leur étant attachés ce qui occasionne un coût de volume descendant qui peut être très important.
- **(vm) volume _montant_** (upload) de fichiers envoyés dans le _Storage_. Chaque création / mise à jour d'un fichier est décompté dans ce volume montant.

_L'ordre de grandeur_ des prix de marché donne les coûts unitaires suivants en euros:

    1 million de lectures               -> 0,80€  (pour un compte 0,02€ ... 1,0€ / an)
    1 million d'écritures               -> 2,00€  (pour un compte 0,03€ ... 0,2€ / an)
    Transfert d'un GB avec le Stockage  -> 0,15€  (pour un compte 0,02€ ... 0,8€ / an)

> Les estimations d'un coût annuel pour un compte sont arbitraires car très dépendantes de l'usage de chacun et en particulier de la fréquence des sessions.

# Coût total
Le coût total est la somme des coûts induits par chacune des 6 lignes valorisés par leur coût unitaire: `n1*u1 + v2*u2 + nl*cl + ne*ce + vd*cd + vm*cm`
- `n1` = _nombre maximal de notes, chats, participations aux groupes_
- `v2` = _volume maximal_ des fichiers attachés aux notes.
- `nl ne` : nombres de lectures et d'écritures (en millions),
- `vd vm` : volume descendant et montant.
- les coûts d'abonnement `n1 v2` sont calculés au prorata du temps d'existence du compte dans le mois et de la durée elle-même du mois.

Un compte peut consulter à tout instant, en particulier:
- le détail des coûts _exacts_ cumulés pour le mois en cours et les 3 précédents,
- les nombres _moyens_ de notes / chats / groupes, _effectivement utilisés_ le mois en cours et les 3 précédents.
- le volume _moyen_ des fichiers _effectivement stockés_ le mois en cours et les 3 précédents.
- sa moyenne journalière de _consommation_ estimée sur le mois en cours et les 3 précédents.

>_L'ordre de grandeur_ d'un coût total par compte varie en gros de **0,5€ à 3€ par an**. Individuellement ça paraît faible. Ce n'est plus du tout négligeable pour une organisation assurant les frais d'hébergement pour un millier de comptes ...

# Les comptes autonomes _A_ et de l'organisation _O_
Une organisation peut avoir des comptes ayant des modes de fonctionnement différents.

## Comptes autonomes "A"
Chaque compte fixe lui-même son abonnement et sa consommation n'est pas limitée. Il paye les deux.

Un procédé confidentiel permet à un compte "A" de faire parvenir des _paiements_ pour augmenter son solde sans que personne ne puisse déterminer à qui ces _paiements_ ont été attribués (sauf le compte lui-même).

Le compte peut faire des dons à d'autres comptes "A".

## Comptes de l'organisation "O"
L'organisation paye l'abonnement et la consommation pour le compte mais en contrepartie,
- elle lui fixe des limites potentiellement bloquantes d'abonnement et de consommation,
- elle peut bloquer le compte, par exemple s'il quitte l'organisation, est décédé, etc. 

Le Comptable attribue ces forfaits, aidés par des comptes _comptables délégués_.

# Le Comptable
_Le Comptable_ désigne une personne, voire un petit groupe de personnes physiques qui:
- a négocié avec le prestataire hébergeur les conditions et le prix de l'hébergement.
- a été créé par l'administrateur technique du prestataire à la création de l'espace de l'organisation.

C'est lui-même un compte "O" (c'est l'organisation qui paye ses coûts) _presque_ normal en ce sens qu'il peut avoir des notes, des chats, participer à des groupes, créer des avatars secondaires, etc. Il a le privilège,
- **de gérer les forfaits gratuits attribués par l'organisation** aux comptes "O", conjointement avec des comptes _comptable délégués_,
- de déclarer si l'organisation accepte ou non des comptes _A autonomes_,
- de pouvoir sponsoriser des comptes _autonomes_ (bien qu'étant compte "O" lui-même)

> Le **Comptable** n'a pas plus que les autres comptes les moyens cryptographiques de s'immiscer dans les notes des avatars des comptes et leurs chats: ce n'est en aucune façon un modérateur et il n'a aucun moyen d'accéder aux contenus, pas plus qu'à l'identité des avatars secondaires des comptes.

# Gestion des crédits d'un compte _autonome_ "A"
**Un compte _autonome_ fixe lui-même, son niveau d'abonnement**, c'est à dire ses _volumes maximum_ et peut les changer à son gré, mais pas en-dessous des seuils déjà occupés.

Un compte autonome a des compteurs de consommation qu'il ne peut que constater.

> **Nul ne peut bloquer / résilier un compte _autonome_**, mais le compte peut se retrouver bloqué lui-même s'il n'a pas crédité suffisamment son compte pour supporter ses coûts **d'abonnement et de consommation**.

Les crédits sont exprimés par commodité en _unité monétaire_ (signe €). Chaque organisation fixe le _cours_ de _l'euro interne de l'application_ par rapport à une vraie unité monétaire.

L'enregistrement `credit` de son compte est **crypté par la clé du compte**: lui-seul peut y accéder. Il comporte deux propriétés:
- `total`: 
  - le cumul des crédits qu'il a récupérés et enregistrés depuis l'ouverture de son compte (ou depuis qu'il est devenu compte _autonome_),
  - diminués des dons qu'il a offert à d'autres comptes "A" amis ou à l'occasion d'un sponsoring.
- `tickets` : liste des _tickets_ des ligne de crédits _en attente_ de réception et d'enregistrement par le Comptable.

Le compte dispose à tout instant de la somme des coûts d'abonnement et de consommation depuis le début de la vie du compte (ou depuis qu'il est _devenu compte autonome_), il a les moyens de s'assurer que **son solde est positif**.

> Avant de devenir _négatif_ et de déclencher une restriction d'accès, le solde d'un compte a été _faiblement positif_. Le compte en est averti lors de sa connexion avec le nombre de jours _estimé_ avant de devenir négatif si son profil de consommation reste voisin de celui constaté sur les 4 mois antérieurs.

Un compte "A" peut être _sponsorisé_:
- par le Comptable qui lui fait un don de bienvenue (supporté par l'organisation).
- par un autre compte "A" qui lui fait un don pris sur son solde.
- le crédit initial laisse le temps au nouveau compte de faire parvenir un paiement au Comptable.

### Opération de crédit
- (I) **le titulaire du compte génère un _ticket_** qui est stocké dans la liste de ses _tickets en attente_ dans son enregistrement `credit` (donc crypté).
- (II) il le cite en référence d'un _paiement_ qu'il effectue lui-même, soit le communique à un tiers qui effectue le _paiement_ en citant le ticket.
- (III) le Comptable reçoit un _paiement_, typiquement un virement d'une banque, mais aussi tout autre procédé accepté par l'organisation. Il enregistre le ticket cité en référence du paiement avec son montant, la date de réception et un commentaire facultatif.
- (IV) le compte se connecte, ou appui sur un bouton ad hoc dans sa session et ceci récupère ses tickets en attente et / ou enregistrés par le Comptable. 
  - dans son enregistrement `credit` le total est incrémenté et la liste des tickets en attente réduite des tickets reçus.
  - dans la liste des tickets enregistrés par le Comptable, le ticket reste présent (jusqu'à M+2 se sa création).

> Les _tickets_ étant enregistrés cryptés par la clé des comptes, aucune corrélation ne peut être faite entre la source d'un _paiement_ et le compte qui en bénéficie.

#### Restriction _d'accès minimal_ : solde négatif 
A la connexion d'un compte, mais ensuite en session, un _solde_ est calculé : total de son crédit MOINS total de ses coûts d'abonnement et de consommation. 

S'il est négatif, l'accès du compte à l'application est  **minimal** (voir le détail ci-après): en gros il ne peut plus que gérer son crédit, en consulter l'état de consommation et chatter avec le Comptable (mais ne peut ni consulter ses données, ni les modifier).

> Avant de devenir _négatif_ le solde d'un compte a été _faiblement positif_. Le compte en est averti lors de sa connexion avec le nombre de jours _estimé_ avant de devenir négatif si son profil de consommation reste voisin de celui des mois antérieurs.

# Gestion des abonnements et limites de calcul des comptes _O_ par _tranche_
Le Comptable dispose pour distribution aux comptes "O",
- d'un _volume maximal total_ pour les notes, chats, groupes,
- d'un _volume maximal total_ pour les fichiers attachés aux notes,
- d'une _limite maximale totale des coûts mensuels de calcul_. 

**Il découpe ces _volumes et limites_ en _tranches_** et est en charge de les ajuster au fil du temps.
- dans chaque _tranche_ le Comptable désigne des _comptables délégués_ à qui il confie la distribution des _volumes maximaux et limites de calcul_ aux comptes "O" rattachés à la tranche.
- tout compte "O" étant attachée à **une tranche** à sa création, seul le Comptable peut le basculer d'une tranche à une autre.

## Comptes _comptables délégués_ d'une tranche
Le Comptable peut attribuer / enlever le rôle de **_comptable délégué d'une tranche_** à un compte "0":
- un _délégué_ peut sponsoriser un nouveau compte en lui attribuant des volumes maximaux et une limite de calcul prélevés sur la tranche qu'il gère: il peut aussi déclarer à ce moment le nouveau compte lui-même _délégué_ de cette tranche.
- un _délégué_ peut augmenter / réduire les volumes maximaux et limites de calcul des comptes liés à la tranche qu'il gère.
- le Comptable peut déclarer plus d'un compte _délégué_ pour une tranche donnée.
- le Comptable peut aussi passer un compte "O" d'une tranche à une autre.

> La gestion des forfaits gratuits des comptes "O" s'effectue à deux niveaux en déléguant la maîtrise fine de ceux-ci aux sponsors de chaque tranche.

**Quelques règles :**
- un compte "O" a au moins le _délégué_ de sa tranche qui l'a sponsorisé en tant que _contacts_, dispose de sa carte de visite et peut chatter avec lui (et avec le Comptable).
- un compte _délégué_ de sa tranche :
  - connaît _par leur numéro_ tous les comptes de sa tranche mais n'en connaît la _carte de visite_ que si son avatar principal est un de ses _contacts_ (il l'a sponsorisé, a ouvert un chat avec lui -typiquement au sponsoring_, ou participe à un même groupe). Sinon il n'en connaît que le numéro.
  - peut en lire les compteurs d'abonnement et de consommation.
- aucun compte, pas même le Comptable, ne peut connaître les avatars secondaires des comptes et n'a aucun moyen d'accéder à leurs notes et chats.

Le Comptable dispose de la liste des tranches (puisqu'il les as créées) et pour chacune dispose des mêmes possibilités qu'un sponsor de la tranche.

## A sa création une organisation **n'accepte pas** de comptes _autonomes_
- Le Comptable peut lever cette interdiction et en autoriser la création,
- il peut aussi supprimer cette autorisation: cela n'a aucun effet sur les comptes _autonomes_ existants et ne vaut que pour les créations ultérieures.
- il précise si le basculement de compte O à compte A est soumis à l'accord du compte.

> Il faut TOUJOURS l'accord explicite d'un compte "A" pour le rendre "O": un compte "A" peut parfaitement refuser le risque de se faire bloquer par l'organisation et préférer continuer à payer ses coûts d'hébergement.

> L'accord explicite d'un compte "O" pour être rendu "A" n'est requis que si c'est spécifié dans la configuration de l'espace par le Comptable. L'organisation peut, si sa charte le lui permet, ne plus vouloir supporter les coûts d'un compte sans son accord en sachant qu'après cela elle ne peut plus le _bloquer_.

Le Comptable peut obtenir un état statistique des abonnements / consommation des comptes mais:
- cet état est _anonyme_, mêmes les numéros de compte n'apparaissent pas,
- cet état reprend les compteurs d'abonnement et de consommation **mais pas les crédits des comptes "A"**.

# Notifications et restrictions d'accès des comptes
Une _notification_ est un message important dont la présence est signalée par une icône dans la barre d'entête de l'écran et parfois par un affichage lors de la connexion d'un compte, voire d'une _pop up_ en cours de session quand elle est liée à une restriction d'accès du compte.

## Une _notification_ peut être porteuse d'une restriction d'accès
Quand une session a une ou des restrictions d'accès, ses actions sont plus ou moins limitées.

## Volume en réduction
Cette restriction bloque toutes les actions menant à une augmentation de volume:
- création d'une note, d'un chat, acceptation d'une invitation à un groupe,
- remplacement d'un fichier par un fichier plus important.

Causé par:
- dépassement des limites d'abonnements (nombre de documents, volume des fichiers).

## Lecture seule
En lecture seule une session ne peut que consulter les données (comme en mode _avion_) MAIS peut faire des échanges sur les _chats d'urgence_ avec le Comptable et pour un compte "O" les _délégués de sa tranche_ qu'il connaît.

Pour un compte "O":
- décrété par le Comptable ou un de ses délégués: pour tous les comptes de la tranche ou pour certains comptes seulement.

## Espace figé
Strictement aucune écriture ne peut être faite: l'administrateur technique a provoqué cette restriction typiquement pour procéder à une opération technique d'export, verrouiller une archive d'un espace, ou par mesure de rétorsion.

Pour tous les comptes (y compris le Comptable)
- par l'administrateur technique.

## Accès minimal
En accès minimal une session ne peut plus qu'effectuer des échanges sur les _chats d'urgence_ avec le Comptable et pour un compte "O" les _délégués de sa tranche_ qu'il connaît.

Causé par:
- pour un compte "O", par le Comptable ou ou un de ses délégués: pour tous les comptes de la tranche ou pour certains comptes seulement.
- pour un compte "A": crédit épuisé (solde négatif).

## Espace clos
L'administrateur technique a effacé les données de l'espace: il ne subsiste plus que cette notification dont le texte donne la raison et le cas échéant indique si l'espace est accessible à une autre adresse.

Pour tous les comptes (y compris le Comptable)
- par l'administrateur technique.

## Notifications de l'administrateur technique: espace _figé_ et _clos_
L'administrateur peut émettre une notification, le cas échéant porteuse d'une restriction déclarant un espace _figé_ ou _clos_:
- le texte, soit est simplement informatif, soit explicite les raisons de la restriction.
- **espace figé** : l'espace est en lecture seule, sans mise à jour possible. 
- **espace clos** : il n'y a plus de données, du moins accessibles par les comptes. Le texte indique à quelle URL / code d'organisation les comptes vont trouver l'espace transféré (s'il y en a un).

L'administrateur technique a ainsi les moyens:
- de figer temporairement un espace, par exemple:
  - pendant la durée technique nécessaire à son transfert chez un autre hébergeur,
  - en le laissant en ligne et permettant aux comptes de consulter une image archivée pendant que l'opération technique se poursuit.
- de clôturer un espace en laissant une explication, voire une solution, aux comptes (où l'espace a-t-il été transféré).

## Notifications pour les comptes "O": accès _lecture seule_ et _minimal_ 
Ces notifications peuvent être émises par le Comptable ou ses _lélégués sur une tranche_. Ce peut être une simple information ponctuelle et ciblée plus ou moins large, ne soumettant pas les comptes à des restrictions d'accès, mais elle peut aussi être porteuse d'une _restriction_:
- Restriction d'accès en _lecture seulement_,
- Restriction d'accès _minimal_.

Ces notifications peuvent avoir deux portées:
- _tous_ les comptes O d'une tranche,
- _un_ compte O spécifique.

## Notifications automatiques par surveillance de la consommation
- pour un compte "A": solde (crédits - coûts).
- pour un compte "O": comparaison entre la consommation sur le mois en cours et le précédent (rapportée à une année) et la limite de consommation.

**Sans restriction d'accès quand,** 
- **compte "A": le solde est _faiblement positif_**: le nombre de jours ou le solde devrait rester positif en cas de poursuite de la tendance de consommation des 4 derniers mois est inférieur à un seuil d'alerte (60 jours).
- **compte "O": la consommation du mois en cours et précédent est _importante_**, rapportée à l'année, elle dépasse 80% de la _limite de consommation_.

Une pop-up apparaît à la connexion et une icône _d'attention_ figure en barre d'entête.

**Avec restriction _d'accès minimal_ quand,**
- **compte "A": le solde est _négatif_**.
  - Toutefois, le Comptable peut _autoriser un découvert_ d'un montant de son choix qui prendra fin N jours (de son choix) après la déclaration d'autorisation.
- **compte "O": la consommation mensuelle moyenne est _excessive_**, elle dépasse la _limite de consommation_. La consommation est évaluée sur le mois en cours et le mois précédent au prorata du nombre de jours de vie du compte (et ramenée à 30 jours).
  - Toutefois, le Comptable peut _autoriser un découvert_ de X% (de son choix) qui prendra fin N jours (de son choix) après la déclaration d'autorisation.

**Les connexions du compte ne le maintiennent plus en vie**: au plus tard dans un an, si cette restriction n'est pas levée, le compte disparaîtra.

Une pop-up apparaît à la connexion et une icône _d'alerte_ figure en barre d'entête.

## Notification de la surveillance automatique des dépassements des volumes maximaux
Cette notification s'applique à tous les comptes.
- Notification sans restriction d'accès quand les volumes maximaux sont _approchés_.
  - Le nombre de notes et chats effectivement existantes est à moins de 10% du nombre maximal déclaré.
  - Le volume des fichiers existant effectivement est à moins de 10% du volume maximal des fichiers.
- Notification avec restriction aux opérations diminuant les volumes quand les maximum sont dépassés.

# Synthèse des restrictions d'accès
- F : _espace figé_ : par l'administrateur technique
- L : _lecture seulement_ : pour les seuls comptes O, par le Comptable ou un sponsor
- M : _minimal_ :
  - pour les seuls comptes O, par le Comptable ou un sponsor,
  - pour tous les comptes, du fait d'un solde négatif,
- D : _décroissant_ par dépassement des volumes maximaux.

    F L M D
    O O O O   gestion du crédit et des volumes maximaux
    N O O O   chats avec le Comptable et les délégués
    O O N O   lecture des données
    N N N -   mises à jour
          O     - n'augmentant pas les volumes
          N     - augmentant les volumes

Source des notifications pour un compte:
- une de l'administrateur technique
- une par tranche du Comptable ou d'un des sponsors de la tranche
- une par compte du Comptable ou d'un des sponsors de la tranche
- une de surveillance du niveau du solde
- une de surveillance de non dépassement des volumes maximaux.

> Le compte le plus _notifié_ peut avoir jusqu'à 5 notifications à un instant donné, l'amenant au pire à cumuler plusieurs restrictions.

# Passage d'un compte "A" à "O"
Un compte "A" a demandé à passer "O". Son accord consiste à écrire `YO` sur le chat avec le Comptable / un délégué de la future tranche souhaitée. Ce doit être l'échange le plus récent écrit par le compte.

Le Comptable ou un délégué désigne le compte dans ses contacts et le chat permet de savoir s'il y a accord ou non.

Il peut poursuivre son activité sans risquer un blocage du fait d'un historique de consommation transitoire peu significatif.

### Rendre "A" un compte "O"
C'est une opération du Comptable et/ou d'un délégué selon la configuration de l'espace, qui n'a besoin de l'accord du compte que si la configuration de l'espace l'a rendu obligatoire.

L'accord du compte est marqué comme ci-avant par `YO` dans un chat.

Le compte bénéficie d'un _don_ minimal pour lui laisser le temps d'enregistrer son premier crédit.

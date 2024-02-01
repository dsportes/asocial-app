# Vue d'ensemble de l'application

Une organisation, association, un groupe de quelques amis ... peut décider de disposer de son propre **espace a-social**, par exemple `monasso`, et a choisi un prestataire d'hébergement qui lui a créé un espace accessible par une URL comme `https://srv1.monhebergeur.net/` 

Pour se connecter à son espace, il suffit d'ouvrir dans un navigateur la page Web à cette adresse et de fournir: 
- `monasso` : le code de son organisation enregistrée par l'hébergeur, 
- `mabellephrasetressecrete` une phrase secrète personnelle d'au moins 24 signes.
 
Au bout de cette URL, un serveur délivre l'application et gère les accès à une base centrale où les données de chaque organisation sont stockées.

> Derrière cette URL, jusqu'à 80 organisations étanches les unes des autres peuvent être gérées. Le prestataire peut enregistrer une nouvelle organisation en moins d'une minute après s'être mis d'accord sur le prix de l'hébergement.

> Une organisation n'est pas attachée à son prestataire initial, il peut faire exporter ses données vers un autre, ce qui ne prend que le temps de la copie des données, ou même s'il en a le minimum de compétences informatiques devenir son propre hébergeur, le logiciel de l'application étant disponible _open source_.

@@En savoir plus sur le changement de prestataire - [page2](../page2_fr-FR.md)

# Créer son compte, se connecter
Avant de pouvoir accéder à l'application une personne doit créer son propre compte **sponsorisé par une autre y ayant déjà un compte**. 

Sponsor et sponsorisé ont convenu entre eux,
- du nom du sponsorisé, par exemple `Charles`,
- d'une preuve de sponsoring par une expression comme `le hibou n'est pas chouette`.

Le nouveau compte, s'il accepte les conditions proposées par le sponsor, procède à la création de son compte après avoir cité le nom de l'organisation `monasso` et la preuve de sponsoring.

Il finalise la création de son compte en déclarant sa **propre phrase secrète de connexion**.
- elle a au moins 24 signes et reste uniquement dans la tête du titulaire, n'est enregistrée sous aucune forme nulle-part et pourra être changée à condition de pouvoir fournir celle actuelle.
- une partie de la phrase, située vers principalement au début, ne doit pas _ressembler_ à celle d'une autre phrase déjà enregistrée afin d'éviter de tomber par hasard sur la phrase d'un autre compte.

> La phrase secrète crypte indirectement toutes les données du compte aussi bien dans la base centrale que dans les micro bases locales de chacun des navigateurs utilisés par le compte. Un piratage des appareils des titulaires des comptes ou de la base centrale centrale ne donnerait au _pirate_ que des informations indéchiffrables.

> _Revers de cette sécurité_ : si la personne titulaire d'un compte oublie sa **phrase secrète de connexion**, elle est ramenée à l'impuissance du pirate. Son compte s'autodétruira dans un délai d'un an et toutes ses données et notes disparaîtront.

@@ En savoir plus sur la connexion [page2](./page2_fr-FR.md)

@@ En savoir plus sur la création d'un compte [page3](./page3_fr-FR.md)

# Avatars principal et secondaires d'un compte
En créant son compte, le titulaire a créé son **avatar principal**. Un avatar,
- est identifié par un _numéro_ à 16 chiffres (dont 13 aléatoires) immuable.
- a un **nom** immuable, par exemple `Charles`.
- peut avoir une **carte de visite** cryptée constituée d'une photo et / ou d'un court texte, par exemple `Charles III, roi des esturgeons et d’Écosse`, tous deux facultatifs et modifiables uniquement par son titulaire.

Ultérieurement le titulaire du compte peut créer des **avatars secondaires**, chacun ayant un numéro, un nom et une carte de visite facultative. Il peut utiliser à son gré des circonstances l'un ou l'autre de ses avatars, ce qui confère plusieurs _personnalités_.

> **Le titulaire du compte est le seul à connaître la liste de ses avatars secondaires**. En regardant deux avatars, personne (même l'administrateur technique) n'est en mesure de savoir s'ils correspondent au même compte.

> Comme dans la vraie vie **plusieurs avatars peuvent porter le même "nom"**: à l'écran les 4 derniers chiffres du numéro identifiant complète les noms ( `Charles#9476` et `Charles#5432`). Leurs cartes de visite permettront aux autres de distinguer Charles "_Général de brigade_" de Charles "_Roi des esturgeons_".

# Notes personnelles
**Un note porte un texte** d'au plus 5000 caractères pouvant s'afficher avec un minimum de _décoration_, gras, italique, titres, listes ... Ce texte est modifiable.

**Des fichiers peuvent être attachés à une note**
- beaucoup de types de fichiers (`.jpg .mp3 .mp4 .pdf ...`) s'affichent directement dans le navigateur. 
- il est possible d'ajouter et de supprimer des fichiers attachés à une note.
- quand plusieurs fichiers portant le même _nom_ dans la note, ils sont vus comme des révisions successives, qu'on peut garder, ou ne garder que la dernière, ou celle de son choix.

**Une note PEUT faire référence à UNE note _parent_**
- les notes apparaissent à l'écran sous forme hiérarchique, une note parent ayant en dessous d'elle des notes _enfants_ (ou aucune).
- les notes n'ayant pas de note _parent_ apparaissent rattachées à celui des avatars du compte qui a été choisi: cet avatar est une _racine_ de la hiérarchie des notes.

> Un avatar peut créer des notes **personnelles**, les mettre à jour, les supprimer et les indexer par des mots clés personnels. Elles sont cryptées, comme toutes les données des comptes, et seul le titulaire du compte a, par l'intermédiaire de sa phrase secrète, la clé de cryptage apte à les décrypter.

# Contacts
Un compte peut rester totalement isolé et n'avoir aucun contact avec les autres: à la création de son compte par _sponsoring_, le sponsor comme le sponsorisé peuvent déclarer vouloir ou non être _contacts mutuels_.

Il y a d'autres occasions d'établir pour un compte d'établir un _contact_:
- directement en rencontrant le titulaire d'un compte dans n'importe quel contexte réel ou virtuel et en se mettant d'accord pour devenir _contact_.
- en étant membre d'un même _groupe_ (voir plus avant).

Un contact est _un avatar_ affiché avec son nom (et son numéro): **sa carte de visite** est visible. 

Un contact est réciproque, si A a B dans ses contacts, B a A dans ses contacts: chacun a échangé avec l'autre la clé de cryptage qui permet de lire la carte de visite de l'autre.

**Un compte peut attacher un commentaire personnel et ses propres mots clés** à ses _contacts_ ce qui facilite le filtrage dans des listes selon des critères variables: lui seul les déclarent et les voit.

> Sauf disparition de l'avatar en contact, un contact ne peut pas être dissous. Les mots clés attribués permettent de le classer comme _indésirable_ ou _oubliette_ et de le filtrer pour ne plus le voir dans les listes.

# "Chats" entre contacts
Deux avatars _en contact_ peuvent ouvrir un _chat_ dans lequel ils peuvent écrire des échanges, des textes courts:
- un échange sur un chat ne peut plus y être modifié mais peut être supprimé par son auteur,
- le volume total des échanges sur le chat est limité à 5000 signes, les plus anciens échanges étant perdus en cas de dépassement de cette limite.

Une fois créé un chat ne disparaît que quand les deux avatars qui le partage ont disparu.
- pour ne pas être importuné, l'un des 2 peut _raccrocher_ le chat, ne plus y écrire. L'autre peut toujours l'alimenter mais sans être certain d'être lu ...
- chacun peut attacher au _contact du chat_ ses propres mots clés (par exemple _indésirable_ ou _important_ ...) que l'autre ne voit pas, et filtrer les chats en évitant ceux _raccrochés_ ou _indésirable_ par exemple.

#### Établissement d'un contact / chat par une _phrase de contact_
B peut déclarer une _phrase de contact_, unique dans l'application et pas trop semblable à une déjà déclarée. Par exemple : `les courgettes sont bleues au printemps`
- B peut la changer ou la supprimer à tout instant.
- B peut communiquer, par un moyen de son choix, cette phrase à A qui peut ainsi à la fois inscrire B comme contact et ouvrir un chat avec lui. 
- A et B devenus contacts l'un de l'autre pourront aussi inviter, ou faire inviter, l'autre aux groupes auxquels ils participent (voire plus si affinités).

> Une _phrase de contact_ a une durée de vie courte afin d'éviter que des personnes non souhaitées mises au courant de la phrase de contact, n'ouvrent un chat: l'impact serait toutefois limité, on n'est pas obligé de le lire!.

# Groupes
Un avatar peut créer un **groupe** dont il sera le premier membre _actif_ et y aura un pouvoir _d'animateur_. Un groupe a,
- un numéro interne, un **nom** immuable et **une carte de visite** (comme un avatar).
- un **chat partagé par les membres du groupe**.
- un **espace de notes partagées** entre les membres du groupes qui peuvent les lire et les éditer.

Um avatar connu dans un groupe y a plusieurs états:
- **simple contact**: il a été inscrit comme contact du groupe mais lui-même ne le sait pas et ne connaît pas le groupe.
- **contact invité**: un membre actif ayant pouvoir d'animateur a invité le contact à devenir membre actif: s'il accepte il deviendra membre actif, sinon il retournera à l'état de simple contact. Nul ne devient membre actif à son insu, il faut l'accepter explicitement.
- **membre actif**: il peut participer à la vie du groupe.

#### Accès aux membres et / ou aux notes
Un membre actif _peut_ recevoir lors de son invitation deux _droits_:
- **droit d'accès aux autres membres** et au chat (ou non),
- **droit d'accès aux notes** en lecture, en lecture et écriture ou pas du tout.

Lors de son invitation il peut aussi recevoir le **pouvoir d'animation**. S'il ne l'a pas, un membre actif l'ayant peut lui conférer ce pouvoir (mais ne pourra plus lui enlever).

> **Certains groupes peuvent être créés à la seule fin d'être un répertoire de contacts** cooptés par affinité avec possibilités de chat. Personne n'y lit / écrit de notes.

> **Certains groupes peuvent être créés afin de partager des notes de discussion**, un animateur ayant seul connaissance des membres du groupe avec des notes de facto anonymes.

Enfin des groupes sont créés avec le double objectif de réunir des avatars qui se connaissent mutuellement, échangent sur le chat et partagent des notes.

**Tout membre actif peut attacher un commentaire personnels et ses propres mots clés à un groupe** afin de faciliter sa recherche quand il est membre de beaucoup de groupes. Personne d'autre n'en a connaissance.

#### Quelques règles simples:
- seul um membre actif **ayant pouvoir d'animation** peut,
  - donner / retirer le droit d'accès aux autres membres et au chat à un membre actif donné,
  - donner / retirer le droit d'accès aux notes à un membre actif donné (en lecture ou lecture / écriture), 
  - donner un pouvoir d'animation à un membre actif qui ne l'a pas,
  - inviter un _simple contact_ à devenir membre actif, avec ou sans droit accès aux autres membres et au chat, avec ou sans droit d'accès aux notes, avec ou sans pouvoir d'animateur,
  - _oublier_ un simple contact qui n'apparaîtra plus dans le groupe.
- **tout membre actif** peut,
  - s'il a droit d'accès aux membres, inscrire comme _simple contact_ un de ses contacts,
  - décider de plus utiliser ses droits d'accès aux membres et aux notes, et décider de les utiliser à nouveau.
  - décider de redevenir _simple contact_, voire d'être _oublié_ par le groupe (ne figurant même plus comme _simple contact_).

> Un _membre actif ayant pouvoir d'animation_ ne peut pas changer les droits et pouvoir d'un autre _animateur_ (sauf à lui-même).

> Un _animateur_ ne peut pas _résilier_ un membre actif indésirable mais peut lui retirer ses droits d'accès aux autres membres et aux notes, donc de facto lui interdire tout accès au groupe.

Tout membre actif d'un groupe ayant accès aux membres, les a comme _contact_ en connaît leurs cartes de visites: il _peut_ ouvrir un chat avec n'importe quel membre _actif_ (qui a formellement accepté  une invitation avec la conséquence d'être visible par les autres membres actifs).

> Le fait d'établir un _chat_ avec un membre du groupe en fait un contact _permanent_, même si le groupe est ultérieurement dissous ou que le membre cesse d'y être actif.

> Un groupe disparaît de lui-même dès lors qu'il n'a plus de membres actifs.

## Notes du groupe
- elles sont cryptées par une clé aléatoire spécifique au groupe qui a été transmise à chaque membre lors de l'invitation au groupe.
- hormis les membres actifs du groupe ayant droit d'accès aux notes, personne ne peut accéder aux notes du groupe.
- quand un nouveau membre accepte une invitation au groupe avec droits d'accès aux notes, il a immédiatement accès à toutes les notes existantes du groupe. S'il redevient _simple contact_ ou perd son droit d'accès aux notes (de par sa volonté ou celle d'un _animateur_), il n'a plus accès à aucune de celles-ci. Ceci allège ses sessions.
- pour écrire / modifier / supprimer une note du groupe, il faut avoir le droit d'accès en écriture aux notes.
- chaque note est signée par la succession des membres qui y sont intervenu.

**Tout membre ayant accès aux notes peut attacher ses propres mots clés à chaque note du groupe** afin de faciliter ses recherches. Le filtrage par mots clés s'effectue tous groupes confondus. Les autres membres ne savant pas quels sont ces mot clés.
- un _animateur_ peut attacher des mots clés spécifiques du groupe à une note, ceux-ci étant visibles de tous.

**Une note de groupe peut être rattachée à une autre note parent du groupe**, ce qui fait apparaître visuellement à l'écran une hiérarchie.
- un avatar peut attacher une note personnelle à une note de groupe pour la compléter / commenter: toutefois il sera seul à la voir (puisqu'elle est _personnelle_).

#### Membre _hébergeur_ d'un groupe
Celui-ci s'est dévoué pour supporter les coûts d'abonnement de stockage (nombres de notes et volume des fichiers) des notes du groupe.
- il fixe des maximum à ne pas dépasser afin de protéger son budget,
- il peut cesser d'héberger le groupe, un autre membre prenant la suite. Si personne ne se propose, 
  - le nombre de notes et le volume de leurs fichiers ne peut plus croître,
  - au bout de 3 mois le groupe s'autodétruit.

# Modes *synchronisé*, *incognito* et *avion*
Pour se connecter à son compte, le titulaire d'un compte choisit sous quel **mode** sa session va s'exécuter: _synchronisé_, _avion_ ou _incognito_.

#### Mode _synchronisé_ 
C'est le mode préférentiel où toutes les données du périmètre d'un compte sont stockées dans une micro base locale cryptée dans le navigateur: elle est remise à niveau depuis le serveur central à la connexion d'une nouvelle session.

Durant une session la micro base locale est maintenue à jour, y compris lorsque d'autres sessions s'exécutent en parallèle sur d'autres navigateurs et mettent à jour les données du compte : par exemple quand une note de groupe est mise à jour par un autre membre du groupe.

Une connexion ultérieure d'un compte dans le même navigateur après une session synchronisée est rapide: l'essentiel des données étant déjà dans le navigateur, seules les _mises à jour_ sont tirées du serveur central.

#### Mode _avion_
Pour que ce mode fonctionne il faut qu'une session antérieure en mode _synchronisé_ ait été exécutée dans ce navigateur pour le compte. A la connexion il y voit l'état dans lequel étaient ses données à la fin de sa dernière session synchronisée dans ce navigateur.

**L'application ne fonctionne qu'en lecture**, aucune mise à jour n'est possible. Aucun accès à Internet n'est effectué, ce qui est précieux _en avion_ ou dans les _zones blanches_ ou quand l'Internet est suspecté d'avoir de grandes oreilles indiscrètes : certes tout est crypté et illisible mais en mode avion personne ne peut même savoir que l'application a été ouverte, l'appareil peut être physiquement isolé du Net.

En mode avion les fichiers attachés aux notes ne sont pas accessibles, **sauf** ceux qui ont été déclarés devoir l'être. Cette déclaration pour un compte s'effectue fichier par fichier pour chaque navigateur et ils sont mis à jour à l'ouverture de chaque session en mode _synchronisé_ (puis en cours de session).

> On peut couper le réseau (le mode _avion_ sur un mobile), de façon à ce que l'ouverture de la page de l'application ne cherche même pas à vérifier si une version plus récente est disponible.

#### Mode _incognito_
**Aucun stockage local n'est utilisé, toutes les données viennent du serveur central**, l'initialisation de la session est plus longue qu'en mode synchronisé. Aucune trace n'est laissée sur l'appareil (utile au cyber-café ou sur le mobile d'un.e ami.e) : certes les traces en question auraient été inutilisables car cryptées, mais il n'est pas poli d'encombrer la mémoire d'un appareil qu'on vous a prêté.

> On peut ouvrir l'application dans une _fenêtre privée_ du navigateur, ainsi même le logiciel de la page de l'application sera effacé en fermant la fenêtre.

> **En utilisant des sessions synchronisées sur plusieurs appareils, on a autant de copies synchronisées de ses notes et chats sur chacun de ceux-ci**, et chacun peut être utilisé en mode avion. Les copies ne sont pas exactement les mêmes, les _photographies_ de l'état des données du compte ne pouvant pas être effectuées exactement à la même seconde.

> **Le logiciel de la page Web de l'application invoquée depuis le navigateur y est mémorisée**: au prochain appel de la page, étant déjà présente en local, elle ne chargera rien ou juste le minimum nécessaire pour se mettre à niveau de la version logicielle la plus récente.

# Coûts d'hébergement de l'application

> **L'administrateur technique** est le représentant technique du prestataire d'hébergement. Il n'a pas de compte mais _une clé d'accès_ à l'application pour initialiser un espace pour une organisation et effectuer quelques actions techniques: exportation d'espaces, suppressions d'espaces, notifications importantes.

Le coût d'usage de l'application pour une organisation correspond aux coûts d'hébergement des données et de traitement de celles-ci. Selon les techniques et les prestataires choisis, les coûts unitaires varient mais existent dans tous les cas.

#### _Base de données_ et _fichiers_ (Storage)
Leur stockage sur "disques" ont des coûts unitaires très différents (variant d'un facteur de 1 à 25).
- les _bases de données_ requièrent un stockage très proche du serveur et des accès très rapide,
- les fichiers sont enregistrés dans des _Storage_, des stockages techniques distants ayant une gestion spécifique et économique du fait d'être soumis à peu d'accès (mais de plus fort volume).

#### Abonnement
Un abonnement correspond aux coûts récurrents mensuels pour un compte, même quand il ne se connecte pas. Par simplification ils ont été résumés ainsi:
- **Nombre total de documents dans la base de données**: `nn + nc + ng`
  - **(nn) nombre de notes** personnelles et notes d'un groupe hébergé par le compte,
  - **(nc) nombre de chats personnels** non _raccrochés_, 
  - **(ng) nombre de participations actives aux groupes**.
- **Volume des fichiers attachés aux notes** stockés sur le _Storage_.

Pour obtenir le coût correspondant à ces deux volumes il est pris en compte, non pas _le volume effectivement utilisé à chaque instant_ mais forfaitairement **les _volumes maximaux_** auquel le compte est abonné.

> Les volumes _effectivement utilisés_ ne peuvent pas dépasser les volumes maximum de l'abonnement. Dans le cas où un changement de l'abonnement réduit a posteriori ces maximum en dessous des volumes utilisés, les volumes n'auront plus le droit de croître.

#### Consommation de calcul
La consommation correspond à l'usage effectif de l'application quand une session d'un compte est ouverte: elle est la somme de 4 facteurs, chacun ayant son propre tarif:
- **(nl) nombre de _lectures_** (en base de données): nombre de notes lues, de chats lus, de contacts lus, de membres de groupes lus, etc.
- **(ne) nombre _d'écritures_** (en base de données): mises à jour des données, notes, chats, cartes de visite, commentaires personnels, etc.
- **(vd) volume _descendant_** (download) de fichiers téléchargés en session depuis le _Storage_.
- **(vm) volume _montant_** (upload) de fichiers envoyés dans le _Storage_. Chaque création / mise à jour d'un fichier est décompté dans ce volume.

### Coût total
Le coût total est la somme des coûts induits par chacun des 6 compteurs valorisés par leur coût unitaire: `n1*u1 + v2*u2 + nl*cl + ne*ce + vd*cd + vm*cm`
- `n1` = _nombre maximal de notes, chats, participations aux groupes_
- `v2` = _volume maximal_ des fichiers attachés aux notes.
- `nl ne` : nombres de lectures et d'écritures (en millions),
- `vd vm` : volume descendant et montant.

>_L'ordre de grandeur_ d'un coût total par compte varie en gros de **0,5€ à 3€ par an**. Individuellement ça paraît faible mais n'est plus du tout négligeable pour une organisation assurant les frais d'hébergement d'un millier de comptes ...

## Les comptes autonomes _A_ et de l'organisation _O_
Une organisation peut avoir des comptes ayant des modes de fonctionnement différents:
- **autonomes _A_**: chaque compte fixe lui-même son abonnement et sa consommation n'est pas limitée. Il paye les deux.
- **de l'organisation _O_** l'organisation paye l'abonnement et la consommation pour le compte mais en contrepartie,
  - elle lui fixe des limites potentiellement bloquantes d'abonnement et de consommation,
  - elle peut bloquer le compte, par exemple s'il quitte l'organisation, est décédé, etc. 

## Le Comptable
_Le Comptable_ désigne une personne, voire un petit groupe de personnes physiques qui:
- a négocié avec le prestataire hébergeur les conditions et le prix de l'hébergement.
- a été créé par l'administrateur technique du prestataire à la création de l'espace de l'organisation.

C'est lui-même un compte _O_ (c'est l'organisation qui paye ses coûts) _presque_ normal en ce sens qu'il peut avoir des notes, des chats, participer à des groupes, créer des avatars secondaires, etc. Il a le privilège,
- **de gérer les forfaits gratuits attribués par l'organisation** aux comptes _O_,
- de déclarer si l'organisation accepte ou non des comptes _A autonomes_,
- de pouvoir sponsoriser des comptes _autonomes_ (bien qu'étant compte _O_ lui-même)

> Le **Comptable** n'a pas plus que les autres comptes les moyens cryptographiques de s'immiscer dans les notes des avatars des comptes et leurs chats: ce n'est en aucune façon un modérateur et il n'a aucun moyen d'accéder aux contenus, pas plus qu'à l'identité des avatars secondaires des comptes.

### Compte _autonome_ "A"
**Un compte _autonome_ fixe lui-même, son niveau d'abonnement**, c'est à dire ses _volumes maximum_ et peut les changer à son gré, mais pas en-dessous des seuils déjà occupés.

Un compte autonome a des compteurs de consommation qu'il ne peut que constater.

> **Nul ne peut bloquer / résilier un compte _autonome_**, mais le compte peut se retrouver bloqué lui-même s'il n'a pas crédité suffisamment son compte pour supporter ses coûts **d'abonnement et de consommation**.

Il dispose à cet effet d'un compteur de **crédits** qui lui donne le cumul de tous les crédits qu'il a récupérés et enregistrés depuis l'ouverture de son compte ou depuis qu'il est devenu compte _autonome_, diminués toutefois des crédits qu'il a offert à d'autres comptes _A_ amis ou à l'occasion d'un sponsoring.

Pour enregistrer un crédit, le compte:
- génère un _ticket_,
- effectue un paiement (ou fait effectuer un paiement par un tiers) portant en référence ce ticket. C'est le Comptable qui fixe comment recevoir ces paiements et sous quelle forme.
- le Comptable inscrit les paiements reçus avec leur montant et numéro de ticket.
- à la prochaine connexion (ou appui sur un bouton) le compte incorpore dans son solde les paiements reçus par le Comptable.
- ce mécanisme garantit l'anonymat du paiement qui ne peut pas être corrélé à son compte.

Comme le compte dispose à tout instant de la somme des coûts d'abonnement et de consommation depuis le début de la vie du compte (ou depuis qu'il est _devenu compte autonome_), il en résulte **un solde qui doit normalement être positif** et enclenche une restriction d'accès s'il est négatif.

> Avant de devenir _négatif_ le solde d'un compte a été _faiblement positif_. Le compte en est averti lors de sa connexion avec le nombre de jours _estimé_ avant de devenir négatif si son profil de consommation reste voisin de celui constaté sur les 4 mois antérieurs.

Un compte _A_ peut être _sponsorisé_:
- par le Comptable qui lui offre un petit crédit de bienvenue (supporté par l'organisation).
- par un autre compte _A_ qui lui offre un crédit pris sur le sien propre.
- le crédit initial laisse le temps au nouveau compte de faire parvenir un paiement au Comptable.

### Compte _d'organisation_ "O"

**Un compte _d'organisation_ bénéficie _gratuitement_**:
- _d'un _abonnement_ c'est à dire d'un _nombre maximal total_ de notes / chats / groupes et d'un _volume maximal total_ pour les fichiers attachés aux notes.
- _d'une limite de coûts mensuel de calcul_ destinée à couvrir les coûts de _lectures / écritures de notes, chats, etc._ et de _transfert_ de fichiers. **Le compte subit une restriction d'accès** si sa consommation sur le mois en cours et le précédent (au prorata du nombre de jours effectifs et ramenée à 30 jours) dépasse cette limite _mensuelle_.

**Un compte _O_ peut être bloqué par l'organisation**
- pour de multiples raisons: départ de l'organisation, décès, adhésion à une organisation concurrente ou ayant des buts opposés, etc. selon la charte de l'organisation.
- selon l'option de l'organisation, son accès est restreint,
  - _accès en lecture seule_, par exemple pendant un certain temps,
  - _accès minimal_, ni lecture ni mise à jour,
  - dans les deux cas les _chats d'urgence_ avec le Comptable et ses _délégués_ restent possibles.

### Gestion des abonnements et limites de calcul par _tranche_
Le Comptable dispose pour distribution aux comptes _O_,
- d'un _volume maximal total_ pour les notes, chats, groupes,
- d'un _volume maximal total_ pour les fichiers attachés aux notes,
- d'une _limite maximale totale des coûts annuels de calcul_. 

**Il découpe ces _volumes et limites_ en _tranches_** et est en charge de les ajuster au fil du temps.
- dans chaque _tranche_ le Comptable désigne des _comptes délégués_ à qui il confie la distribution des _volumes maximaux et limites de calcul_ aux comptes _O_ rattachés à la tranche.
- tout compte O _d'organisation_ est attachée à **une tranche**. Le Comptable peut le basculer d'une tranche à une autre.

### Basculement d'un compte A en O et inversement

Le Comptable ou un _délégué d'une tranche_ peut transformer un compte _O_ de cette tranche en compte _A_:
- **avec ou sans son accord** selon l'option choisie par le Comptable pour l'organisation.
- le compte acquiert une liberté totale (il ne peut plus être bloqué) mais en contrepartie paie son abonnement / consommation.

Le Comptable ou un _délégué d'une tranche_, peut transformer un compte _A_ **qui en fait la demande** en compte _O_ de la tranche:
- le compte n'a plus à payer son accès,
- en contrepartie il est contraint en volume et en activité et peut être bloqué.

**A sa création une organisation **n'accepte pas** de comptes _autonomes_. 
- Le Comptable peut lever cette interdiction et en autoriser la création,
- il peut aussi supprimer cette autorisation: cela n'a aucun effet sur les comptes _autonomes_ existants et ne vaut que pour les créations ultérieures.
- il précise si le basculement de compte O à compte A est soumis à l'accord du compte.

## Notifications et restrictions d'usage des comptes

Une _notification_ est un message important dont la présence est signalée par une icône dans la barre d'entête de l'écran et parfois par un affichage lors de la connexion d'un compte, voire d'une _pop up_ en cours de session quand elle est liée à une restriction d'accès du compte.

**Une _notification_ peut être porteuse d'une restriction d'accès**: les actions du compte ne sont plus totalement libres, voire sévèrement limitées.

### Notification de l'administrateur technique: accès _figés_ et _clos_
L'administrateur peut émettre une notification, le cas échéant déclarant un espace _figé_ ou _clos_:
- le texte informatif est soit simplement informatif, soit explicite les raisons de la restriction:.
- **espace figé** : l'espace est en lecture seule.
- **espace clos** : il n'y a plus de données. Le texte indique à quelle URL / code d'organisation les comptes vont trouver l'espace transféré (s'il y en a un).

L'administrateur technique a la capacité:
- de figer temporairement un espace, par exemple:
  - pendant la durée technique nécessaire à son transfert sur un autre hébergeur,
  - en le laissant en ligne et permettant aux comptes de consulter une image figée pendant que l'opération technique se poursuit.
- de clôturer un espace en laissant une explication, voire une solution, aux comptes (où l'espace a-t-il été transféré).

### Notification pour les comptes O: accès _lecture seule_ et _minimal_ 
Ces notifications peuvent être émises par le Comptable et ses _délégués_ de la tranche de quotas du compte. 
- _simple information_ sans restriction,
- **restriction d'accès en _lecture seulement_** avec l'explication de sa raison d'être,
- **restriction d'accès _minimal_**, ni lecture ni mise à jour avec l'explication de sa raison d'être,
- en cas de restriction les comptes ont toujours accès aux chats d'urgence avec le Comptable et ses _délégués_.

Ces notifications peuvent avoir deux portées:
- _tous_ les comptes O d'une tranche,
- _un_ compte O spécifique de cette tranche.

### Notification de la surveillance automatique de la consommation

**Pour un compte A**
- _Simple information_: quand, au rythme observé sur les derniers mois, le crédit serait consommé en moins de 30 jours.
- **Avec restriction d'accès _minimal_** : quand son solde est négatif, le total de ses crédits est inférieur aux coûts d'abonnement et de consommation.

Solutions:
- générer un _ticket de crédit_ et envoyer un paiement qui sera enregistré par le Comptable.
- bénéficier du don d'un autre compte.

**Pour un compte O**
La consommation moyenne sur le mois en cours et le précédent ramenée sur 30 jours est comparée au _forfait_ limite de consommation mensuelle fixée par le Comptable ou ses _délégués_:
- _Simple information_: la consommation dépasse 90% du _forfait_,
- **Avec restriction d'accès _minimal_** : la consommation dépasse le _forfait_.

Solutions:
- restreindre sa consommation,
- demander une augmentation de la limite de consommation mensuelle.

### Notification de la surveillance automatique des dépassements des volumes maximaux
Cette notification s'applique aux comptes O et A.
- Notification sans restriction d'accès quand les volumes maximaux sont _approchés_.
- Notification avec restriction aux opérations diminuant les volumes quand les maximum sont dépassés.

> Lire plus de détails dans le document **Couts-Hebergement**.

# Annexe I: les _espaces_
L'administrateur technique d'un site peut héberger techniquement sur le site jusqu'à 80 **espaces** numérotés de 10 à 89.

Tout ce qui précède se rapporte à UN espace et les utilisateurs ne peuvent avoir aucune perception des autres espaces hébergés par le même serveur technique.
- dans la base de données, les informations sont partitionnées par les deux premiers chiffres (majeurs) des identifiants.
- dans l'espace de stockage des fichiers, des sous-espaces sont séparés par nom de l'organisation.

L'administrateur technique a ainsi la possibilité d'ouvrir _instantanément_ un nouvel espace pour une organisation en faisant la demande. Cette ouverture crée le compte Comptable de l'espace, qui comme les autres n'a aucune perception de l'existence d'autres espaces. C'est à cette occasion que la phrase secrète du Comptable (de l'organisation) est fixée.

Le Comptable et l'administrateur technique se sont mis d'accord sur le volume utilisable et la participation aux frais d'hébergement.

Toutefois si cet accord n'était pas respecté, l'administrateur technique peut,
- émettre une notification d'information visible de tous les comptes,
- bloquer l'espace de l'organisation en _lecture seule_,
- détruire les données par clôture de l'espace ne laissant pendant un certain temps qu'une seule information d'explication.


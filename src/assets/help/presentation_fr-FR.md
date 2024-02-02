@@Index général de la documentation [index](https://raw.githack.com/dsportes/asocial-doc/master/index.md)
# Vue d'ensemble de l'application

Une organisation, association, un groupe de quelques amis ... peut décider de disposer de son propre **espace a-social**, par exemple `monasso`, ayant des caractéristiques opposées à celles des réseaux dits _sociaux_, et a choisi un prestataire d'hébergement qui lui a créé un espace accessible par une URL comme `https://srv1.monhebergeur.net/` 

Pour se connecter à son espace, il suffit d'ouvrir dans un navigateur la page Web à cette adresse et de fournir: 
- `monasso` : le code de son organisation enregistrée par l'hébergeur, 
- `mabellephrasetressecrete` une phrase secrète personnelle d'au moins 24 signes.

> Derrière cette URL, un serveur délivre l'application et gère les accès à une base centrale où les données de chaque organisation sont stockées. Jusqu'à 80 organisations étanches les unes des autres peuvent être gérées. Le prestataire peut enregistrer une nouvelle organisation en moins d'une minute.

> Une organisation n'est pas attachée à son prestataire initial, il peut faire exporter ses données vers un autre, ce qui ne prend que le temps de la copie des données, ou même s'il en a le minimum de compétences informatiques devenir son propre hébergeur, le logiciel de l'application étant disponible _open source_.

# Créer son compte

Avant de pouvoir accéder à l'application une personne doit créer son propre compte **sponsorisé par une autre y ayant déjà un compte**. 

Sponsor et sponsorisé ont convenu entre eux,
- du nom du sponsorisé, par exemple `Charles`,
- d'une preuve de sponsoring par une expression comme `le hibou n'est pas chouette`.

Le _sponosirisé_ initie la création de son compte après avoir cité le nom de l'organisation `monasso` et la phrase preuve de sponsoring.

Si le titulaire du nouveau compte accepte les conditions proposées par le sponsor, il finalise la création de son compte en déclarant sa **propre phrase secrète de connexion**.
- elle a au moins 24 signes et reste uniquement dans la tête du titulaire, n'est enregistrée sous aucune forme nulle-part et pourra être changée à condition de pouvoir fournir celle actuelle.
- une partie de la phrase, située vers principalement au début, ne doit pas _ressembler_ à celle d'une autre phrase déjà enregistrée afin d'éviter de tomber par hasard sur la phrase d'un autre compte.

> La phrase secrète crypte indirectement toutes les données du compte aussi bien dans la base centrale que dans les micro bases locales de chacun des navigateurs utilisés par le compte. Un piratage des appareils des titulaires des comptes ou de la base centrale centrale ne donnerait au _pirate_ que des informations indéchiffrables.

> _Revers de cette sécurité_ : si la personne titulaire d'un compte oublie sa **phrase secrète de connexion**, elle est ramenée à l'impuissance du pirate. Son compte s'autodétruira dans un délai d'un an et toutes ses données et notes disparaîtront.

@@ Information détaillée à propos de la gestion des comptes [comptes](./comptes.md)

@@ L'usage de la cryptographie dans a-social [crypto](../tech/crypto.md)

# Avatars principal et secondaires d'un compte

En créant son compte, le titulaire a créé son **avatar principal**. 

Un avatar,
- est identifié par un _numéro_ à 16 chiffres (dont 13 aléatoires) immuable.
- a un **nom** immuable, par exemple `Charles`.
- peut avoir une **carte de visite** cryptée constituée d'une photo et / ou d'un court texte, par exemple `Charles III, roi des esturgeons et d’Écosse`, tous deux facultatifs et modifiables uniquement par son titulaire.

Ultérieurement le titulaire du compte peut créer des **avatars secondaires**, chacun ayant un numéro, un nom et une carte de visite facultative. Il peut utiliser à son gré des circonstances l'un ou l'autre de ses avatars, ce qui lui confère plusieurs _personnalités_.

> **Le titulaire du compte est le seul à connaître la liste de ses avatars secondaires**. En regardant deux avatars, personne (même l'administrateur technique) n'est en mesure de savoir s'ils correspondent au même compte.

> Comme dans la vraie vie **plusieurs avatars peuvent porter le même "nom"**: à l'écran les 4 derniers chiffres du numéro identifiant complète les noms ( `Charles#9476` et `Charles#5432`). Leurs cartes de visite permettront aux autres de distinguer Charles "_Général de brigade_" de Charles "_Roi des esturgeons_".

# Notes personnelles

**Un note porte un texte** d'au plus 5000 caractères pouvant s'afficher avec un minimum de _décoration_, gras, italique, titres, listes ... Ce texte est modifiable.

**Des fichiers peuvent être attachés à une note**
- beaucoup de types de fichiers (`.jpg .mp3 .mp4 .pdf ...`) s'affichent directement dans le navigateur, les autres sont téléchargeables.
- il est possible d'ajouter et de supprimer des fichiers attachés à une note.
- quand plusieurs fichiers portant le même _nom_ dans la note, ils sont vus comme des révisions successives, qu'on peut garder, ou ne garder que la dernière, ou celle de son choix.

## Une note PEUT faire référence à UNE note _parent_
- les notes apparaissent à l'écran sous forme hiérarchique, une note parent ayant en dessous d'elle des notes _enfants_ (ou aucune).
- les notes n'ayant pas de note _parent_ apparaissent rattachées à celui des avatars du compte a qui elle appartient: cet avatar est une _racine_ de la hiérarchie des notes.

> Un avatar peut créer des notes **personnelles**, les mettre à jour, les supprimer et les indexer par des mots clés personnels. Elles sont cryptées, comme toutes les données des comptes, et seul le titulaire du compte a, par l'intermédiaire de sa phrase secrète, la clé de cryptage apte à les décrypter.

# Contacts

Un compte peut rester totalement isolé et n'avoir aucun contact avec les autres: à la création de son compte par _sponsoring_, le sponsor comme le sponsorisé peuvent déclarer vouloir ou non être _contacts mutuels_.

Il y a d'autres occasions d'établir pour un compte d'établir un _contact_:
- directement en rencontrant le titulaire d'un compte dans n'importe quel contexte réel ou virtuel, l'un fournissant à l'autre une _phrase de contact_ convenue entre euw et connue d'eux seuls.
- en étant membre d'un même _groupe_ (voir plus avant).

Un contact est _un avatar_ affiché avec son nom (et son numéro): **sa carte de visite** est visible. 

Un contact est réciproque, si Julie a Émilie dans ses contacts, Émilie a Julie dans ses contacts: chacun a échangé avec l'autre la clé de cryptage qui permet de lire sa carte de visite.

## Un compte peut attacher un commentaire personnel et ses propres mots clés à ses _contacts_ 
Ceci facilite le filtrage dans le répertoire des _contacts_ selon des critères de son choix: le compte les déclarent pour lui et lui seul les voit.

> Sauf disparition de l'avatar en contact, un contact ne peut pas être dissous. Les mots clés attribués par un compte lui permettent de le classer comme _indésirable_ ou _oubliette_ ou _amis_ et de s'en servir comme filtre pour le voir ou non dans son répertoire de contacts.

# "Chats" entre contacts

Deux avatars _en contact_ peuvent ouvrir un _chat_ où ils peuvent écrire des échanges successifs de textes courts:
- un échange sur un chat ne peut plus y être modifié mais peut être supprimé par son auteur,
- le volume total des échanges sur le chat est limité à 5000 signes, les plus anciens échanges étant perdus en cas de dépassement de cette limite.

Une fois créé un chat ne disparaît que quand les deux avatars qui le partage ont disparu.
- pour ne pas être importuné, l'un des 2 peut _raccrocher_ le chat, ce qui en efface le contenu pour lui. Le chat ne compte plus pour lui dans le nombre de chats ouverts. L'autre peut toujours continuer à y écrire des échanges sans être certain d'être lu ... Le chat n'est plus _raccroché_ dès qu'on y écrit soi-même un échange (et compte à nouveau dans son décompte de chats ouverts).
- chacun peut attacher au _contact du chat_ ses propres mots clés (par exemple _indésirable_ ou _important_ ...) que l'autre ne voit pas, et filtrer les chats en évitant ceux _raccrochés_ ou _indésirable_ par exemple.

## Établissement d'un contact / chat par une _phrase de contact_
Émilie peut déclarer une _phrase de contact_, unique dans l'application et pas trop semblable à une déjà déclarée. Par exemple : `les courgettes sont bleues au printemps`
- Émilie peut la changer ou la supprimer à tout instant.
- Émilie peut communiquer, par un moyen de son choix, cette phrase à Julie qui peut ainsi à la fois inscrire Émilie comme contact et ouvrir un chat avec elle. 
- Julie et Émilie devenues contacts l'une de l'autre pourront aussi inviter, ou faire inviter, l'autre aux groupes auxquels elles participent.

> Une _phrase de contact_ doit être effacée rapidement afin d'éviter que des personnes non souhaitées mises au courant de la phrase de contact, n'ouvrent un chat: l'impact serait toutefois limité (on n'est pas obligé de le lire).

# Groupes

Un avatar peut créer un **groupe** dont il sera le premier membre _actif_ et y aura un pouvoir _d'animateur_. Un groupe a,
- un numéro interne, un **nom** immuable et **une carte de visite** (comme un avatar).
- un **chat partagé par les membres du groupe**.
- un **espace de notes partagées** entre les membres du groupes qui peuvent les lire et les éditer.

Um avatar connu dans un groupe y a plusieurs états:
- **simple contact**: il a été inscrit comme contact du groupe mais lui-même ne le sait pas et ne connaît pas le groupe.
- **contact invité**: un membre actif ayant pouvoir d'animateur a invité le contact à devenir membre actif. L'avatar invité voit cette invitation et s'il l'accepte deviendra membre actif, sinon il retournera à l'état de simple contact. Nul ne devient membre actif à son insu.
- **membre actif**: il peut participer à la vie du groupe.

## Accès aux membres et / ou aux notes
Un membre actif _peut_ recevoir lors de son invitation deux _droits_:
- **droit d'accès aux autres membres** et au chat (ou non),
- **droit d'accès aux notes** en lecture, en lecture et écriture ou pas du tout.

Lors de son invitation il peut aussi recevoir le **pouvoir d'animation**. S'il ne l'a pas, un membre actif l'ayant peut lui conférer ce pouvoir (mais ne pourra plus lui enlever).

> **Certains groupes peuvent être créés à la seule fin d'être un répertoire de contacts** cooptés par affinité avec possibilités de chat. Personne n'y lit / écrit de notes.

> **Certains groupes peuvent être créés afin de partager des notes de discussion**: par exemple un animateur est seul à avoir droit d'accès aux membres, à les connaître: les notes sont de facto anonymes pour les autres membres.

En général les groupes sont créés avec le double objectif de réunir des avatars qui se connaissent mutuellement, échangent sur le chat et partagent des notes.

### Tout membre actif peut attacher un commentaire personnels et ses propres mots clés à un groupe
Ceci facilite sa recherche quand il est membre de beaucoup de groupes. Personne d'autre n'en a connaissance, son commentaire reste strictement privé.

## Quelques règles
Seul um membre actif **ayant pouvoir d'animation** peut,
- donner / retirer le droit d'accès aux autres membres et au chat à un membre actif donné,
- donner / retirer le droit d'accès aux notes à un membre actif donné (en lecture ou lecture / écriture), 
- donner un pouvoir d'animation à un membre actif qui ne l'a pas,
- inviter un _simple contact_ à devenir membre actif, avec ou sans droit accès aux autres membres et au chat, avec ou sans droit d'accès aux notes, avec ou sans pouvoir d'animateur,
- _oublier_ un simple contact qui n'apparaîtra plus dans le groupe.

**Tout membre actif** peut,
- s'il a droit d'accès aux membres, inscrire comme _simple contact_ un de ses contacts,
- décider de ne plus utiliser ses droits d'accès aux membres et / ou aux notes, puis décider de les utiliser à nouveau.
- décider de redevenir _simple contact_, voire d'être _oublié_ par le groupe (ne figurant même plus comme _simple contact_).

> Un _membre actif ayant pouvoir d'animation_ ne peut pas changer les droits et pouvoir d'un autre _animateur_ (sauf à lui-même).

> Un _animateur_ ne peut pas _résilier_ un membre actif indésirable mais peut lui retirer ses droits d'accès aux autres membres et aux notes, donc de facto lui interdire tout accès au groupe.

Tout membre actif d'un groupe ayant accès aux membres, les a comme _contact_ en connaît leurs cartes de visites: il _peut_ ouvrir un chat avec n'importe quel membre _actif_ (qui a formellement accepté  une invitation avec la conséquence d'être visible par les autres membres actifs).

> Le fait d'établir un _chat_ avec un membre du groupe en fait un contact _permanent_, même si le groupe est ultérieurement dissous ou que le membre cesse d'y être actif.

> Un groupe disparaît de lui-même dès lors qu'il n'a plus de membres actifs.

# Notes d'un groupe

- elles sont cryptées par une clé aléatoire spécifique au groupe qui a été transmise à chaque membre lors de l'invitation au groupe.
- hormis les membres actifs du groupe ayant droit d'accès aux notes, personne ne peut accéder aux notes du groupe.
- quand un nouveau membre accepte une invitation au groupe avec droits d'accès aux notes, il a immédiatement accès à toutes les notes existantes du groupe. S'il redevient _simple contact_ ou perd son droit d'accès aux notes (de par sa volonté ou celle d'un _animateur_), il n'a plus accès à aucune de celles-ci. Ceci allège ses sessions.
- pour écrire / modifier / supprimer une note du groupe, il faut avoir le droit d'accès en écriture aux notes.
- chaque note est signée par la succession des membres qui y sont intervenu.

## Tout membre ayant accès aux notes peut attacher ses propres mots clés à chaque note du groupe
Ceci facilite ses recherches.
- Le filtrage par mots clés s'effectue tous groupes confondus. 
- Les autres membres ne savant pas quels sont ces mots clés.
- Un _animateur_ peut attacher des mots clés spécifiques du groupe à une note, ceux-ci étant visibles de tous.

## Une note de groupe peut être rattachée à une autre note parent du groupe
Ceci fait apparaître visuellement à l'écran une hiérarchie.

Un avatar peut attacher une note personnelle à une note de groupe pour la compléter / commenter: toutefois il sera seul à la voir (puisqu'elle est _personnelle_).

## Membre _hébergeur_ d'un groupe
_L'hébergeur du groupe_ est un membre qui s'est dévoué pour supporter les coûts d'abonnement de stockage (nombres de notes et volume des fichiers) des notes du groupe.
- il fixe des maximum à ne pas dépasser afin de protéger son budget,
- il peut cesser d'héberger le groupe, un autre membre prenant la suite. Si personne ne se propose, 
  - le nombre de notes et le volume de leurs fichiers ne peut plus croître,
  - au bout de 3 mois le groupe s'autodétruit.

# Modes *synchronisé*, *incognito* et *avion*

Pour se connecter à son compte, le titulaire d'un compte choisit sous quel **mode** sa session va s'exécuter: _synchronisé_, _avion_ ou _incognito_.

## Mode _synchronisé_ 
C'est le mode préférentiel où toutes les données du périmètre d'un compte sont stockées dans une micro base locale cryptée dans le navigateur: elle est remise à niveau depuis le serveur central à la connexion d'une nouvelle session.

Durant une session la micro base locale du compte est maintenue à jour, y compris lorsque d'autres sessions s'exécutent en parallèle sur d'autres navigateurs et mettent à jour les données du compte : par exemple quand une note de groupe est mise à jour par un autre membre du groupe.

Une connexion ultérieure d'un compte dans le même navigateur après une session synchronisée est rapide: l'essentiel des données étant déjà dans le navigateur, seules les _mises à jour_ sont tirées du serveur central.

## Mode _avion_
Pour que ce mode fonctionne il faut qu'une session antérieure en mode _synchronisé_ ait été exécutée dans ce navigateur pour le compte. A la connexion il y voit l'état dans lequel étaient ses données à la fin de sa dernière session synchronisée dans ce navigateur.

**L'application ne fonctionne qu'en lecture**, aucune mise à jour n'est possible. Aucun accès à Internet n'est effectué, ce qui est précieux _en avion_ ou dans les _zones blanches_ ou quand l'Internet est suspecté d'avoir de grandes oreilles indiscrètes : certes tout est crypté et illisible mais en mode avion personne ne peut même savoir que l'application a été ouverte, l'appareil peut être physiquement isolé du Net.

En mode avion les fichiers attachés aux notes ne sont pas accessibles, **sauf** ceux qui ont été déclarés devoir l'être. Cette déclaration pour un compte s'effectue fichier par fichier pour chaque navigateur et ils sont mis à jour à l'ouverture de chaque session en mode _synchronisé_ (puis en cours de session).

> On peut couper le réseau (le mode _avion_ sur un mobile), de façon à ce que l'ouverture de la page de l'application ne cherche même pas à vérifier si une version plus récente est disponible.

## Mode _incognito_
**Aucun stockage local n'est utilisé, toutes les données viennent du serveur central**, l'initialisation de la session est plus longue qu'en mode synchronisé. Aucune trace n'est laissée sur l'appareil (utile au cyber-café ou sur le mobile d'un.e ami.e) : certes les traces en question auraient été inutilisables car cryptées, mais il n'est pas poli d'encombrer la mémoire d'un appareil qu'on vous a prêté.

> On peut ouvrir l'application dans une _fenêtre privée_ du navigateur, ainsi même le logiciel de la page de l'application sera effacé en fermant la fenêtre.

> **En utilisant des sessions synchronisées sur plusieurs appareils, on a autant de copies synchronisées de ses notes et chats sur chacun de ceux-ci**, et chacun peut être utilisé en mode avion. Les copies ne sont pas exactement les mêmes, les _photographies_ de l'état des données du compte ne pouvant pas être effectuées exactement à la même seconde.

> **Le logiciel de la page Web de l'application invoquée depuis le navigateur y est mémorisée**: au prochain appel de la page, étant déjà présente en local, elle ne chargera rien ou juste le minimum nécessaire pour se mettre à niveau de la version logicielle la plus récente.

# Coûts d'hébergement de l'application

> **L'administrateur technique** est le représentant technique du prestataire d'hébergement. Il n'a pas de compte mais _une clé d'accès_ à l'application pour initialiser un espace pour une organisation et effectuer quelques actions techniques: exportation d'espaces, suppressions d'espaces, notifications importantes.

Le coût d'usage de l'application pour une organisation correspond aux coûts d'hébergement des données et de traitement de celles-ci. Selon les techniques et les prestataires choisis, les coûts unitaires varient mais existent dans tous les cas.

## _Base de données_ et _fichiers_ (Storage)
Leur stockage sur "disques" ont des coûts unitaires très différents (variant d'un facteur de 1 à 25).
- les _bases de données_ requièrent un stockage très proche du serveur et des accès très rapide,
- les fichiers sont enregistrés dans des _Storage_, des stockages techniques distants ayant une gestion spécifique et économique du fait d'être soumis à peu d'accès (mais de plus fort volume).

## Abonnement : coût de l'espace occupé en permanence
Un abonnement correspond aux coûts récurrents mensuels pour un compte, même quand il ne se connecte pas.

L'abonnement est décomposé en deux lignes de coûts correspondant à l'occupation d'espace en base de données et en _storage_:
- **Prix unitaire de stockage d'un document** multiplié par le **nombre total de documents dans la base de données**: notes personnelles et notes d'un groupe hébergé par le compte, chats personnels non _raccrochés_, nombre de participations actives aux groupes.
- **Prix unitaire du stockage dans un _storage_** multiplié par le **volume total des fichiers attachés aux notes**.

Pour obtenir le coût correspondant à ces deux volumes il est pris en compte, non pas _le volume effectivement utilisé à chaque instant_ mais forfaitairement **les _volumes maximaux_ forfaitaires** auquel le compte est abonné.

> Les volumes _effectivement utilisés_ ne peuvent pas dépasser les volumes maximum de l'abonnement. Dans le cas où un changement de l'abonnement réduit a posteriori ces maximum en dessous des volumes utilisés, les volumes n'auront plus le droit de croître.

## Consommation : coût de calcul et de transfert des fichiers
La consommation correspond à l'usage effectif de l'application quand une session d'un compte est ouverte. Elle comporte 4 lignes:
- **nombre de _lectures_** (en base de données).
- **nombre _d'écritures_** (en base de données).
- **volume _descendant_** (download) de fichiers téléchargés en session depuis le _storage_.
- **volume _montant_** (upload) de fichiers envoyés dans le _storage_ pour chaque création / mise à jour d'un fichier.

## Coût total mensuel
Il correspond au total de l'abonnement (2 lignes) et de la consommation (4 lignes).

>_L'ordre de grandeur_ d'un coût total par compte varie en gros de **0,5€ à 3€ par an**. Individuellement ça paraît faible mais n'est plus du tout négligeable pour une organisation assurant les frais d'hébergement d'un millier de comptes ...

## Les comptes autonomes _A_ et de l'organisation _O_
Une organisation peut avoir des comptes ayant des modes de fonctionnement différents.

### Comptes autonomes "A"
Chaque compte fixe lui-même son abonnement et sa consommation n'est pas limitée. Il paye les deux.

Un procédé confidentiel permet à un compte "A" de faire parvenir des _paiements_ pour augmenter son solde sans que personne ne puisse déterminer à qui ces _paiements_ ont été attribués (sauf le compte lui-même).

Le compte peut faire des dons à d'autres comptes "A".

### Comptes de l'organisation "O"
L'organisation paye l'abonnement et la consommation pour le compte mais en contrepartie,
- elle lui fixe des limites potentiellement bloquantes d'abonnement et de consommation,
- elle peut bloquer le compte, par exemple s'il quitte l'organisation, est décédé, etc. 

Le Comptable attribue ces forfaits, aidés par des comptes _comptables délégués_.

## Le Comptable
_Le Comptable_ désigne une personne, voire un petit groupe de personnes physiques qui:
- a négocié avec le prestataire hébergeur les conditions et le prix de l'hébergement.
- a été créé par l'administrateur technique du prestataire à la création de l'espace de l'organisation.

C'est lui-même un compte "O" (c'est l'organisation qui paye ses coûts) _presque_ normal en ce sens qu'il peut avoir des notes, des chats, participer à des groupes, créer des avatars secondaires, etc. Il a le privilège,
- **de gérer les forfaits gratuits attribués par l'organisation** aux comptes "O", conjointement avec des comptes _comptable délégués par tranche_,
- de découpe du forfait global **en tranches** (chaque compte "O" dépendant de la tranche dans laquelle il a été créé),
- de déclarer si l'organisation accepte ou non des comptes _A autonomes_,
- de pouvoir sponsoriser des comptes _autonomes_ (bien qu'étant compte "O" lui-même)

> Le **Comptable** n'a pas plus que les autres comptes les moyens cryptographiques de s'immiscer dans les notes des avatars des comptes et leurs chats: ce n'est en aucune façon un modérateur et il n'a aucun moyen d'accéder aux contenus, pas plus qu'à l'identité des avatars secondaires des comptes.

### Basculement d'un compte "A" en "O" et inversement
Le Comptable ou un _délégué d'une tranche_ peut transformer un compte "O" de cette tranche en compte "A":
- **avec ou sans son accord** selon l'option choisie par le Comptable pour l'organisation.
- le compte acquiert une liberté totale (il ne peut plus être bloqué) mais en contrepartie paie son abonnement / consommation.

Le Comptable ou un _délégué d'une tranche_, peut transformer un compte "A" **qui en fait la demande** en compte "O" de la tranche:
- le compte n'a plus à payer son accès,
- en contrepartie il est contraint en volume et en activité et peut être bloqué.

### A sa création une organisation **n'accepte pas** de comptes _autonomes_
- Le Comptable peut lever cette interdiction et en autoriser la création,
- il peut aussi supprimer cette autorisation: cela n'a aucun effet sur les comptes _autonomes_ existants et ne vaut que pour les créations ultérieures.
- il précise si le basculement de compte O à compte A est soumis à l'accord du compte.

## Notifications et restrictions d'accès des comptes

Une _notification_ est un message important dont la présence est signalée par une icône dans la barre d'entête de l'écran et parfois par un affichage lors de la connexion d'un compte, voire d'une _pop up_ en cours de session quand elle est liée à une restriction d'accès du compte.

### Une _notification_ peut être porteuse d'une restriction d'accès
Quand une session a une ou des restrictions d'accès, ses actions sont plus ou moins limitées.

#### Volume en réduction
Cette restriction bloque toutes les actions menant à une augmentation de volume:
- création d'une note, d'un chat, acceptation d'une invitation à un groupe,
- remplacement d'un fichier par un fichier plus important.

Causé par:
- dépassement des limites d'abonnements (nombre de documents, volume des fichiers).

#### Lecture seule
En lecture seule une session ne peut que consulter les données (comme en mode _avion_) MAIS les échanges sont possibles sur les _chats d'urgence_ avec le Comptable et pour un compte "O" les _délégués de sa tranche_ qu'il connaît.

Pour un compte "O":
- décrété par le Comptable ou un de ses délégués: pour tous les comptes de la tranche ou pour certains comptes seulement.

#### Espace figé
Strictement aucune écriture ne peut être faite: l'administrateur technique a provoqué cette restriction typiquement pour procéder à une opération technique d'export, verrouiller une archive d'un espace, ou par mesure de rétorsion.

**Les connexions des comptes ne les maintiennent plus en vie**: au plus tard dans un an, si cette restriction n'est pas levée, les comptes disparaîtront.

Pour tous les comptes (y compris le Comptable)
- par l'administrateur technique.

#### Accès minimal
En accès minimal une session ne peut plus ni lire ni mettre à jour ses données, MAIS,
- les échanges sont possibles sur les _chats d'urgence_ avec le Comptable et pour un compte "O" les _délégués de sa tranche_ qu'il connaît.
- les opérations de crédit / gestion des volumes maximaux pour un compte "A" restent autorisées.

**Les connexions du compte ne le maintiennent plus en vie**: au plus tard dans un an, si cette restriction n'est pas levée, le compte disparaîtra.

Causé par:
- pour un compte "O", par le Comptable ou ou un de ses délégués: pour tous les comptes de la tranche ou pour certains comptes seulement.
- pour un compte "O" quand sa consommation mensuelle moyenne dépasse la limite fixée.
- pour un compte "A": crédit épuisé (solde négatif).

#### Espace clos
L'administrateur technique a effacé les données de l'espace: il ne subsiste plus que cette notification dont le texte donne la raison et le cas échéant indique si l'espace est accessible à une autre adresse.

Pour tous les comptes (y compris le Comptable)
- par l'administrateur technique.


@@ Maîtrise des coûts d'hébergement de l'application [coutshebergement](./coutshebergements.md).

# Gérer les _espaces_

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


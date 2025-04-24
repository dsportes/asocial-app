Cette aide suppose d'être à peu près familier avec les principes généraux de l'application:

<a href="$$/appli/presentation.html" target="_blank">Présentation générale minimale</a>

<a href="$$/index.html" target="_blank">Site documentaire de l'application</a>

La page de connexion propose deux possibilités:
- se connecter à son compte quand il existe.
- créer son compte après avoir obtenu le _sponsoring_ d'un compte existant.

# Se connecter à son compte | page_login_m
### Le site supporte une ou plusieurs organisations
Il faut indiquer le _code de l'organisation_ où le compte est enregistré.
- si l'URL de connexion est par exemple _https://s1.monhebergeur.net/?demo_ le code de l'application proposé par défaut figure après le `?` (ici `demo`)
- il est habituel d'enregistrer un raccourci de connexion avec son code d'organisation par défaut.
- si l'URL ne donne pas ce code ou que ce n'est pas celui de l'organisation du compte, il faut le saisir.

### Sélectionner son _mode de connexion_, synchronisé, incognito ou avion
Plus de détail dans la rubrique _Modes synchronisé / incognito / avion_.

### Saisir sa _phrase secrète_
Elle a au moins 24 signes, n'est connue que du titulaire du compte et ne peut jamais en cas d'oubl être récupérée par l'application qui ne la stocke nulle part.

Un avis est retourné si aucun compte n'a été trouvé pour cette phrase. Il n'est pas exclu toutefois q'un incident technique du réseau ou du serveur ait empêché la connexion.

Dans le cas normal, les données du compte sont chargées et la session est ouverte sur la page d'accueil.

### Mode synchronisé: case à cocher "Ré-initialiser complètement la base locale"
Quand cette case est cochée, la base locale du compte dans le browser est détruite avant d'être reconstruite par la connexion:
- la connexion est plus longue, surtout si le compte a beaucoup de notes, de contacts et participent à beaucoup de groupes.
- les fichiers qui étaient marqués _accessibles en mode avion_ ne le sont plus, ils ont été perdus avec l'effacement de la base locale du compte:
  - ils devront être à nouveau marqués comme tel si c'est toujours pertinent,
  - ils seront téléchargés depuis le _Storage central_ ce qui a un coût.

> Ne cocher cette case que dans deux situations; a) la base locale est trop volumineuse et le browser annonce des erreurs, b) un comportement anormal laisse à penser qu'elle est corrompue.

> La page des outils a un onglet qui affiche les bases locales existantes dans le browser et propose si souhaité de détruire celles inopportunes.

# Pour les paranoïaques | page_login_par
## Clavier virtuel pour saisir la phrase secrète
Si vous n'avez pas confiance dans le matériel que vous utilisez et que vous craignez que votre **clavier soit écouté** (ce qui techniquement est réalisable), il faut éviter de sa saisir sa phrase secrète au clavier _physique_ de votre appareil.

Cocher la case **Clavier virtuel** de la boîte de dialogue de saisie de votre phrase secrète. Le clavier physique / système est évité et votre phrase ne peut pas être écoutée et déroutée.

> De manière générale, si vous n'avez pas confiance dans le browser que vous utilisez et que vous soupçonnez qu'une _backdoor_ donne, sans votre consentement, accès à sa mémoire depuis un process externe (ce qui se passe quand vous demandez au browser d'ouvrir un port de _debug_), aucune confiance ne peut être accordée à aucune application.

## Définir un code PIN de déverrouillage
Si ce code est déclaré, l'écran de l'application se verrouillera automatiquement à la périodicité choisie (ou sur demande). Voir la rubrique d'aide citée ci-dessus.

# Créer son compte par _sponsoring_ | page_login_m sponsoring_a ht_sponsoriser
Vous avez rencontré une personne ayant un compte dans l'application et ayant la capacité de _sponsoriser_ de nouveaux comptes. Cette personne vous a communiqué:
- l'URL de connexion à l'application comme _https://s1.monhebergeur.net/?demo_ 
  - s'il a un code après un `?` (`demo` dans cet exemple), c'est le code de votre organisation.
  - sinon votre sponsor vous a donné le code de l'organisation a saisir.
- une _phrase de reconnaissance_ (par exemple `les framboises sont bleues cette saison`), spécifiquement pour votre sponsoring et qu'il n'a communiqué à personne d'autre.

### Sélectionner son _mode de connexion_, synchronisé ou incognito
Plus de détail dans rubrique _Modes synchronisé / incognito / avion_.

Une fois ces données saisies et la phrase de reconnaissance effectivement reconnue vous êtes dirigé vers le dialogue d'acceptation ou de refus du sponsoring où votre compte sera créé (si vous le voulez bien).

Détails à propos des sponsorings dans la rubrique _...sponsoriser des comptes_.

# "Nouvelle version disponible" : que faire ? | nouvelle_version
Appuyer sur ce bouton _rouge_ et suivre les instructions.

Plus de détail dans la rubrique _"Nouvelle version disponible"_.

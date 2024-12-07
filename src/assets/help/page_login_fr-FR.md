Cette aide suppose d'être à peu près familier avec les principes généraux de l'application:

<a href="$$/appli/presentation.html" target="_blank">Présentation générale minimale</a>

<a href="$$/index.html" target="_blank">Site documentaire de l'application</a>

La page de connexion propose deux possibilités:
- se connecter à son compte quand il existe.
- créer son compte après avoir obtenu le _sponsoring_ d'un compte existant.

# Se connecter à son compte | page_login_m
### Le site supporte une ou plusieurs organisations
Il faut indiquer le _code de l'organisation_ où votre compte est enregistré.
- si l'URL de connexion est par exemple _https://s1.monhebergeur.net/?demo_ le code de l'application proposé par défaut figure après le `?` (ici `demo`)
- il est habituel d'enregistrer un raccourci de connexion avec son code d'organisation par défaut.
- si l'URL ne donne pas ce code ou que ce n'est pas celui de votre organisation il faut le saisir.

### Sélectionner son _mode de connexion_, synchronisé, incognito ou avion
Plus de détail dans la rubrique _Modes synchronisé / incognito / avion_.

### Saisir sa _phrase secrète_
Elle a au moins 24 signes, n'est connue que de vous et ne peut jamais être récupérée en cas d'oubli (elle n'est stockée nulle part par l'application).

Un avis est retourné si aucun compte n'a été trouvé pour cette phrase. Il n'est pas exclu toutefois q'un incident technique du réseau ou du serveur ait empêché la connexion.

Dans le cas normal, les données du compte sont chargées et la session est ouverte sur la page d'accueil.

## Pour les paranos
Si vous n'avez pas confiance dans le matériel que vous utilisez et que vous craignez que votre **clavier soit écouté** (ce qui techniquement est réalisable depuis longtemps), il faut éviter de sa saisir sa phrase secrète au clavier _physique_ de votre appareil.

Cocher la case **Clavier virtuel** de la boîte de dialogue de saisie de votre phrase secrète. Le clavier physique / système est évité et votre phrase ne peut pas être écoutée et déroutée.

> De manière générale, si vous n'avez pas confiance dans le browser que vous utilisez et que vous soupçonnez qu'une _backdoor_ donne, sans votre consentement, accès à sa mémoire depuis un process externe (ce qui se passe quand vous demandez au browser d'ouvrir un port de _debug_), aucune confiance ne peut être accordée à aucune application.

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

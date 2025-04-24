
## Se connecter avec un code PIN
Une phrase secrète doit avoir au moins 24 signes afin de rendre sa découverte par _force brute_ (en essayant toutes les combinaisons possibles) quasiment impossible.

Mais saisir au jour le jour 24 signes ou plus depuis un appareil personnel, PC ou mobile, dont le login est déjà protégé par un mot de passe, peut se révéler fastidieux. Après tout les browsers ne rechignent pas à afficher vos mots de passe enregistrés pour autant que vous ayez réussi à vos connecter avec votre login de l'OS.

Il est possible d'utiliser un **code PIN** de quelques caractères comme alias d'une phrase secrète, avec quelques précautions:
- être certain que la connexion à votre appareil est effectivement bien protégée par un mot de passe correct,
- ne pas afficher ses codes PINs nulle part.

### Déclarer un code PIN
Supposons une phrase secrète `lessanglotslongsdelautomne` et que le code PIN `1515moi` ait été choisi comme _raccourci_ (au moins 4 signes).

Lors d'une connexion sur l'appareil choisi, saisir comme phrase secrète:

    &1515moi&lessanglotslongsdelautomne

`&` le code PIN `&` la phrase secrète

Désormais pour se connecter avec cette phrase il suffira de frapper `&1515moi&`.

Si la phrase secrète change, redéclarer le code PIN (en le changeant ou non).

### Remarques
Les correspondances entre un code PIN et leur phrase secrète sont stockées,
- dans le browser,
- cryptées par des dérivés des codes PINs,
- relativement au nom de domaine de l'application.

Il n'est pas possible de lire, même en debug, ni les valeurs des phrase secrète, ni les codes PINs mémorisés.

Les codes PINs sont spécifiques d'un appareil, ne les quittent pas, ne sont pas échangés sur le réseau: le cas échéant les réenregistrer sur d'autres appareils.

Ne pas enregistrer de code PINs sur des appareils qui ne sont pas strictement personnels ou ayant des logins _génériques / semi-publics_.

> Pour un pirate, il est évident que chercher à trouver par force brute un code PIN de 6 caractères est beaucoup plus facile que de retrouver une phrase secrète de 24 caractères (ce qui est quasi infaisable). Il aura toutefois fallu préalablement au pirate: a) dérober votre appareil, b) avoir cassé votre login (de connexion à l'OS), c) avoir écrit un logiciel spécifique de test des combinaisons.

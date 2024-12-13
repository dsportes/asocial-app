
**L'administrateur technique** a quelques actions de configuration à exécuter au moyen d'une page de l'application qui lui est strictement réservée. 

Pour accéder à cette page, il effectue une _quasi_ connexion:
- le code de l'organisation est `admin`.
- la phrase secrète n'est connue que de lui et c'est lui qui en a donné le jeton d'autorisation associé dans la configuration des serveurs.

Cette page d'administration a deux catégories de fonctions regroupées dans deux onglets:
- La Gestion des _Espaces_,
- La gestion des _Tâches_ périodiques et asynchrones.

**La page d'administration N'EST PAS SYNCHRONISÉE** : il faut utiliser le bouton avec la flèche circulaire en haut à gauche pour rafraîchir l'image à l'écran après une action ou simplement parce que le temps passant la situation a pu évoluer.

# Espaces | special
Cet onglet présente la liste des espaces déclarés: un bouton permet d'en déclarer un nouveau.

Un espace a:
- un identifiant qui un chiffre ou une lettre minuscule ou majuscule non accentuée: 0-9 a-Z A-Z.
- un code court d'organisation.

Ni l'un ni l'autre ne peuvent changer après création.

On peut raccourcir la liste par l'usage du filtre:
- aux organisations dont le code contient un texte donné,
- à l'organisation portant l'identifiant cité.

On peut trier cette liste,
- par identifiant des espaces,
- por alphabétique des codes des organisations,
- par importance de leurs coûts d'abonnement.

## Ajout d'un nouvel espace
L'appui sur le bouton +Org ouvre le dialogue de création.

#### Fixer l'identifiant de l'espace
0-9 a-z A-Z : cet identifiant ne doit pas déjà avoir été attribué.

#### Fixer le code de l'organisation
Un code de 4 à 8 chiffres ou lettres minuscules non accentuées. Ce code ne doit pas avoir déjà été attribué.

#### Fixer la phrase de sponsoring avec le Comptable
La phrase doit avoir au moins 24 signes. C'est celle que le Comptable doit citer pour créer le compte Comptable.

#### Confirmer la création de l'espace
En frappant le nombre proposé.

> Après création, il faut fixer les quotas de l'espace (voir ci-après).



# Tâches | special


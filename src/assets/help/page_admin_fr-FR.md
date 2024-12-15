
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

## Filtre et tri de la liste des espaces

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

> Après création, il faut fixer les quotas de l'espace (voir ci-après), par défaut ils sont nuls.

## Détail d'un espace
La liste des espaces donne un aperçu de chaque espace et la possibilité d'avoir plus de détail en dépliant l'aperçu.

### Aperçu
Première ligne:
- **Identifiant de l'espace** sur 1 caractère.
- **Code de l'organisation** à qui cet espace est attribué.
- **Si le Comptable n'a pas encore créer son compte,** il est indiqué que l'espace est encore _en création_ et n'a donc pas encore d'activité.
- **Dernier mois de calcul des statistiques.** Les statistiques sont _mensuelles_ et calculées par une tâche s'exécutant en début de mois, si aucun problème ne l'a temporairement empêché. Cette indication permet dans le doute de savoir quel est le dernier mois calculé.
- **Icône d'alerte.** Quand l'administrateur technique a levé une alerte, cette icône en donne la gravité.

Seconde ligne:
- **Si l'administrateur technique a fixé une date limite de connexion** celle-ci est indiquée ici.
- **Montant de l'abonnement mensuel**. C'est le coût global pour l'organisation de la réservation d'espace pour les documents (QN) et de celui de l'espace de stockage des fichiers (QV).

### Plus de détail sur l'espace
Déplier la ligne de l'espace fait apparaître 4 rubriques de détail.

# Quotas de l'espace fixé par l'administrateur technique
Fixer ces quotas. Les maximum correspondent aux maximum pour un espace déclaré en configuration de l'application.

# Alerte et limitation de connexion | dial_majalerte0
L'administrateur technique peut fixer une date limite de connexion au delà de laquelle, personne ne peut se connecter, même le Comptable. Ceci correspond à un cas de force majeure.

L'administrateur technique peut aussi déclarer une _alerte_ portant sur l'ensemble de l'espace. Voir la rubrique d'aide citée ci-dessus.

# Options fixées par le Comptable
C'est une information, l'administrateur technique ne peut que la consulter.

Comptes supprimés après 12 mois sans connexion : le Comptable a le choix entre 3, 6, 12, 18, 24 mois.

Comptes "autonomes" autorisés ou non selon le choix du Comptable.

# Statistiques CSV d'abonnement / consommation
Cette statistique mensuelle est calculée au tout début de chaque mois pour le(s) mois antérieur(s) pas encore calculé(s). Le contenu est accessible au Comptable et à l'administrateur technique.

Dans la documentation générale, lire <a href="$$/appli/stats.html" target="_blank">Statistiques partagées entre le Comptable et l'administrateur technique</a>

La statistique **Abonnement / consommation** porte sur UN mois.

Pour le mois courant elle est différente à chaque exportation, les comptes vivent.

Pour les mois antérieurs, la statistique d'un mois est toujours la même: elle a été calculée et stockée après la fin du mois et est donc stable.

# Tâches | special
(TODO)

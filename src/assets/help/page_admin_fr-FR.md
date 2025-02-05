
**L'administrateur technique** a quelques actions de configuration à exécuter au moyen d'une page de l'application qui lui est strictement réservée. 

Pour accéder à cette page, il effectue une _quasi_ connexion:
- le code de l'organisation est `admin`.
- la phrase secrète n'est connue que de lui et c'est lui qui en a donné le jeton d'autorisation associé dans la configuration des serveurs.

Cette page d'administration a deux catégories de fonctions regroupées dans deux onglets:
- La Gestion des _Espaces_,
- La gestion des _Tâches_ périodiques et asynchrones.

## La page d'administration N'EST PAS SYNCHRONISÉE
Il faut utiliser le bouton avec la flèche circulaire en haut à gauche pour rafraîchir l'image à l'écran après une action ou simplement parce que le temps passant la situation a pu évoluer.

# Espaces | special dial_majalerte0
Cet onglet présente la liste des espaces déclarés: un bouton permet d'en déclarer un nouveau.

Un espace a:
- un identifiant qui est un chiffre ou une lettre minuscule ou majuscule non accentuée: 0-9 a-Z A-Z.
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
L'appui sur le bouton **+Org** ouvre le dialogue de création.

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
- **Si le Comptable n'a pas encore crée son compte,** il est indiqué que l'espace est encore _en création_ et n'a donc pas encore d'activité.
- **Dernier mois de calcul des statistiques.** Les statistiques sont _mensuelles_ et calculées par une tâche s'exécutant en début de mois, si aucun problème ne l'a temporairement empêché. Cette indication permet dans le doute de savoir quel est le dernier mois calculé.
- **Icône d'alerte.** Quand l'administrateur technique a levé une alerte, cette icône en donne la gravité.

Seconde ligne:
- **Si l'administrateur technique a fixé une date limite de connexion** celle-ci est indiquée ici.
- **Montant de l'abonnement mensuel**. C'est le coût global pour l'organisation de la réservation d'espace pour les documents (QN) et de celui de l'espace de stockage des fichiers (QV).

### Plus de détail sur l'espace
Déplier la ligne de l'espace fait apparaître 4 rubriques de détail.

#### Quotas de l'espace fixé par l'administrateur technique
Fixer ces quotas. Les maximum correspondent aux maximum pour un espace déclaré en configuration de l'application.

#### Alerte et limitation de connexion
L'administrateur technique peut fixer une date limite de connexion au delà de laquelle, personne ne peut se connecter, même le Comptable. Ceci correspond à un cas de force majeure.

L'administrateur technique peut aussi déclarer une _alerte_ portant sur l'ensemble de l'espace. Voir la rubrique d'aide citée ci-dessus.

#### Options fixées par le Comptable
C'est une information, l'administrateur technique ne peut que la consulter.

Comptes supprimés après 12 mois sans connexion : le Comptable a le choix entre 3, 6, 12, 18, 24 mois.

Comptes "autonomes" autorisés ou non selon le choix du Comptable.

#### Statistiques CSV d'abonnement / consommation
Cette statistique mensuelle est calculée au début de chaque mois pour le(s) mois antérieur(s) pas encore calculé(s). Le contenu est accessible au Comptable et à l'administrateur technique.

Dans la documentation générale, lire <a href="$$/appli/stats.html" target="_blank">Statistiques partagées entre le Comptable et l'administrateur technique</a>

La statistique **Abonnement / consommation** porte sur UN mois.

Pour le mois courant elle est différente à chaque exportation, les comptes vivent.

Pour les mois antérieurs, la statistique d'un mois est toujours la même: elle a été calculée et stockée après la fin du mois et est donc stable.

# Tâches | special
Une tâche est un traitement qui s'exécute dans le serveur sans connexion avec une requête explicite.

Un _démon_ scrute la liste des tâches en attente et lance leur exécution à l'instant fixé.

# Tâches quotidiennes GC (garbage collector)
Il y a 6 tâches **permanentes** GC, chacune ayant une fonctionnalité spécifique s'appliquant à TOUS LES ESPACES confondus.

Pour accéder à la liste de ces tâches taper `*` **dans le filtre sur le code espace** et appuyer sur l'icône **CHECK**.

Pour chaque tâche, la liste indique:
- son code: `DLV DFH TRA FPU VER STA`
- sa date-heure de prochain lancement.
- la date-heure de sa dernière exécution.
- le nombre d'items traités lors de la dernière exécution OK (la signification dépend de son code).
- une trace d'erreur si cette exécution s'est terminée en erreur.

### Initialisation des tâches GC
A la création d'une base les tâches GC n'existent pas: l'administrateur technique doit appuyer UNE FOIS sur le bouton **INIT. TACHES GC** pour les inscrire. Toutefois celles déjà inscrites ne sont pas réinscrites.

Si une évolution du logiciel serveur fait apparaître de nouvelles tâches GC, il faudra rappuyer sur ce bouton sur tous les sites ayant subi cette évolution.

### Normalement ...
Les tâches du GC sont activées par une requête quotidienne d'un service de CRON externe.

Une tâche en erreur le jour J est par construction relancée le jour J+1, tout comme d'ailleurs si elle n'avait pas été en erreur.

### Problèmes
On peut lancer explicitement une des tâches par son bouton **Flèche circulaire** ce qui l'active sans attendre J+1.

On peut supprimer une tâche par son bouton **Poubelle**, seulement si celle-ci n'a plus d'existence dans une version future du logiciel serveur.

On peut _simuler_ l’événement CRON externe quotidien en appuyant sur le bouton **START DÉMON** en ayant fourni le mot de passe déclaré par l'administrateur technique dans la configuration. Ceci lance le démon mais les tâches ne démarrent que si leur date-heure de prochain lancement est passée.

## Liste des tâches GC
### DFH : détection des fins d'hébergement des groupes
Supprime tous les groupes dont la date de fin d'hébergement dépasse le jour J:
- groupes n'ayant pas trouvé de nouvel hébergeur 3 mois après que le dernier compte hébergeur ait renoncé à ce rôle.

N est le nombre de groupes détectés au-delà de leur date de fin d'hébergement.

### DLV : détection des comptes ayant dépassé leur date limite
Supprime tous les comptes ayant dépassé leur date limite de validité:
- habituellement cette date est repoussée d'un an à chaque connexion (moins en cas de restrictions / blocages).

N est le nombre de comptes détectés au-delà de leur date de validité.

### TRA : traitement des transferts de fichiers perdus
La création d'un fichier attaché à une note se passe en trois phases:
- requête marquant le début d'un _upload_,
- upload du fichier dans le _storage_,
- requête _validant_ la création du fichier.

Une création rencontrant un incident après le _commit_ de la transaction 1 et avant le _commit_ de la transaction 3, laisse un fichier _fantôme_ dans le _storage_.

La tâche TRA récupère tous les ID de ces fichiers et les détruit du _storage_.

N est le nombre d'uploads _fantômes_ détectés.

### VER : purge des "versions" supprimées depuis longtemps
Après résiliation d'un avatar ou d'un groupe, son article "versions" sert à indiquer que l'avatar / groupe n'existe plus et permet d'avoir des chargements incrémentaux des sessions. 

Au bout d'un certain temps, ces articles sont sans intérêt, le chargement incrémental d'une session depuis un état trop vieux est impossible. Cette tâche purge ces articles devenus sans intérêt.

La tâche purge aussi les _sponsorings_ ayant dépassé leur date de validité.

N est le total des articles traités (_sponsorings et versions_).

### STA : calcul et enregistrement des statistiques "mensuelle" des comptas et des tickets
Ces deux états CSV sont ensuite lisibles par les Comptables des espaces et l'administrateur technique.

N est le nombre de mois traités (en cas de rattrapage de mois antérieurs non traités).

### FPU : purge des fichiers supprimés
La suppression d'un fichier se passe en trois étapes:
- transaction enregistrant que le fichier est à supprimer et dans la note correspondante qu'il l'est effectivement.
- suppression du fichier du _storage_.
- transaction enregistrant que le fichier a été purgé du _storage_.

La suppression d'un avatar ou d'un groupe entraîne aussi la purge de _tous_ les fichiers attachés à toutes leurs notes.

La tâche FPU purge tous les fichiers dont la suppression a dépassé le premier stade sans avoir atteint le troisième.

N est le nombre de fichiers purgés.

# Tâches des espaces
Certaines requêtes peuvent être traitées en deux fois:
- la requête elle-même, par exemple _suppression d'un avatar_,
- puis par une ou des tâches secondaires s'exécutant après le retour de la requête pour traiter des opérations plus longues.
- la requête initiatrice étant terminée, le compte-rendu, principalement d'erreur, ne peut pas être retourné au demandeur (qui d'ailleurs ne saurait quoi en faire).

La page des tâches liste ces tâches, du moins celles demandées et pas encore terminées OU terminées en erreur.

## Identification des tâches d'espace
Une tâche est identifiée par:
- son code de traitement: `GRM AGN AVC`.
- le code (lettre ou chiffre) de son espace.
- son arguments ID, ou son couple d'arguments ID / IDS.

Pour accéder à la liste des tâches **D'UN ESPACE**, saisir son code **dans le filtre sur le code espace** et appuyer sur l'icône **CHECK**.

Pour accéder à la liste de toutes les tâches, saisir `*` **dans le filtre sur le code espace** et appuyer sur l'icône **CHECK**.

Pour chaque tâche, la liste indique:
- son code: `GRM AGN AVC`
- sa date-heure de lancement: premier lancement ou prochaine relance si le traitement a rencontré une erreur.
- le couple ID / IDS identifiant sa cible (ou ID seul).
- N : le nombre d'items traités lors de la dernière exécution en erreur (la signification dépend de son code).
- une trace d'erreur si cette exécution était en erreur.

En pratique en l'absence d'erreur de traitement, il est quasi impossible de voir une tâche d'espace:
- la tâche s'efface dès que terminée sans erreur,
- les temps de traitement unitaires des tâches sont très courts, la probabilité d'en voir une entre sa mise en attente et sa fin est faible.

L'icône **POUBELLE** efface la tâche correspondante: en général pour renoncer à son traitement.

L'icône **FLÈCHE CIRCULAIRE** relance l'exécution immédiate de la tâche.

Le GC quotidien relance aussi les tâches des espaces en erreur.

> En pratique on ne voit dans la liste que les tâches _en erreur_ dont la relance n'a pas permis de la résoudre.

## Liste des tâches des espaces
### GRM : purge des membres d'un groupe supprimé
- l'argument ID est l'ID du groupe dont les membres sont à purger, le groupe ayant cesser d'exister.

N : nombre de membres supprimés.

### AGN : purge des notes d'un groupe ou avatar supprimé
- l'argument ID est l'ID de l'avatar ou du groupe dont les notes sont à purger.
- l'argument IDS est _l'id alias_ du groupe et de l'avatar, sous lequel les fichiers attachés aux notes sont enregistrés dans le _storage_.

AGN effectue la purge des notes et la purge de leurs fichiers attachés.

N : nombre de notes traitées.

### AVC : purge des chats d'un avatar
- l'argument ID est l'id de l'avatar dont les chats sont à supprimer.

Pour chaque _chat_ purgé, le _chat_ miroir du contact est marqué comme s'adressant à un avatar _disparu_.

N : nombre de chats supprimés.

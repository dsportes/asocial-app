Dans la documentation générale, lire <a href="$$/appli/espaces.html" target="_blank">La gestion des espaces par l'administrateur technique</a>

**Cette page n'est accessible que par le Comptable.**

Elle lui propose les actions qui sont de sa seule responsabilité:
- fixer les options de gestion des comptes,
- répartir les quotas entre,
  - l'ensemble des comptes "A",
  - chacun des **partitions** auxquelles les comptes "O" sont attachés,
- exporter la statistique mensuelle anonyme des abonnements / consommations.

# Options de gestion des comptes
### Autoriser ou non les comptes "A"
A la création de l'espace les comptes "A" ne sont pas autorisés par défaut.

Quand l'option d'autorisation est donnée, il est possible de sponsoriser des comptes "A".

Quand l'option d'autorisation est retirée, il n'est plus possible de sponsoriser des comptes "A", mais ceux existants continuent de vivre normalement.

### Comptes supprimés après N mois sans connexion
Par défaut **N vaut 12**: 
- un compte sans restriction qui ne s'est pas connecté pendant 12 mois est automatiquement détruit à la fin du dernier jour du douzième mois.
- un compte ayant basculé en ACCÈS RESTREINT un jour J, est automatiquement détruit à la fin du dernier jour du sixième mois après J (la moitié de N).

Ce dispositif permet de récupérer de l'espace inutilisé en base de données et en stockage:
- pour les comptes "O" (et les comptes "A" non restreints) afin de le rendre disponible pour de nouveaux comptes,
- pour les comptes "A" en ACCÈS RESTREINT (ayant un solde débiteur), afin de récupérer des ressources qui ne sont plus payées.

Mais le Comptable peut souhaiter des options différentes:
- 18 ou 24 mois: il prolonge la vie de comptes inactifs. Ce peut être le cas d'organisations où les comptes n'ont que rarement besoin d'accéder à l'application.
- 6 ou 3 mois: à l'inverse, soit les comptes sont très souvent actifs, soit il s'agit d'un espace _de démonstration_ où les comptes sont rapidement abandonnés après des tests peu prolongés.

# Quotas de l'espace
Un tableau donne le sommaire des quotas d'occupation de l'espace et les coûts d'abonnement correspondants:
- **quotas fixés par l'Administrateur Technique pour l'ensemble de l'espace.**
  - le quota de calcul QC est _indicatif_, la consommation globale des comptes peut dépasser cette limite.
- **quotas fixés par le Comptable pour l'ensemble des comptes "A".**
  - le quota de calcul QC est _indicatif_, la consommation globale des comptes peut dépasser cette limite.
- **quotas distribuables pour les partitions**: différence des deux ci-dessus.
- **quotas attribués aux partitions**. Somme des quotas affectés aux partitions (le détail figure en dessous).

### Quotas fixés par le Comptable pour l'ensemble des comptes "A"
Un bouton d'édition permet d'ajuster ces valeurs.

Les maximum qui peuvent être affectés sont calculés depuis les maximum de l'espace diminués des quotas attribués aux partitions.

### Les quotas QN et QV sont contraignants
Le nombre maximal de documents (QN) et le volume maximal de fichiers (QV) sont des quotas **contraignants**, qui ne peuvent pas être dépassés.

MAIS quand un quota est revu à la baisse, il peut être fixé **en-dessous du volume déjà utilisé**. Dans ce cas les comptes ne pourront plus effectuer d'opérations qui augmenteraient le volume utilisé, seulement celles qui le réduise.

### Les dépassements des quotas de calcul (QC) provoquent des ralentissements
Les opérations et les transferts de fichiers sont ralenties, d'autant plus que le dépassement du quota est important.

# Statistiques CSV d'abonnement / consommation
Cette statistique mensuelle est calculée au tout début de chaque mois pour le(s) mois antérieur(s) pas encore calculé(s). Le contenu est accessible au Comptable et à l'administrateur technique.

Dans la documentation générale, lire <a href="$$/appli/stats.html" target="_blank">Statistiques partagées entre le Comptable et l'administrateur technique</a>

La statistique **Abonnement / consommation** porte sur UN mois.

_Pour le mois courant_ elle est différente à chaque exportation, les comptes vivent.

**Pour les mois antérieurs, la statistique d'un mois est toujours la même**: elle a été calculée et stockée après la fin du mois et est donc stable.

# Décomposition de l'espace en partitions | page_partition dial_majalerte1
Il existe toujours au moins une partition **Primitive**,
- à laquelle le Comptable est initialement attaché,
- qui ne peut pas être supprimée,
- que le Comptable ne peut pas quitter.

Un bouton permet au Comptable de créer une nouvelle partition:
- il lui donne un **code**, qu'il est le seul à connaître et qu'il pourra ensuite changer.
- il lui fixe ses quotas QN, QV, QC.

La liste des partitions donne une vue d'ensemble:
- un _filtre_ sur les codes permet de réduire la liste aux seules partitions dont le code contient le texte du filtre.
- la première ligne est une totalisation: les totaux sont calculés sur **toutes** les partitions, pas seulement celles filtrées / listées.
- la liste peut être triée. En cliquant sur l'intitulé d'une colonne, le tri s'effectue en ascendant, puis en descendant en appuyant à nouveau sur le même titre de colonne.

### Menu des actions possibles
- **Détails...** : ouvre la page détaillant la partition, avec la liste de leurs comptes.
- **Éditer le code** : ouvre le dialogue qui permet de changer le code.
- **Ajuster les quotas** : ouvre le dialogue de fixation des quotas de la partition.
- **Déclarer une alerte / Modifier l'alerte**: ouvre le dialogue de déclaration / suppression / modification de l'alerte sur la partition.
- **Supprimer la partition**, seulement si la partition n'a plus de comptes attachés.

### Détail des colonnes
La première colonne donne le **code** attribué par le Comptable et l'ID de la partition.

#### Indicateurs d'alertes
Le premier indicateur correspondant aux alertes sur la **partition** elle-même et le second à l'alerte la plus grave sur les **comptes** de la partition:
- _étoile verte_: pas d'alerte.
- _cercle bleu_: alerte informative sans restriction.
- _triangle orange_: alerte avec restriction en LECTURE SEULEMENT.
- _carré rouge_: alerte avec ACCÈS RESTREINT.

#### Nombre de comptes, dont nombre de délégués

#### 5 groupes de compteurs
On passe d'un groupe à l'autre en cliquant sur les flèches encadrant le nom du groupe affiché.

#### Alertes sur _partitions_
4 compteurs:
- 1 s'il y a une alerte.
- 1 s'il y a une alerte de niveau informatif sans restriction,
- 1 s'il y a une alerte avec restriction en LECTURE SEULEMENT,
- 1 s'il y a une alerte avec ACCÈS RESTREINT.

#### Alertes sur _comptes_
4 compteurs:
- nombre total d'alertes,
- nombre d'alerte de niveau informatif sans restriction,
- nombre d'alerte avec restriction en LECTURE SEULEMENT,
- nombre d'alerte avec ACCÈS RESTREINT.

#### Nombre de documents
4 compteurs indiquent le quota QN et son utilisation:
- nombre de documents maximum.
- pourcentage de ce quota attribué aux comptes.
- pourcentage de ce quota **effectivement** utilisé par les comptes.
- nombre de documents **effectivement** utilisés par les comptes.

#### Volume des fichiers
4 compteurs indiquent le quota QV et son utilisation:
- volume de fichiers maximum.
- pourcentage de ce quota attribué aux comptes.
- pourcentage de ce quota **effectivement** utilisé par les comptes.
- volume de fichiers **effectivement** utilisés par les comptes.

#### Consommation de calcul
4 compteurs indiquent le quota QC et son utilisation:
- coût calcul mensuel maximal en centimes.
- pourcentage de ce quota attribué aux comptes.
- pourcentage de ce quota **effectivement** utilisé par les comptes.
- somme des coûts moyens de calcul des comptes établis sur M et M-1 (ramenés à 30 jours).

# Export CSV des coûts par partition
Cet export est calculé localement sur demande en cours de session du Comptable et donne une image à l'instant de l'export des **coûts** d'abonnement des partitions (donc pour les seuls comptes "O").

### Objectifs
Les objectifs de cet export est de permettre au Comptable:
- de comparer les _coûts_ des partitions entre elles.
- de comparer les valeurs des quotas _attribués_, _effectivement distribués aux comptes_ et _réellement utilisés_. Pour certains prestataires d'hébergement technique, le coût facturé est le coût réellement utilisé mais pour d'autres c'est un coût forfaitaire maximal.
- si le Comptable souhaite répartir les coûts d'hébergement des comptes "0" aux responsables des partitions, cet export lui donne les compteurs de base d'abonnement et de consommation totalisés par partition. 

### Quotas / coûts
Les quotas et nombre de documents sont connus en nombre de documents: dans cet export **ils sont _valorisés_ en 10000 ième de c** en utilisant le tarif d'un mois choisi dans le dialogue.

Les quotas et volumes de fichiers sont connus en _octet (byte)_: dans cet export **ils sont _valorisés_ en 10000 ième de c** en utilisant le tarif d'un mois choisi dans le dialogue.

### Les coûts sont ceux:
- N : du nombre de documents (notes + chats + participations aux groupes).
- V : du volume des fichiers attachés aux notes.
- C : de consommation de calcul (valorisation des lectures / écritures de documents, downloads / uploads de fichier).
- T : total des coûts N + V + C

### "Attribué" versus "Distribué" versus "Utilisé"
Chaque compteur est _triple_. Par exemple pour N, le nombre de documents:
- A : attribué. Le coût est la valorisation du _quota_ (abonnement mensuel) que le Comptable a **attribué globalement à la partition**.
- D : distribué. Le coût est la valorisation de la somme des _quotas_ (abonnements mensuels) **distribués aux comptes de la partition**.
- U : utilisé. Le coût est la valorisation (au tarif de l'abonnement mensuel) de la somme des nombres exacts des documents à l'instant t.

> Concernant le coût de _calcul_: à tout instant il est estimé un coût de calcul moyen mensuel basé sur les coûts réels sur le mois courant et le précédent: c'est ce coût _mensualisé (sur 30 jours)_ qui est considéré comme "utilisé".

## Fichier CSV
Ce fichier se retrouve dans le répertoire des Téléchargements du browser.
- le _séparateur_ est la virgule.
- la première ligne donne les titres des colonnes.
- la seconde ligne est la totalisation de toutes les partitions.
- chaque partition a une ligne.

#### Colonnes
- `id` : id de la partition.
- `code` : code de la partition attribué par le Comptable.
- `nbc` : nombre de comptes de la partition.
- `nbd` : nombre de comptes _délégués du Comptable_ de la partition.

- `abna abnd abnu` : coûts _attribués / distribués / utilisés_ des nombres de documents.
- `abva abvd abvu` : coûts _attribués / distribués / utilisés_ des volumes de fichiers.
- `abca abcd abcu` : coûts _attribués / distribués / utilisés_ des calculs.
- `abta abtd abtu` : coûts _attribués / distribués / utilisés_ totaux (N + V + C).

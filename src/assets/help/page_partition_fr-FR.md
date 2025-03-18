Dans la documentation générale, lire <a href="$$/appli/partitions.html" target="_blank">Partitions des comptes "O"</a>

**Cette page n'est accessible que par le Comptable et ses délégués.**
- le Comptable depuis la **Page Espace** peut accéder à n'importe quelle partition.
- un délégué est attaché à **SA** partition, il ne peut accéder qu'à celle-ci depuis sa page d'accueil (ou le Menu général).

La page comporte deux parties:
- la **synthèse de la partition**,
- la **liste des comptes de la partition**.

# Synthèse de la partition | dial_majalerte1 dial_majalerte2
Les _quotas_ affectés à la partition par le Comptable figure en haut.

### Détail des colonnes
La première colonne donne,
- seulement pour le Comptable le **code** qu'il a attribué,
- l'ID de la partition.

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

## Affichage de l'alerte portant sur tous les comptes de la partition
S'il y en a une elle est affichée, peut être modifiée et supprimée,  sinon le bouton d'édition permet d'en créer une.

# Liste des comptes de la partition
## Filtre sur la liste
Il est possible de réduire la liste:
- en donnant le début du nom des comptes à lister,
- en se restreignant ou non aux comptes ayant une alerte de niveau compte.

Il est possible de trier la liste en fonction des valeurs de leurs quotas (QN: nombre de documents, QV: volume des fichiers) ou de leur pourcentage d'utilisation.

## Détail d'un compte C
> Le délégué D1 accédant à cette liste (dont le Comptable) ne connaît pas **tous** les comptes de la partition.

Si un compte C de cette partition a été sponsorisé par un autre délégué D2, le délégué D1 ne connaît pas C, n'a pas accès à sa _carte de visite_ (sauf s'ils se connaissent par ailleurs, membres d'un même groupe ou échange de chat).

### Carte de visite
Elle n'apparaît que si C était connu.

### Mémo personnel et _hashtags_
Le délégué D1 peut afficher le mémo et les hashtags personnels qu'il a attaché au compte C, qu'il connaisse ou non sa _carte de visite_. Il peut aussi les éditer à cette occasion.

### Abonnement et consommation
Ce bouton permet au délégué D1 ne visualiser les quotas, abonnements et consommation de C: en effet D1 pouvant modifier ces quotas et lever une alerte sur C, doit être courant de l'état du compte C, solde / consommation, évolution de consommation.

### Changer de partition (Comptable seulement)
Le Comptable peut ouvrir un dialogue au moyen de ce bouton lui permettant de choisir dans quelle autre partition le compte C pourrait être transféré.

### Conférer / retirer le statut de délégué de la partition
Le Comptable est seul habilité à gérer le statut de _délégué de sa partition_ à un compte.

### Alerte spécifique au compte
Dans la documentation générale, lire <a href="$$/appli/partitions.html" target="_blank">Alertes et restrictions d'accès associées</a>

Si une alerte spécifique au compte existe elle apparaît ici. Elle peut y être éditée et créée si elle n'existait pas.

### Quotas du compte
Cette ligne donne les quotas actuels attribués au compte C. Le bouton d'édition permet de les changer.

Dans la documentation générale, lire <a href="$$/appli/alertes.html" target="_blank">Alertes et restrictions d'accès associées</a>

## Dans la barre du haut, la cinquième icône est habituellement un _rond vert_ 
Ce qui indique qu'il n'y a pas d'alerte: en conséquence appuyer sur ce bouton apporte des informations non critiques.

Dans le cas contraire, **ce bouton ouvre une page dont le premier onglet affiche la liste des alertes** portant sur le compte: pour certaines il n'y a rien à faire, pour d'autres des actions sont possibles.

> Quand une alerte bloquante existe, cette page est automatiquement ouverte et il n'est pas possible d'en sortir.

# Comment ...faire face aux diverses alertes | compta_alertes

La rubrique citée ci-dessus liste les alertes possibles et leurs causes.

# Blocage de connection aux comptes | alerte_dlvat
**_Émise par l'Administrateur Technique_**

Pour des raisons techniques ou autres, les connexions seront bloquées à la date citée:
- les comptes ne sont pas supprimés pour autant.
- si l'Administrateur Technique lève cette interdiction plus tard, les comptes retrouvent leurs données sans altération.

**Aucune action directe possible**: s'enquérir éventuellement auprès de l'Administrateur Technique de la raison de ce blocage et de sa probable levée. Ce dernier est censé donner des explications dans le message correspondant mais ce peut être insuffisant.

# Date de _fin de vie_ du compte | alerte_dlv alerte_dlvc
Si le compte n'est PAS en ACCÈS RESTREINT, il n'y a rien à faire, le message est purement informatif. 

Sinon il faut s'inquiéter de la raison de cette restriction, documentée par ailleurs.

# Alerte: ACCÈS RESTREINT | alerte_ar alerte_part alerte_cpt
## Si le solde du compte est _débiteur_: il est en ACCÈS RESTREINT

**Actions possibles:** elles sont disponibles dans les autres onglets de la page des alertes:
- **Onglet "Crédits"**: enregistrer une annonce de crédit portant la référence qu'un _virement_ correspondant est censé résoudre.
- **Onglet "Chats d'urgence"**: un _chat_ avec le Comptable peut permettre d'obtenir de lui un _don_ pouvant résoudre la situation.

Toute navigation hors de cette page est bloquée, les seules données visibles du compte dans ces circonstances sont celles disponibles dans ces onglets.

## Autres raisons pour lesquelles le compte peut être en ACCÈS RESTREINT
- **Sur décision du Comptable ou d'un délégué visant tous les comptes ("O") de la partition**. Regarder l'alerte détaillée correspondante et ses motivations.
- **Sur décision du Comptable ou d'un délégué visant spécifiquement ce compte ("O")**. Regarder l'alerte détaillée correspondante et ses motivations.

# Le Comptable ou un délégué a bloqué le compte en LECTURE SEULEMENT | alerte_ls
La visualisation des données n'est pas limitée mais les seules actions possibles sont celles permettant de palier à cette situation.

**Actions possibles:** dans l'onglet "Chats d'urgence" de cette page. Un chat avec le Comptable ou avec un de ses délégués peut permettre de résoudre la situation par la discussion.

### Raisons pour lesquelles le compte peut être en LECTURE SEULEMENT
- **Sur décision du Comptable ou d'un délégué visant tous les comptes ("O") de la partition**. Regarder l'alerte détaillée correspondante et ses motivations.
- **Sur décision du Comptable ou d'un délégué visant spécifiquement ce compte ("O")**. Regarder l'alerte détaillée correspondante et ses motivations.

# Le nombre de documents excède le quota autorisé | alerte_nr
**Actions possibles:**
- supprimer des notes personnelles ou des notes de groupes dont on est hébergeur.
- supprimer des fichiers _image / photo_ attachés à ces notes.
- rendre certains de ses _chats_ passifs / indésirables.
- s'auto-résilier de groupes où on est actif.

Enfin, envisager d'augmenter le quota:
- pour un compte "A" c'est de sa seule décision (mais c'est facturé).
- pour un compte "O", demander à un des délégués de sa partition ou au Comptable. L'onglet des _chats d'urgence_ sur cette page permet de les joindre.

# Le volume des fichiers attachés aux notes dépasse le quota QV autorisé | alerte_vr
- il est impossible d'ajouter un nouveau fichier à une note,
- il est impossible de remplacer un fichier dans une note par un autre plus volumineux sans en même temps en supprimer d'autres.

**Actions possibles:** dès qu'une action visant à réduire le volume de fichiers été effectuée, ce volume _peut_ passer en dessous du quota et faire disparaître l'alerte:
- suppression d'une note,
- suppression d'un fichier,
- remplacement de fichiers par d'autres plus petits.

Enfin, envisager d'augmenter le quota:
- pour un compte "A" c'est de sa seule décision (mais c'est facturé).
- pour un compte "O", demander à un des délégués de sa partition ou au Comptable. L'onglet des _chats d'urgence_ sur cette page permet de les joindre.

# Excès de consommation de calcul par rapport au quota QC: ralentissements | alerte_ral

Les coûts de calcul relevés sur le mois en cours et le précédent sont ramenés à un mois de 30 jours. Il y a excès quand ce coût moyen de calcul excède le quota QC.

**Les opérations sont artificiellement ralenties** par un délai d’attente d’autant plus grand que l’excès est fort.

**Les transferts de fichiers le sont également** selon le même coefficient mais **proportionnellement** au volume du fichier.

**Actions possibles:** envisager d'augmenter le quota:
- pour un compte "A" c'est de sa seule décision (mais c'est facturé).
- pour un compte "O", demander à un des délégués de sa partition ou au Comptable. L'onglet des _chats d'urgence_ sur cette page permet de les joindre.

# Alerte de l'Administrateur Technique | alerte_esp
Cette alerte concerne tous les comptes: elle peut être seulement informative ou expliquer une restriction de fonctionnement.

Une alerte purement informative est toujours à considérer: elle annonce en général une restriction future. L'Administrateur Technique n'a normalement pas à avoir de relations de courtoisie avec les comptes -ce n'est pas un réseau social-: s'il le souhaite il utilisera un réseau social ou un site Web ad-hoc.

## Niveau de restriction _espace FIGE_
Les comptes sont restreints à la seule lecture des données: toute opération d'écriture sur la base de données ou le _storage de fichiers_ est techniquement bloqué.

L'Administrateur Technique utilise cette restriction par exemple dans ces deux situations:
- pour _exporter_ les données de l'organisation (dans un état stable et cohérent) afin de les _importer_ dans un autre espace, voire celui d'un autre prestataire.
- pour conserver un espace totalement fixe à des fins d'analyse par les comptes d'une situation _archivée_.

## Niveau de restriction _espace CLOS_
L'espace de l'organisation a été supprimé, plus aucun accès n'est possible.

L'Administrateur Technique utilise cette restriction pour indiquer,
- la raison de cette clôture,
- le cas échéant l'URL de l'application donnant accès aux comptes dans le cas d'un _transfert_.

**Action possible** : essayer d'obtenir de l'Administrateur Technique plus d'information que celles figurant dans son message: lui seul peut intervenir.

# Alerte à tous les comptes d'une partition | alerte_part
Cette alerte ne concernent que les comptes "O".

Elle est émise par le Comptable ou un de ses délégués: quand elle a été créée ou mise à jour par le Comptable, un délégué ne peut plus intervenir dessus.

Elle peut être purement informative ou porteuse de restriction de fonctionnement.

**Action possible**: contacter un délégué de sa partition ou le Comptable par l'onglet _Chats d'urgence_ de la page, eux seuls peuvent expliquer / lever l'alerte.

# Alerte adressée spécifiquement au compte | alerte_cpt
Cette alerte ne concernent que les comptes "O".

Elle est émise par le Comptable ou un de ses délégués: quand elle a été créée ou mise à jour par le Comptable, un délégué ne peut plus intervenir dessus.

Elle peut être purement informative ou porteuse de restriction de fonctionnement.

**Action possible**: contacter un délégué de sa partition ou le Comptable par l'onglet _Chats d'urgence_ de la page, eux seuls peuvent expliquer / lever l'alerte.

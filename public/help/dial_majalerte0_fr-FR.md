Dans la documentation générale, lire <a href="$$/appli/alertes.html" target="_blank">Alertes et restrictions d'accès associées</a>

## Déclaration d'une alerte générale par l'Administrateur Technique
Cette alerte concerne tous les comptes: elle peut être seulement informative ou expliquer une restriction de fonctionnement.
- quand aucune des cases à cocher ne l'est, il s'agit d'une alerte informative.
- si l'une des deux case est cochée, c'est une alerte _espace FIGE_ ou _espace CLOS_.

Une alerte purement informative est toujours à considérer: elle annonce en général une restriction future. L'Administrateur Technique n'a normalement pas à avoir de relations de courtoisie avec les comptes -ce n'est pas un réseau social-: s'il le souhaite il utilisera un réseau social ou un site Web ad-hoc.

**Un texte explicatif est obligatoire.**

Les actions possibles sont:
- RENONCER: la boite de dialogue est fermée.
- SUPPRIMER: détruire cette alerte.
- VALIDER: mettre à jour l'alerte si elle existait, la créer si elle n'existait pas.

### _Espace FIGE_
Les comptes sont restreints à la seule lecture des données: toute opération d'écriture sur la base de données ou l'e _storage de fichiers_ est techniquement bloqué.

L'Administrateur Technique utilise cette restriction par exemple dans ces deux situations:
- pour _exporter_ les données de l'organisation (dans un état stable et cohérent) afin de les _importer_ dans un autre espace, voire celui d'un autre prestataire.
- pour conserver un espace totalement fixe à des fins d'analyse par les comptes d'une situation _archivée_.

### _Espace CLOS_
L'espace de l'organisation a été supprimé, plus aucun accès n'est possible.

L'Administrateur Technique utilise cette restriction pour indiquer,
- la raison de cette clôture,
- le cas échéant l'URL de l'application donnant accès aux comptes dans le cas d'un _transfert_.

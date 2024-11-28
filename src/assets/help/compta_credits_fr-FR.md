Cet onglet permet de lister et gérer les paiements et de lister les dons.

# Gestion des paiements
Effectuer un paiement se passe en trois étapes:
- le compte enregistre un **ticket de paiement** qui devient _en attente_,
- il fait parvenir au Comptable un paiement effectif, accompagné du numéro de ticket, par le moyen défini par l'organisation.
- le Comptable enregistre un paiement en sélectionnant l'un de ceux  _en attente_.

Pour un compte (pas le Comptable) **SES** tickets de paiement _en attente_ ou _enregistrés_ sont consultables (ces derniers ne peuvent plus être annulés).

Pour le Comptable les tickets émis à M et M-1 sont visibles: aucun paiement ne peut être enregistré pour les tickets plus vieux.

L'historique des _vieux_ tickets traités est disponible par le comptable  dans un _état CSV_ correspondant au mois d'émission du ticket.

## Numéro de ticket
Il est généré de manière aléatoire sous lea forme de 6 lettres majuscules (A-Z).

La première lettre a toutefois une signification: par exemple le numéro de ticket `KZPSJE` commence par K, la onzième lettre de l'alphabet et correspond au mois de Novembre. Les lettres A à L sont associées à une année paire, celles M à X à une année impaire.

Un numéro de ticket porte l'information de son mois d'émission (du moins dans les deux ans).

# Liste des dons
Un don peut être effectué à deux occasions:
- quand un sponsor déclare un _sponsoring_: son _sponsorisé_ peut recevoir un don lui permettant de démarrer.
- au cours de la vie d'un compte en utilisant un _chat_: le _donateur_ peut émettre une ligne sur le chat avec le bénéficiaire en effectuant un don.

Dans ce dialogue la **liste des dons**, effectués et reçus, apparaît mais il n'est pas possible d'en effectuer. Pour faire un don il faut se rendre par exemple sur la listes chats ou des contacts et sélectionner le chat du contact voulu. 

# Déclaration des paiements - Compte _normal_
La liste des tickets enregistrés est disponible avec deux options de filtrage:
- tous les tickets,
- seulement les tickets en attente (dont le paiement n'a pas encore été enregistré par le Comptable).

La seule action possible est la **Suppression** d'un ticket qui n'a pas encore été réceptionné et émis au mois M ou M-1.

### Ajout d'un nouveau ticket
Un dialogue s'ouvre qui permet de créer un nouveau ticket de paiement en lui fixant:
- **le montant en c** (unité monétaire),
- **un court libellé facultatif**. Cette référence, que le Comptable voit, permet:
  - soit au compte d'avoir une référence qui lui parle mais dont la signification est inconnue pour le Comptable,
  - soit au compte et au Comptable de citer par exemple la référence d'une régularisation à effectuer.

Quand la création du ticket est _validé_:
- un numéro de ticket aléatoire est généré: c'est ce texte qu'il faut joindre au paiement effectif que le Comptable va recevoir.
- le ticket apparaît dans la liste des tickets en attente.

> Remarque: **un ticket créé ne peut pas être modifié**. Tant que le Comptable n'a pas encore enregistré le paiement correspondant, il peut être **supprimé** par le compte émetteur (s'il a été émis à M ou M-1).

# Enregistrements des paiements - Comptable
La liste des tickets enregistrés est disponible avec deux options de filtrage:
- tous les tickets,
- seulement les tickets en attente (dont le paiement n'a pas encore été enregistré par le Comptable).

Le Comptable dispose de deux actions pour un ticket _en attente_:
- le **valider tel quel**: il a bien reçu un paiement portant ce numéro de ticket et le montant est celui annoncé.
- **ajuster l'enregistrement**: un dialogue lui permet:
  - de déclarer un autre montant que celui annoncé quand le paiement reçu n'a pas le montant annoncé.
- d'inscrire **un court libellé facultatif**. Cette référence peut,
  - soit n'avoir de sens que pour lui-même et par exemple identifier la source du paiement.
  - soit porter une référence partagée avec le compte émetteur par exemple dans le cas d'une régularisation.

> Remarque: le Comptable ne **SAIT PAS** quel est l'avatar / compte à qui se rapporte le ticket, il ne peut donc pas le contacter. En revanche le compte connaît le Comptable et peut prendre l'initiative de discuter par _chat_ avec lui.

### Export de la liste CSV des tickets par mois
Le Comptable peut exporter la liste des tickets d'un mois.
- les tickets des mois M-2 et avant sont figés: enregistrés ou non, ils ne peuvent plus changer. La liste a été enregistrée dans un fichier par le traitement journalier au moment du changement de mois.
- la liste des tickets pour les mois M et M-1 est aussi disponible mais est recalculée à chaque demande.

Ce fichier contient une ligne par _ticket de paiement_ émis / reçu dans le mois. Le ticket est anonyme, il n'est pas possible d'effectuer un rapprochement avec le compte qui l'a émis.

Elle permet au Comptable de totaliser ce qu'il a reçu en paiement, du moins ce qu'il a enregistré avoir reçu.

Colonnes:

    IDS,TKT,DG,DR,MA,MC,REFA,REFC

- `IDS` : identifiant du ticket commençant par `aamm` (l'année et le mois)
- `TKT` : numéro du ticket.
- `DG` : date de génération sous la forme `aaaammjj`
- `DR`: date de réception / enregistrement sous la forme `aaaammjj`. Si 0 le ticket est _en attente_.
- `MA`: montant en `c` déclaré émis par le compte A.
- `MC` : montant en `c` déclaré reçu par le Comptable.
- `REFA` : référence facultative écrite par le compte A à l'émission.
- `REFC` : référence facultative écrite par le Comptable à la réception.

Dans la documentation générale, lire <a href="$$/appli/stats.html" target="_blank">Statistiques partagées entre le Comptable et l'administrateur technique</a>

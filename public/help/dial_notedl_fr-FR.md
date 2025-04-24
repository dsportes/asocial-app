Lire dans la documentation générale, lire <a href="$$/appli/notes.html" target="_blank">Notes personnelles</a>

Lire dans la documentation générale, lire <a href="$$/appli/groupes.html" target="_blank">Les groupes et leurs notes</a>

## Téléchargement _sur le poste_ des notes et de leurs fichiers

La page des notes permet de filtrer les notes visibles dans l'arbre des notes par divers critères de filtre.

Une fois la sélection appropriée trouvée (et le cas échéant _aucune sélection_, donc toutes les notes), le bouton **TÉLÉCHARGEMENT DES NOTES AFFICHÉES** ouvre un dialogue gérant leur téléchargement sur le poste:
- optionnellement les **fichiers attachés aux notes** sont aussi téléchargées.
- où les notes seront chargées est spécifié dans le dialogue.
- la progression du téléchargement s'affiche: toutefois il peut être rapide quand les fichiers sont de taille modeste.
- le téléchargement peut être,
  - mis en pause et repris,
  - interrompu définitivement.

> Attention: les notes et fichiers sont téléchargés **NON CRYPTES** dans un répertoire local du poste, ils sont directement lisibles / affichables.

# L'utilitaire `upload`

Par sécurité un browser ne permet pas d'écrire directement sur le file-system local d'un poste: il n'autorise qu'un téléchargement fichier par fichier dans son répertoire de Téléchargement. Cette démarche est impraticable pour télécharger des centaines (ou milliers) de notes et de fichiers.

Pour contourner ce problème un petit utilitaire `upload` va se charger d'écrire les notes et fichiers dans un répertoire dont la structure reproduit celle de l'arbre d'affichage des notes dans la page des notes.

`upload` est une application _locale_: 
- elle peut en conséquence écrire sur le file-system du poste.
- elle communique en HTTP avec la page des notes qui s'affiche dans le browser.

## Trois choix sont possibles dans la page de téléchargement de `upload`
Pour chaque lien, utiliser le clic droit avec l'option **Enregistrer la cible du lien sous ...** et indiquer le répertoire de son installation.

### Plateforme Linux x86
Choisir `upload` qui est un exécutable qui se lance simplement dans un terminal:

    upload

### Plateforme Windows x86
Choisir `upload.exe` qui est un exécutable qui se lance simplement dans un terminal:

    upload.exe

### Toutes autres plateformes
Si `nodejs` n'est pas installé, procéder à son installation. Suivre les instructions : <a href="https://nodejs.org/fr" target="_blank">https://nodejs.org/fr</a>

Choisir `upload.js` qui est un script nodejs qui se lance simplement dans un terminal:

    node upload.js

### Site de téléchargement de `upload`
Télécharger depuis cette page, la version de l'utilitaire correspondant à votre cas: <a href="https://asocialapps.github.io/upload/" target="_blank">Utilitaire upload - https://asocialapps.github.io/upload</a>

### Remarques de sécurité
#### Localisation du répertoire _cible_
Supposons `upload` téléchargé dans un directory par exemple `/var/tmp/mon_upload` ou `c:\temp\mon_upload`

_L'arbre_ des notes téléchargées sera **SOUS cette racine**, `upload` n'autorise aucune écriture à d'autres emplacements.

Dans le dialogue de téléchargement il est demandé le nom d'un répertoire pour le téléchargement: si on a saisi `mon_rep_v12` par exemple, l'arbre des notes sera à l'emplacement `/var/tmp/mon_upload/mon_rep_v12`.

> Ne pas tenter d'entrer comme nom de répertoire quelque chose comme `../../toto` : `upload` détecterait que cet emplacement n'est pas dans SON répertoire d'installation et retournerait une erreur.

#### Port par défaut: `33666`
C'est le numéro de port sur lequel `upload` _écoute_ les requêtes émises par l'application dans le browser.

Si ce numéro de port est affecté à un autre usage:
- (a) dans le dialogue, spécifier un autre numéro, par exemple `37444`.
- (b) dans le terminal de lancement de l'application spécifier ce numéro en argument:

    upload 37444

#### Penser à arrêter `upload` après usage
Dans le terminal de lancement, appuyer sur CTRL-C.

Il n'est pas sain en effet de laisser ouvert longtemps un programme à l'écoute de requêtes HTTP, qui sollicité de manière malveillante _pourrait_ engorger le file-system du poste.

# Le dialogue de téléchargement
### Synthèse
En partie supérieure un tableau de synthèse indique **pour chaque avatar / groupe**,
- s'il est téléchargé ou non: ceux pour lesquels il n'y a aucune note à télécharger sont marqués comme _fait_ dès le début.
- le nombre de notes à télécharger et le pourcentage fait.
- le volume de fichiers à télécharger et le pourcentage fait.

### Prochaine note à télécharger ou note courante en téléchargement
- son _path_: le nom sous lequel elle sera retrouvée téléchargée,
- le volume des fichiers: téléchargé / total à télécharger / pourcentage

### Options _numéro de port_ et _nom du répertoire local_ où l'arbre des notes doit être chargé
Le nom du répertoire est à spécifier, sauf si bien entendu la valeur proposée par défaut convient.

### GO! 
Lancement du téléchargement des notes **AVEC ou SANS** leurs fichiers attachés.

### Quand le téléchargement est en cours
Les indicateurs d'avancement dans la page progressent.

Un bouton **PAUSE** suspend le téléchargement: **toutefois** le téléchargement de la note en cours est poursuivi (ce qui peut être long si elle a de gros fichiers attachés), c'est le téléchargement de la note suivante qui est suspendu.

Un bouton **REPRISE** reprend le téléchargement à la note où il en était resté.

un bouton **FIN DU TÉLÉCHARGEMENT** interrompt celui-ci, le cas échéant même quand tous les fichiers de la note en cours n'ont pas tous été chargés.

### Quand le téléchargement est terminé
Une brève synthèse indique le nombre de notes et le volume des fichiers téléchargés.

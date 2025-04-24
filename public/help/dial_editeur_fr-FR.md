## L'éditeur des textes
Les textes apparaissent dans l'application dans plusieurs cas:
- en tant que texte d'une note,
- en tant que ligne d'échange dans un _chat_
- comme _nom / information_ d'une carte de visite d'un contact ou d'un groupe,
- comme _mémo_ personnel attaché à contact ou un groupe.

Les textes sont **courts**, moins de 5000 signes pour une note.

### Les deux façons de voir un texte
#### En mode _édition / brute_
Le texte est lisible tel quel et quand on saisit un texte c'est sous ce mode.

#### En mode _affichée / présentée_
Quand ce mode est activé on voit apparaître des éléments de présentation:
- textes en **gras** / `italique`,
- titres de différents niveaux,
- _listes_ avec des tirets,
- etc.

L'apparence de certaines parties de texte change en fonction de caractères qui le précèdent ou l'entourent selon une convention dite _MD_ (MarkDown) sommairement décrite ci-après.

# Barre de commandes de l'éditeur
Cette barre comporte quelques icônes qui influent sur l'affichage et le comportement de l'éditeur. De gauche à droite:

#### Taille _réduite_ / _plein écran_
Quand le texte est long et riche il est plus confortable de se mettre en plein écran.

#### Mode _édition_ / _affichage_
- Icône **crayon** : pour passer l'éditeur en mode _édition_ où la saisie est possible et le texte apparaît _brut_.
- Icône **œil** : pour que l'éditeur affiche un texte _présenté_ (mais où l'édition n'est pas possible).

#### Icône **emo-icône**
Elle ouvre un panneau de choix d'émo-icônes à insérer dans le texte.

#### Icône **défaire**
Quand le texte a été changé, l'appui sur cette icône annule les changements et revient au texte initial.

# La convention de présentation MD (Markdown)
Cette convention utilise quelques principes simples.

**Paragraphes**
- quand une ligne suit une autre ligne sans _ligne blanche_ entre les deux, le texte est continu (le retour à la ligne est ignoré).
- pour _changer de paragraphe_ faire un retour à ligne supplémentaire.

**Italique et gras**
- un texte encadré par un blanc souligné apparaît en italique.
- un texte encadré par 2 étoiles apparaît en gras.

```
  texte _en italique_ puis normal.
  texte **en gras** puis normal.
  texte **en gras _italique_** puis normal.
```

**Listes**
- une liste est commencée par une ligne ayant un tiret et un espace en tête.
- quand la liste finie, faire un retour à la ligne supplémentaire.

```
  Ceci commence une liste:
  - terme 1 de la liste
  - terme 2 de la liste.

  Le paragraphe suivant (après une ligne blanche) a terminé la liste ci-dessus.
```

**Blocs de texte**

Un texte encadré entre deux lignes contenant ``` (3 accents graves ou _back tick_) forme un bloc de texte ou la présentation est ignorée.

```
    ```
    Début du bloc de texte 1
    suite du bloc 1
    ```

```

Une convention alternative est de commencer son texte par **4 espaces** (un _espace_ est figuré ci-dessous par ^).

    ^^^^Début du bloc de texte 2
    ^^^^suite du bloc 2

**Citation**
- une citation commence `> ` (plus grand que, espace)

```
> Ceci est une citation

```

Elle apparaît ainsi:

> Ceci est une citation

**Titres de différents niveaux**
Un _titre_ est marqué par un paragraphe commençant par un ou plusieurs dièses, suivi d'un espace suivi du texte du titre.
- un dièse indique un titre de niveau 1,
- 3 dièses indiquent un titre de niveau 3

```
  # Titre de niveau 1
  ### Titre de niveau 3
```

## Deux gros points d'attention
**Les textes dans l'application ne peuvent pas contenir d'images** bien que la convention MD le permette. C'est en théorie possible mais en pratique assez complexe puisqu'il faut convertir son image en base 64 et l'intégrer le texte abscons correspondant dans un tag `<img>` (bref on oublie). Joindre un fichier image ou un fichier de texte de type Word si des images sont nécessaires.

**Si un lien vers une URL externe est inclus**, bien y fixer l'attribut target="_blank_" sinon le clic sur lien fera sortir de l'application.

## Visiter l'un des nombreux tutos expliquant la convention MD
Par exemple: 
- <a href="https://fr.wikipedia.org/wiki/Markdown" target="_blank">Wikipedia-Markdown</a>
- <a href="https://code-garage.fr/blog/le-guide-simplifie-sur-la-syntaxe-markdown" target="_blank">Markdown - exemples simplifiés</a>

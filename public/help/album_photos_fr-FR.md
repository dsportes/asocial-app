
## Album de photos d'une note
Une note peut avoir des fichiers _image_ attachés: pour chaque image une _miniature_ de taille réduite (96 pixels) est enregistrée.

Cette miniature apparaît quand on liste les fichiers attachés à une note.

Quand on clique sur cette miniature, l'image s'affiche sur toute la fenêtre:
- si elle est plus petite que cette fenêtre elle apparaît avec sa taille réelle.
- si elle est plus grande elle s'affiche _réduite_ mais à la taille maximale permise par sa hauteur ou largeur.
- les images PNG s'ont pas de _fond_:
  - sur la miniature un fond en damier blanc / gris apparaît.
  - sur l'image réelle une case à cocher en haut à gauche permet de voir l'image avec un fond noir ou blanc (sans affecter l'image).

# Album de photos dans la page des notes | page_notes
La page des notes offre une vision arborescente, filtrée, des notes.

Quand un article de cette arborescence est sélectionné, dans la partie supérieure de détail un bouton **Album** ouvre un panel affichant toutes les images des notes du sous-arbre sélectionné.

En l'absence de sélection d'un sous-arbre, l'album considère **toutes** les notes (du moins celles répondant au filtre).

> A l'ouverture de la page, en général aucun article n'est sélectionné. Après une première sélection, il y a toujours un article sélectionné. Pour ne plus avoir de sélection, a) cliquer sur une _racine_ (ça la sélectionne), b) cliquer à nouveau dessus (ça la désélectionne).

Dans le panel **Album**:
- un clic sur une miniature la rend _courante_ et dans la barre de titre s'affichent le titre de sa note et le nom du fichier de l'image dans cette note.
- le bouton **Note** ouvre la note correspondante.
- le bouton **Zoom** affiche l'image dans sa taille réelle ou réduite au minimum compatible avec la taille de la fenêtre.

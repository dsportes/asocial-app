Pour se connecter à son compte, le titulaire d'un compte choisit sous quel **mode** sa session va s'exécuter: _synchronisé_, _avion_ ou _incognito_.

Pour créer son compte _sponsorisé_ il faut choisir entre les modes _synchronisé_ ou _incognito_.

<a href="$$/appli/modessync.html" target="_blank">En savoir plus sur le site de la documentation</a>

# Mode "normal" _synchronisé_ 
Dans ce mode toutes les données intéressant le compte sont stockées dans une micro base locale cryptée dans le navigateur remise à niveau depuis le serveur central à la connexion d'une nouvelle session:
- durant une session elle est maintenue à jour, y compris lorsque d'autres sessions s'exécutant en parallèle sur d'autres navigateurs mettent à jour les données du compte.

Une connexion ultérieure d'un compte dans le même navigateur après une session synchronisée est rapide et économique: l'essentiel des données étant déjà dans le navigateur, seules les _mises à jour_ sont tirées du serveur central.

# Mode _avion_
Pour que ce mode fonctionne il faut qu'une session antérieure en mode _synchronisé_ ait été exécutée dans ce navigateur pour le compte. 

A la connexion le titulaire du compte y voit l'état dans lequel étaient ses données à la fin de sa dernière session synchronisée dans ce navigateur.

**L'application ne fonctionne qu'en lecture**, aucune mise à jour n'est possible.

**Aucun accès à Internet n'est effectué**, ce qui est précieux _en avion_ ou dans les _zones blanches_ ou quand l'Internet est suspecté d'avoir de grandes oreilles indiscrètes.
- Toutefois on peut enregistrer des textes et des fichiers dans le _presse-papier_ d'où ils pourront être utilisés dans une future session _synchronisée_ (voir ci-après).
@@page_login_pp

En mode avion les fichiers attachés aux notes ne sont pas accessibles, **sauf** ceux qui ont été déclarés devoir l'être.
@@page_login_fa

> On peut couper le réseau (le mode _avion_ sur un mobile), de façon à ce que l'ouverture de la page de l'application ne cherche même pas à vérifier si une version plus récente est disponible.

# Mode _incognito_
**Dans ce mode aucun stockage local n'est utilisé, toutes les données viennent du serveur central**, l'initialisation de la session est plus longue qu'en mode synchronisé. 

Aucune trace n'est laissée sur l'appareil (utile au cyber-café ou sur le mobile d'un.e ami.e).

> On peut ouvrir l'application dans une _fenêtre privée_ du navigateur, ainsi même le texte de la page de l'application sera effacé en fermant la fenêtre.

> **En utilisant des sessions synchronisées sur plusieurs appareils, on a autant de copies synchronisées de ses notes et chats sur chacun de ceux-ci**, et chacun peut être utilisé en mode avion.


## Mise à jour automatique des données d'une session

L'application affiche, sauf en mode _avion_, à tout instant les données qui concernent le compte dans l'état le plus récent connu sur le serveur: quand une action a été effectuée par une autre session sur un autre poste ou le même, les nouvelles valeurs sont remontées du serveur et apparaissent à l'écran si la page actuellement visible les affichent.

Ce mécanisme repose sur deux conditions:
- **le serveur assurant le service de _publication_ des mises à jour doit être opérationnel**. Sauf rares exceptions c'est le cas, ses éventuelles interruptions accidentelles devraient être de courte durée.
- **le browser doit accepter que l'application reçoive des _Notifications_**: ceci est sous contrôle exclusif de l'utilisateur qui a les moyens techniques de s'y opposer.

Ce dialogue affiche les deux conditions: en état _normal_, une cloche verte (quatrième icône en haut à gauche) signale que tout fonctionne bien.

# Autoriser les "Notifications" pour l'application

Pour un browser donné, lors de la toute première connexion à l'application, vous êtes invité à accorder cette autorisation. 

Ceci ne vous sera plus demandé lors des connexions ultérieures, le browser ayant mémorisé votre choix.

# Vous avez interdit "par erreur" les "Notifications" ?

La cloche est _rayée_ et s'affiche en **rouge**, le dialogue qui s'affiche quand vous appuyer sur cette icône vous invite à accorder cette autorisation.

Pour cela vous devez agir sur le browser lui-même, l'application ne peut rien faire et l'action diffère selon le browser.

Pour Firefox le haut de la barre d'adresse apparaît ainsi:

<img src="notifs_ff.png" style="background-color:white">

Pour Google Chrome c'est un peu différent:

<img src="notifs_chrome.png" style="background-color:white">

Dans les deux cas il faut appuyer sur l'icône qui figure **juste à gauche** de l'adresse du site (dans ces exemples _localhost_).

Le dialogue qui permet d'accorder l'autorisation des **Notifications** est un peu différent selon les browsers: dès que vous avez accordé l'autorisation, la _cloche_ redevient **verte**.

# Vous avez "volontairement" interdit les "Notifications" ?

C'est assurément une mauvaise idée: les mises à jour effectuées par les autres sessions et impactant votre compte ne seront ni remontées, ni affichées, dès qu'elles sont faites ce qui peut entraîner la prise de mauvaises décisions.

Vous pouvez toutefois, ponctuellement, rafraîchir les données de votre session en appuyant sur le bouton **RAFRAÎCHIR LES DONNÉES**. 

> Le mode _automatique_ n'étant pas enclenché, quelques secondes plus tard vos données ne sont peut-être à nouveau plus à jour.

# Incident du service de "publication"

Ce service a pu s'interrompre, en général brièvement avant de se relancer et cette interruption a perturbé le mécanisme des mises à jour automatiques, la _cloche_ a viré au rouge:
- des tentatives pour reprendre le cous normal sont faites toutes les 2 secondes.
- dès que la situation est rétablie, la cloche redevient _verte__, l'incident est surmonté.
 
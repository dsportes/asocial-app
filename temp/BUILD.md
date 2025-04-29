# Serveur HTTP de test

    # https://github.com/http-party/http-server
    # Installation: npm install -g http-server

    npx http-server dist/pwa -p 8081 --cors -S --cert ../asocial-srv/keys/fullchain.pem --key ../asocial-srv/keys/privkey.pem

    à condition que le certificat soit valide (sinon il y a des GET qui bloquent)

    # Plus simplement
    npx http-server dist/pwa -p 8081 --cors

# Build avec `vite`

## `public` vs `assets`
Tous les fichiers ressources dont le contenu doit être lu dans le code sont à mettre dans `public`: ils sont lus par la fonction `res()` dans `util.mjs`.
- les `assets` ne sont pas lisibles dynamiquement, il faut utiliser pour chacun un `import` qui retourne une pseudo URL (variable entre DEV et PROD).

**Les fontes ont été également mises dans `public`** (leur URL commence par `/` dans `app.sass`): en fait ça ne marchait pas autrement en les mettant dans `assets`.

L'avantage est que finalement ces fichiers nombreux et peu changeant ne sont pas (souvent) rechargés et figurent en cache du service-worker.

Les `devDependencies` dans `package.json` sont liées à l'usage de `vite` et de `workbox`.

## Configuration de `vite` dans `quasar.config.js`
Les configurations des plugins de `vite` se font dans `build.vitePlugins` avec une entrée par plugin. Pour configurer `VitePWA` il faut l'importer en tête du fichier.

Ce qui provoque l'enregistrement du sw **c'est `workbox` PAS `vite`**. C'est pourquoi il y l'option `injectRegister: null` dans la configuration de `VitePWA`.

### `src-pwa`
- le script de register est `src-pwa/register-service-worker.js`
  - le nom a l'air d'être fixé en dur.
  - `register('./sw.js', ...`
    - le `./` est indispensable pour que le `sw.js` ne soit pas cherché à la racine du domaine mais à celle du site.
- `src-pwa/manifest.json` c'est le vrai manifest.
- `src-pwa/custom-service-worker.js` correspond au SW qui sera exécuté.

La seule directive utile dans `pwa:` est `workboxMode: 'InjectManifest'`. C'est elle qui va activer le `custom-service-worker`.

#### Configuration de `VitePWA`.
- `maximumFileSizeToCacheInBytes: 3000000` a été nécessaire du fait de la taille des assets générés.
- `srcDir: 'src-pwa'` et `filename...` indiquent où `vite` va injecter la liste des fichiers à mettre en cache.
- `injectRegister: null` indique à `vite` de ne pas invoquer register (c'est `workbox` qui le fait).

### `index.html`
Le _template_ est obsolète (et ne marche plus), c'est directement un `index.html` à la racine qui est nécessaire avec une bannière `<!-- quasar:entry-point -->` obligatoire.

Ce fichier est édité par `workbox / vite / quasar (?)`: il est **mal** généré avec des liens `href="/..."`, dont celui vers `manifest.json` à la racine du domaine `/manifest.json` et non à celle du site `./manifest.json`.

Une ligne de script rectifie le résultat du build:

        #! /bin/bash
        sed -i s"/href=\"\//href=\".\//g" dist/pwa/index.html
        sed -i s"/content=\"\//content=\".\//g" dist/pwa/index.html

### Pas de PWA réel en DEV
Par principe il est considéré qu'en DEV on n'est pas offline: le test du _vrai_ mode avion n'est possible que sur l'application buildée.

Pour builder il faut 2 commandes:

        npm run build:pwa
        OU
        yarn quasar build -m pwa

        ./edit.sh
        OU
        ./edit.ps1

On peut tester cette build en mode avion:

        npx http-server . -p 8081 --cors

        L'URL à invoquer est:
        localhost:8081/pwa

On teste ainsi le bon fonctionnement avec un site de l'application PAS à la racine du domaine.

## Déployer
Le script `./depl.sh` effectue à la fois,
- le build,
- le transfert du `dist/pwa` dans le directory de déploiement `asocialapps-t1`.

On peut tester avant de déployer vraiment:

    npx http-server . -p 8081 --cors

Il reste à faire un `commit git` de `asocialapps-t1` pour que ce soit en ligne sous `asocialapps.github.io/t1`.

# PowerShell équivalent de `sed`
(à tester sous Windows)

    (Get-Content dist/pwa/index.html) |
      ForEach-Object { $_ -replace '/manifest.json', './manifest.json.' } |
      Set-Content dist/pwa/index.html



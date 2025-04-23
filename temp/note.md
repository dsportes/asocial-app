    yarn quasar build -m pwa

    # OU
    npm run build:pwa

    # https://github.com/http-party/http-server
    # Installation: npm install -g http-server

    npx http-server dist/pwa -p 8081 --cors -S --cert ../asocial-srv/keys/fullchain.pem --key ../asocial-srv/keys/privkey.pem

    # Plus simplement
    npx http-server dist/pwa -p 8081 --cors

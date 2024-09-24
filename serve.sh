#! /bin/bash
# https://github.com/http-party/http-server
npx http-server dist/pwa -p 8080 --cors -S --cert ../asocial-srv/keys/fullchain.pem --key ../asocial-srv/keys/privkey.pem

npx http-server dist/pwa -p 8080 --cors

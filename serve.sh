#! /bin/bash
quasar serve dist/pwa --https --port 8343 --hostname test.sportes.fr --cors --cert ../asocial-srv/keys/fullchain.pem --key ../asocial-srv/keys/privkey.pem 

quasar serve dist/pwa --http --port 8080 --hostname 192.168.5.64

quasar serve dist/pwa --https --port 8343 --hostname 192.168.5.64 --cors --cert ../asocial-srv/keys/fullchain.pem --key ../asocial-srv/keys/privkey.pem 

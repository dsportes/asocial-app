@echo off
http-server D:\git\asocial-app\dist\pwa -p 443 -C D:\git\asocial-test1\config\fullchain.pem -K D:\git\asocial-test1\config\privkey.pem -S -P https://test.sportes.fr:443
exit 0

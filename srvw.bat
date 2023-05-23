@echo off
http-server D:\git\asocial-app\dist\pwa -p 8343 -C D:\git\asocial-test1\config\fullchain.pem -K D:\git\asocial-test1\config\privkey.pem -S -P https://test.sportes.fr:8343
exit 0

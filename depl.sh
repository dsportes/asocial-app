#! /bin/bash

echo $HOME

depl=$HOME/git/asocialapps-t2
temp=$HOME/git/temp
pub=$HOME/git/asocial-app/public
dtest=$HOME/git/asocial-app/dist-test
dt1=$HOME/git/asocial-app/dist-pwa
base=$HOME/git/asocial-app
dist=$HOME/git/asocial-app/dist/pwa

cp -f $dt1/README.md $pub/
cp -f $dt1/services.json $pub/
cd $base
yarn quasar build -m pwa

cd $depl
mv ./.git $temp; rm -rf *; mv $temp/.git .

cd $base
cp -r $dist/* $depl

cp -f $dtest/README.md $pub/
cp -f $dtest/services.json $pub/
echo "OK"

<< 'MULTILINE-COMMENT'
MULTILINE-COMMENT

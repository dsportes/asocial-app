#! /bin/bash

echo $HOME

depl=$HOME/git/asocialapps-t1
temp=$HOME/git/temp
pub=$HOME/git/asocial-app/public
dtest=$HOME/git/asocial-app/dist-test
dt1=$HOME/git/asocial-app/dist-t1
base=$HOME/git/asocial-app
dist=$HOME/git/asocial-app/dist/pwa

cp -f $dt1/README.md $pub/
cp -f $dt1/services.json $pub/

mv $depl/.git $temp
cd $base
yarn quasar build -m pwa

rm -rf $depl/*
cp -r $dist/* $depl
mv $temp/.git $depl

cp -f $dtest/README.md $pub/
cp -f $dtest/services.json $pub/

echo "OK"


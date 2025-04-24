$depl = "D:/git/asocialapps_t1"
$pub = "D:/git/asocial-app/public"
$dtest = "D:/git/asocial-app/dist-test"
$dt1 = "D:/git/asocial-app/dist-t1"
$base = "D:/git/asocial-app"
$dist = "D:/git/asocial-app/dist/pwa"

Copy-Item -Force -Verbose -Path $dt1/README.md -Destination $pub/
Copy-Item -Force -Verbose -Path $dt1/services.json -Destination $pub/
Set-Location -Path $base
yarn quasar build -m pwa

Set-Location -Path $depl
Get-ChildItem -exclude .git | Remove-Item -recurse -force
Set-Location -Path $base
Copy-item -Force -Verbose -Recurse $dist/* -Destination $depl
Copy-Item -Force -Verbose -Path $dtest/README.md -Destination $pub/
Copy-Item -Force -Verbose -Path $dtest/services.json -Destination $pub/
Write-Output "OK"

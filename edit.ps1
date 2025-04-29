(Get-Content dist/pwa/index.html) |
ForEach-Object { $_ -replace 'href="/', 'href="./' } |
Set-Content dist/pwa/index.html

(Get-Content dist/pwa/index.html) |
ForEach-Object { $_ -replace 'content="/', 'content="./' } |
Set-Content dist/pwa/index.html
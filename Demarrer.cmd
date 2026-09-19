@echo off
cd /d "%~dp0"
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 goto erreur
)
if not exist public\DutchAuction.json (
  call npm.cmd run contracts:compile
  if errorlevel 1 goto erreur
)
if not exist .next\BUILD_ID (
  call npm.cmd run build
  if errorlevel 1 goto erreur
)
echo BRIC A BRAC - ouvrir http://localhost:3000
echo Gardez cette fenetre ouverte pendant la demonstration.
start "" http://localhost:3000
call npm.cmd start
goto fin
:erreur
echo Le demarrage a echoue. Copiez le message pour diagnostic.
:fin
pause

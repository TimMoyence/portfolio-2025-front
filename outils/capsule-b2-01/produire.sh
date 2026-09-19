#!/usr/bin/env bash
# Refait toute la chaîne de production des médias du cours B2-01 V3 (lot 5) depuis zéro :
# capsule « Une formule qui se recopie, un tableau qui se contrôle » (annexe A) et images M1 à M4 (§ 8.2).
#
# Usage : ./produire.sh [--propre]
#   --propre  supprime aussi l'outillage installé (node_modules, .venv) et le modèle téléchargé.
# Variables facultatives : FRONT (dépôt front, pour son Playwright), DOC (document de conception),
#   CHROMIUM (exécutable chrome-headless-shell), PYTHON (interpréteur ≥ 3.9 pour le venv Piper).
# Aucune voix système n'est utilisée : la narration vient exclusivement de Piper fr_FR-siwis-medium.
set -euo pipefail

ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ICI"

FRONT="${FRONT:-/Users/Tim/Desktop/all/dev/perso/portfolio-2025/portfolio-2025-front}"
DOC="${DOC:-/Users/Tim/Desktop/all/dev/perso/portfolio-2025/portfolio-2025-back/docs/cours-b2-01-conception.md}"
PYTHON="${PYTHON:-python3.13}"
export PLAYWRIGHT_MODULE="${PLAYWRIGHT_MODULE:-$FRONT/node_modules/playwright/index.mjs}"
CACHE_PW="$HOME/Library/Caches/ms-playwright"
export CHROMIUM="${CHROMIUM:-$CACHE_PW/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell}"
MODELE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/c10ece1aade47bb51c153c893d14e5bf8e5b7117/fr/fr_FR/siwis/medium"
V3="assets/cours/b2-01/v3"

etape() { printf '\n== %s\n' "$*"; }
echec() {
  printf 'ÉCHEC : %s\n' "$*" >&2
  exit 1
}

etape "0. Nettoyage des sorties"
if [ "${1:-}" = "--propre" ]; then
  rm -rf node_modules .venv modele
fi
rm -rf build assets controle page/fonts espeak-ng-data MANIFESTE.md
mkdir -p build "$V3"

etape "1. Outillage Node : ffmpeg-static, ffprobe-static, sharp, polices @fontsource (versions figées)"
npm ci --no-fund --no-audit
node node_modules/ffmpeg-static/install.js
FFMPEG="$(node -p "require('ffmpeg-static')")"
ENCODEURS="$("$FFMPEG" -hide_banner -encoders)"
grep -q ' libvpx-vp9 ' <<<"$ENCODEURS" || echec "encodeur libvpx-vp9 absent de $FFMPEG"
grep -q ' libopus ' <<<"$ENCODEURS" || echec "encodeur libopus absent de $FFMPEG"
[ -f "$PLAYWRIGHT_MODULE" ] || echec "Playwright introuvable : $PLAYWRIGHT_MODULE"
[ -x "$CHROMIUM" ] || echec "chrome-headless-shell introuvable : $CHROMIUM"

etape "2. Piper dans un environnement Python dédié (requirements.txt figé)"
[ -x .venv/bin/python ] || "$PYTHON" -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt
# espeak-ng limite le chemin de ses données à 160 caractères : lien court, relatif au dossier.
ln -sfn "$(.venv/bin/python -c 'import os, piper; print(os.path.relpath(os.path.join(os.path.dirname(piper.__file__), "espeak-ng-data")))')" espeak-ng-data

etape "3. Modèle fr_FR-siwis-medium (rhasspy/piper-voices, commit c10ece1a) et empreintes"
mkdir -p modele
for f in fr_FR-siwis-medium.onnx fr_FR-siwis-medium.onnx.json MODEL_CARD; do
  [ -f "modele/$f" ] || curl -fsSL -o "modele/$f" "$MODELE_URL/$f"
done
shasum -a 256 -c sources/modele.sha256

etape "4. Polices embarquées dans la page (SIL OFL 1.1)"
mkdir -p page/fonts
for f in \
  atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal \
  atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal \
  atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-italic \
  jetbrains-mono/files/jetbrains-mono-latin-400-normal \
  jetbrains-mono/files/jetbrains-mono-latin-700-normal; do
  cp "node_modules/@fontsource/$f.woff2" page/fonts/
done

etape "5. Textes sources identiques au document (voix du § A.4, répliques du § A.5)"
if [ -f "$DOC" ]; then
  mkdir -p build/doc/voix
  node outils/extraire-voix.mjs "$DOC" build/doc/voix
  node outils/extraire-repliques.mjs "$DOC" build/doc/repliques.json
  diff -r build/doc/voix sources/voix || echec "les textes « Voix » ont changé dans le document"
  # sources/repliques.json est mis en forme par prettier (garde du dépôt) : comparaison du contenu.
  node -e "const a=require('./build/doc/repliques.json'),b=require('./sources/repliques.json');if(JSON.stringify(a)!==JSON.stringify(b))process.exit(1)" ||
    echec "les répliques ont changé dans le document"
else
  echo "document absent ($DOC) : textes de sources/ pris tels quels"
fi

etape "6. Licences de la voix vérifiées à la source"
node outils/licences.mjs .

etape "7. Voix Piper : une piste par plan, length_scale 1.15, alignements par phonème"
.venv/bin/python outils/synthetiser.py .

etape "8. Timeline (A.1, étape 4) et sous-titres WebVTT (étape 9)"
node outils/minuter.mjs .

etape "9. Contrastes de la charte (A.2)"
node outils/contrastes.mjs .

etape "10. Rendu image par image (A.1, étape 6)"
node outils/rendre.mjs .

etape "11. Piste audio : placement, concaténation, loudnorm en deux passes (A.1, étape 5)"
node outils/audio.mjs .

etape "12. Encodage WebM VP9 + Opus et affiche (A.1, étapes 7 et 8)"
META=(
  -metadata "title=Une formule qui se recopie, un tableau qui se contrôle"
  -metadata "artist=Tim Moyence — Asili Design"
  -metadata "copyright=CC BY-SA 4.0 — Tim Moyence — Asili Design, 2026"
  -metadata "comment=Voix de synthèse Piper fr_FR-siwis-medium (modèle MIT ; données SIWIS, J. Yamagishi, P.-E. Honnet, P. Garner, A. Lazaridis, Université d’Édimbourg, CC BY 4.0, https://doi.org/10.7488/ds/1705). Polices Atkinson Hyperlegible et JetBrains Mono (SIL OFL 1.1). Données fictives."
  -metadata:s:a:0 language=fre
)
"$FFMPEG" -hide_banner -loglevel error -y -framerate 30 -i build/images/%05d.png -i build/narration-norm.wav \
  -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 -pix_fmt yuv420p -c:a libopus -b:a 96k -shortest "${META[@]}" -fflags +bitexact \
  "$V3/capsule-formule-recopiable-720p.webm"
"$FFMPEG" -hide_banner -loglevel error -y -i "$V3/capsule-formule-recopiable-720p.webm" -vf scale=854:480 \
  -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -pix_fmt yuv420p -c:a copy -fflags +bitexact \
  "$V3/capsule-formule-recopiable-480p.webm"
AFFICHE="$(node -p "const t = require('./build/timeline.json'); (t.plans.find((p) => p.id === 'P09').fin - 0.5).toFixed(3)")"
"$FFMPEG" -hide_banner -loglevel error -y -ss "$AFFICHE" -i "$V3/capsule-formule-recopiable-720p.webm" \
  -frames:v 1 -q:v 3 "$V3/capsule-formule-recopiable.jpg"
cp build/capsule-formule-recopiable.fr.vtt "$V3/"

etape "13. Images historiques M1 à M4 (Wikimedia Commons → WebP)"
node outils/images.mjs .

etape "14. Recette (A.1, étape 11 ; AC-22, AC-23) et images de contrôle"
node outils/recette.mjs .

etape "15. Manifestes"
node outils/manifeste.mjs .

etape "Terminé"
ls -l "$V3"

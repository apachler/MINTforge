#!/usr/bin/env bash
# Baut den Luanti-WebAssembly-Client aus minetest-wasm in einer festen Version und legt ihn in
# web/client/ ab. Der Fremdcode wird nicht ins Repo übernommen, sondern bei jedem Build geklont.
#
#   wasm/build.sh            Build im Docker-Container (empfohlen, braucht nur Docker)
#   wasm/build.sh --lokal    Build direkt auf dem Rechner (Ubuntu, wie im README von minetest-wasm)
#
# Dauer: lange (OpenSSL, curl, libarchive, zstd, Luanti mit Emscripten). In CI läuft das im Workflow
# `webclient`, Job `wasm-build`.
#
# Was wo gepinnt ist:
#   minetest-wasm   MINETEST_WASM_SHA unten
#   emsdk 6.0.8     install_emsdk.sh in minetest-wasm (patcht das emsdk, darum kein fertiges emsdk-Image)
#   Luanti-Fork     fetch_sources.sh in minetest-wasm (paradust7/luanti 6f532b5…, Stand 5.18.0-dev)
#   webshims        fetch_sources.sh in minetest-wasm (paradust7/webshims 70653a9…)
#   Basis-Image     BASIS_IMAGE unten, Node.js NODE_VERSION unten (install_emsdk.sh verlangt v24)

set -euo pipefail

MINETEST_WASM_REPO="https://github.com/paradust7/minetest-wasm.git"
MINETEST_WASM_SHA="5bfae52b53605b39667dfc29cddd59c861e38111" # 2026-10-17 „Fix fragile make step“
# minetest_game als Beispiel-Inhalt brauchen wir nicht: Das Spiel kommt vom Server.
BASIS_IMAGE="ubuntu:22.04" # wie das Dockerfile in minetest-wasm
NODE_VERSION="24.22.2"

HIER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBCLIENT="$(dirname "$HIER")"
ARBEIT="${MINTFORGE_WASM_ARBEIT:-$WEBCLIENT/wasm/.arbeit}"
ZIEL="$WEBCLIENT/web/client"

lokal=false
if [ "${1:-}" = "--lokal" ]; then
  lokal=true
fi

quellen_holen() {
  mkdir -p "$ARBEIT"
  if [ ! -d "$ARBEIT/minetest-wasm/.git" ]; then
    git clone --filter=blob:none "$MINETEST_WASM_REPO" "$ARBEIT/minetest-wasm"
  fi
  git -C "$ARBEIT/minetest-wasm" fetch --quiet origin "$MINETEST_WASM_SHA"
  git -C "$ARBEIT/minetest-wasm" checkout --quiet --detach "$MINETEST_WASM_SHA"
  test "$(git -C "$ARBEIT/minetest-wasm" rev-parse HEAD)" = "$MINETEST_WASM_SHA"
}

bauen_im_container() {
  # Eigenes Image statt des Dockerfiles aus minetest-wasm: gleiche Pakete, aber Node.js 24 (install_emsdk.sh
  # bricht sonst ab) und der Build läuft beim `docker run`, damit das Ergebnis im eingehängten Ordner landet.
  docker build --quiet -t mintforge/wasm-bau:lokal - <<EOF
FROM $BASIS_IMAGE
RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install -y --no-install-recommends \\
      ca-certificates wget xz-utils python3 git build-essential cmake tclsh zip unzip zstd gettext \\
 && rm -rf /var/lib/apt/lists/*
RUN wget -q https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz -O /tmp/node.tar.xz \\
 && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \\
 && rm /tmp/node.tar.xz && node --version
EOF
  docker run --rm \
    -u "$(id -u):$(id -g)" -e HOME=/tmp \
    -v "$ARBEIT/minetest-wasm:/bau" -w /bau \
    mintforge/wasm-bau:lokal \
    bash -c './install_emsdk.sh && ./build_all.sh'
}

bauen_lokal() {
  (cd "$ARBEIT/minetest-wasm" && ./install_emsdk.sh && ./build_all.sh)
}

ergebnis_uebernehmen() {
  local www="$ARBEIT/minetest-wasm/www"
  local release
  # build_www.sh legt genau ein Release-Verzeichnis mit zufälliger 12-stelliger Kennung an.
  release="$(find "$www" -mindepth 1 -maxdepth 1 -type d -regextype posix-extended -regex '.*/[0-9a-f]{12}' \
    -printf '%f\n')"
  if [ -z "$release" ] || [ "$(printf '%s\n' "$release" | wc -l)" -ne 1 ]; then
    echo "Kein eindeutiges Release-Verzeichnis in $www gefunden" >&2
    exit 1
  fi
  rm -rf "$ZIEL"
  mkdir -p "$ZIEL"
  cp -a "$www/$release" "$ZIEL/$release"
  # launcher.js liegt im Release-Verzeichnis und rechnet Pfade relativ zur Seite. Unsere Seite liegt eine
  # Ebene höher als client/, also RELEASE_DIR auf "client/<release>" umbiegen und launcher.js daneben legen.
  sed "s|^const RELEASE_DIR = '$release';|const RELEASE_DIR = 'client/$release';|" \
    "$ZIEL/$release/launcher.js" > "$ZIEL/launcher.js"
  if ! grep -q "^const RELEASE_DIR = 'client/$release';" "$ZIEL/launcher.js"; then
    echo "RELEASE_DIR in launcher.js nicht gefunden – hat sich minetest-wasm geändert?" >&2
    exit 1
  fi
  cat > "$ZIEL/BUILD.txt" <<EOF
minetest-wasm $MINETEST_WASM_SHA
release $release
gebaut $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
  echo "Client liegt in ${ZIEL#"$WEBCLIENT/"}/ (Release $release)"
  du -sh "$ZIEL"/* | sed 's|^|  |'
}

quellen_holen
if $lokal; then
  bauen_lokal
else
  bauen_im_container
fi
ergebnis_uebernehmen

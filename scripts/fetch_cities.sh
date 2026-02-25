#!/usr/bin/env bash
set -euo pipefail

TARGET="/Users/sasharomanov/Documents/TG/server/src/data/ru_cities.json"
SOURCE="https://raw.githubusercontent.com/pensnarik/russian-cities/master/russian-cities.json"

mkdir -p "$(dirname "$TARGET")"

/usr/bin/curl -L "$SOURCE" -o "$TARGET"

echo "Saved cities to $TARGET"

#!/usr/bin/env bash
# Install the matugen-generated SDDM theme config and copy the current wallpaper.
# Requires root — run with: sudo sddm-update.sh
set -euo pipefail

THEME_DIR="/usr/share/sddm/themes/sddm-astronaut-theme"
# Resolve the invoking user's home — works via both sudo and su
_INVOKING_USER="${SUDO_USER:-}"
if [[ -z "$_INVOKING_USER" || "$_INVOKING_USER" == "root" ]]; then
    _INVOKING_USER="luca"
fi
CALLER_HOME="$(getent passwd "$_INVOKING_USER" | cut -d: -f6)"
CONF_SRC="$CALLER_HOME/.cache/sddm-matugen.conf"
WALLPAPER_SRC="$CALLER_HOME/.cache/current-wallpaper"

if [[ "$(id -u)" -ne 0 ]]; then
    echo "Error: run with sudo" >&2
    exit 1
fi

if [[ ! -f "$CONF_SRC" ]]; then
    echo "Error: $CONF_SRC not found — run wallpaper-set.sh first to generate it" >&2
    exit 1
fi

if [[ ! -e "$WALLPAPER_SRC" ]]; then
    echo "Error: $WALLPAPER_SRC not found — run wallpaper-set.sh first" >&2
    exit 1
fi

WALLPAPER_REAL=$(readlink -f "$WALLPAPER_SRC")
cp "$WALLPAPER_REAL" "$THEME_DIR/Backgrounds/current.jpg"
cp "$CONF_SRC" "$THEME_DIR/Themes/astronaut.conf"

echo "SDDM theme updated."

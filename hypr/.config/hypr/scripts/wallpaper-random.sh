#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=/dev/null
[ -f "${XDG_CONFIG_HOME:-$HOME/.config}/user-dirs.dirs" ] && . "${XDG_CONFIG_HOME:-$HOME/.config}/user-dirs.dirs"
WALLPAPER_DIR="${WALLPAPER_DIR:-${XDG_PICTURES_DIR:-$HOME/pictures}/wallpaper}"
WALLPAPER_SET="${XDG_CONFIG_HOME:-$HOME/.config}/hypr/scripts/wallpaper-set.sh"

wallpaper=$(find "$WALLPAPER_DIR" -maxdepth 1 -type f \
    \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) \
    | shuf -n 1)

[[ -z "$wallpaper" ]] && { echo "No wallpapers found in $WALLPAPER_DIR" >&2; exit 1; }

notify-send -i "$wallpaper" "Wallpaper" "$(basename "$wallpaper")" 2>/dev/null || true

"$WALLPAPER_SET" "$wallpaper"

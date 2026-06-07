#!/usr/bin/env bash
set -euo pipefail

WALLPAPER="${1:?Usage: wallpaper-set.sh <path-to-wallpaper>}"
HYPRPAPER_CONF="$HOME/.config/hypr/hyprpaper.conf"

if [[ ! -f "$WALLPAPER" ]]; then
    echo "Error: file not found: $WALLPAPER" >&2
    exit 1
fi

# Get active monitor names
mapfile -t monitors < <(hyprctl monitors -j | jq -r '.[].name')

# Live update via IPC — hyprpaper 0.8+ handles loading internally, no preload step
for monitor in "${monitors[@]}"; do
    hyprctl hyprpaper wallpaper "$monitor,$WALLPAPER"
done

# Persist new wallpaper to config so it survives a restart
{
    for monitor in "${monitors[@]}"; do
        printf 'wallpaper {\n    monitor = %s\n    path = %s\n    fit_mode = cover\n}\n\n' \
            "$monitor" "$WALLPAPER"
    done
    printf 'splash = false\nipc = true\n'
} > "$HYPRPAPER_CONF"

# Regenerate all theme colors from the new wallpaper
matugen image "$WALLPAPER" --prefer saturation

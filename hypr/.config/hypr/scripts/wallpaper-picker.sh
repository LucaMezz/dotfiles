#!/usr/bin/env bash

WALLPAPER_DIR="${WALLPAPER_DIR:-$HOME/Pictures/wallpaper}"
THUMB_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/wallpaper-thumbs"
WALLPAPER_SET="$HOME/.config/hypr/scripts/wallpaper-set.sh"

mkdir -p "$THUMB_DIR"

mapfile -t wallpapers < <(find "$WALLPAPER_DIR" -maxdepth 1 -type f \
    \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | sort)

if [[ ${#wallpapers[@]} -eq 0 ]]; then
    notify-send "Wallpaper Picker" "No wallpapers found in $WALLPAPER_DIR" 2>/dev/null || true
    exit 1
fi

# Generate missing thumbnails in parallel then wait
for img in "${wallpapers[@]}"; do
    thumb="$THUMB_DIR/$(basename "$img").png"
    [[ -f "$thumb" ]] && continue
    magick "$img" -thumbnail 256x256^ -gravity Center -extent 256x256 "$thumb" 2>/dev/null &
done
wait

# Feed entries to rofi: display name + icon path via NUL/US separators
selected=$(
    for img in "${wallpapers[@]}"; do
        fname="$(basename "$img")"
        thumb="$THUMB_DIR/${fname}.png"
        printf '%s\000icon\037%s\n' "$fname" "$thumb"
    done | rofi \
        -dmenu -i -show-icons \
        -theme "$HOME/.config/rofi/wallpaper.rasi" \
        -p "󰸉  "
)

[[ -z "$selected" ]] && exit 0

full_path=$(find "$WALLPAPER_DIR" -maxdepth 1 -name "$selected" -type f | head -1)
[[ -n "$full_path" ]] && "$WALLPAPER_SET" "$full_path"

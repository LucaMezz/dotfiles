#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$HOME"

PACKAGES=(
  bash
  zsh
  vim
  nvim
  kitty
  hypr
  waybar
  matugen
  rofi
  ags
  btop
  xdg
  yazi
  git
)

if ! command -v stow >/dev/null 2>&1; then
  echo "Error: GNU Stow is not installed."
  echo "Install it with: sudo pacman -S stow"
  exit 1
fi

cd "$DOTFILES_DIR"

echo "Stowing dotfiles from: $DOTFILES_DIR"
echo "Target directory: $TARGET_DIR"
echo

for package in "${PACKAGES[@]}"; do
  if [[ -d "$package" ]]; then
    echo "Stowing $package..."
    # rofi needs --no-folding so matugen-generated colors.rasi lands as a plain
    # file in ~/.config/rofi/ rather than being symlinked into the dotfiles repo
    if [[ "$package" == "rofi" ]]; then
      stow --no-folding --verbose --target="$TARGET_DIR" "$package"
    else
      stow --verbose --target="$TARGET_DIR" "$package"
    fi
  else
    echo "Skipping $package because the directory does not exist."
  fi
done

echo
echo "Setting up sudoers rules..."
SUDOERS_SDDM="/etc/sudoers.d/sddm-update"
SDDM_SCRIPT="/home/luca/dotfiles/hypr/.config/hypr/scripts/sddm-update.sh"
if [[ ! -f "$SUDOERS_SDDM" ]]; then
  echo "$USER ALL=(ALL) NOPASSWD: $SDDM_SCRIPT" | sudo tee "$SUDOERS_SDDM" >/dev/null
  sudo chmod 0440 "$SUDOERS_SDDM"
  echo "Created $SUDOERS_SDDM"
else
  echo "sudoers rule already exists — skipped"
fi

echo
echo "Done. Dotfiles installed."

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
    stow --verbose --target="$TARGET_DIR" "$package"
  else
    echo "Skipping $package because the directory does not exist."
  fi
done

echo
echo "Done. Dotfiles installed."

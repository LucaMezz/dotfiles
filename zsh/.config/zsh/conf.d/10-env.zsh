export PATH="$HOME/.local/bin:$PATH"
export PATH="/home/luca/.opencode/bin:$PATH"

# bat theme
export BAT_THEME="Catppuccin Mocha"

# nvm
source /usr/share/nvm/init-nvm.sh

# ghcup
[ -f "/home/luca/.local/share/ghcup/env" ] && source "/home/luca/.local/share/ghcup/env"

# SSH agent
eval "$(keychain --eval --quiet id_ed25519)"

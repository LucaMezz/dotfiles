export PATH="$HOME/.local/bin:$PATH"
export PATH="/home/luca/.opencode/bin:$PATH"

# Open Code
export OPENCODE_CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/opencode.json"

# Claude Code
export CLAUDE_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/claude"

# bat theme
export BAT_THEME="Catppuccin Mocha"

# nvm
source /usr/share/nvm/init-nvm.sh

# stack
export STACK_ROOT="${XDG_DATA_HOME:-$HOME/.local/share}/stack"

# ghcup
[ -f "/home/luca/.local/share/ghcup/env" ] && source "/home/luca/.local/share/ghcup/env"

# SSH agent
eval "$(keychain --eval --quiet id_ed25519)"

typeset -U PATH path

# XDG base directories, tool locations and PATH (shared with the uwsm session)
source "${XDG_CONFIG_HOME:-$HOME/.config}/uwsm/env"

# Editor
export EDITOR="nvim"
export VISUAL="nvim"

# Pager
export MANPAGER="sh -c 'col -bx | bat -l man -p'"
export MANROFFOPT="-c"
export MANWIDTH="${MANWIDTH:-999}"

# Display tools
export BAT_THEME="Catppuccin Mocha"

[[ -f "$XDG_DATA_HOME/ghcup/env" ]] && source "$XDG_DATA_HOME/ghcup/env"

typeset -U PATH path

# XDG base directories
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
export XDG_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
export XDG_STATE_HOME="${XDG_STATE_HOME:-$HOME/.local/state}"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}"

# XDG compliance — redirect tool data/cache away from $HOME
export RUSTUP_HOME="$XDG_DATA_HOME/rustup"
export CARGO_HOME="$XDG_DATA_HOME/cargo"
export GOPATH="$XDG_DATA_HOME/go"
export STACK_ROOT="$XDG_DATA_HOME/stack"
export npm_config_cache="$XDG_CACHE_HOME/npm"
export PNPM_HOME="$XDG_DATA_HOME/pnpm"
export PYTHON_HISTORY="$XDG_STATE_HOME/python/history"
export LESSHISTFILE=-
export OPENCODE_CONFIG="$XDG_CONFIG_HOME/opencode/opencode.json"
export CLAUDE_CONFIG_DIR="$XDG_CONFIG_HOME/claude"

# Editor
export EDITOR="nvim"
export VISUAL="nvim"

# Pager
export MANPAGER="sh -c 'col -bx | bat -l man -p'"
export MANROFFOPT="-c"
export MANWIDTH="${MANWIDTH:-999}"

# Display tools
export BAT_THEME="Catppuccin Mocha"

# PATH
export PATH="$HOME/.local/bin:$HOME/.opencode/bin:$PNPM_HOME/bin:$PATH"
[[ -f "$XDG_DATA_HOME/ghcup/env" ]] && source "$XDG_DATA_HOME/ghcup/env"
. "$HOME/.rokit/env"

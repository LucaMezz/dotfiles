typeset -U PATH path

# XDG base directories
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
export XDG_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
export XDG_STATE_HOME="${XDG_STATE_HOME:-$HOME/.local/state}"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}"

# Editor
export EDITOR="nvim"
export VISUAL="nvim"

# GPG
export GPG_TTY=$(tty)

export ZDOTDIR="$XDG_CONFIG_HOME/zsh"

# Disable files
export LESSHISTFILE=-

# Fixing paths
export RUSTUP_HOME="$XDG_DATA_HOME/rustup"
export CARGO_HOME="$XDG_DATA_HOME/cargo"
export npm_config_cache="$XDG_CACHE_HOME/npm"
export PYTHON_HISTORY="$XDG_STATE_HOME/python/history"
export GOPATH="$XDG_DATA_HOME/go"

# PATH
export PATH="$HOME/.local/bin:$PATH"
. "$HOME/.rokit/env"

# Pager
export MANPAGER="bat -l man -p"

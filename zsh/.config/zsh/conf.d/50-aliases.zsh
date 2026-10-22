# Modern CLI replacements

alias ls='eza --icons'
alias ll='eza -lh --icons --git'
alias la='eza -lah --icons --git'
alias tree='eza --tree --icons'

compdef eza=ls

alias cat='bat'

alias ..='cd ..'
alias ...='cd ../..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias c='clear'
alias h='history'

# Help for builtins (bash-style `help`), falls back to man
unalias run-help 2>/dev/null
autoload -Uz run-help

# Page help files like man pages (see MANPAGER); the title line lets bat's
# man syntax highlight the usage lines as a header
function _help_pager() {
  # Unset PAGER, otherwise bat tries to page through _help_pager itself
  { print -r -- "${(U)${1:t}}(zsh)"; print; < $1 } | env -u PAGER bat -l man -p
}

alias run-help='PAGER=_help_pager run-help' # also used by Alt-H
alias help='run-help'
alias builtins='print -l ${(ko)builtins} | fzf --no-preview' # zsh equivalent of `compgen -b`

# Core utilities

alias rg='rg --color=auto'
alias diff='diff --color=auto'
alias df='df -h'

# Git tools
alias scout='git-scout'

# Navigation

alias -- -='cd -' # - jumps to the previous directory

# Editor
alias vim='nvim'
alias vi='nvim'
alias v='nvim'

# Browser
alias zen='flatpak run app.zen_browser.zen &> /dev/null'

# FastFetch
alias ff='fastfetch'

# File explorer
function y() {
  local tmp="$(mktemp -t "yazi-cwd.XXXXXX")"
  yazi "$@" --cwd-file="$tmp"
  if cwd="$(cat -- "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
    cd -- "$cwd"
  fi
  rm -f -- "$tmp"
}

# Command correction
if command -v thefuck >/dev/null 2>&1; then
  eval "$(thefuck --alias fk)"
fi

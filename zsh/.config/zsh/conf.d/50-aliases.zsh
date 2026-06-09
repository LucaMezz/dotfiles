# Modern CLI replacements

alias ls='eza --icons'
alias ll='eza -lh --icons --git'
alias la='eza -lah --icons --git'
alias tree='eza --tree --icons'

compdef eza=ls

# alias cat='bat' # Replacement for cat. Can cause issues since it prints line numbers, etc.

alias ..='cd ..'
alias ...='cd ../..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias c='clear'
alias h='history'

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

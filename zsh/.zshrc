# -----------------------------
# Environment
# -----------------------------

export PATH="$HOME/.local/bin:$PATH"

# -----------------------------
# Basic shell options
# -----------------------------

setopt autocd              # type a directory name to cd into it
setopt correct             # suggest corrections for mistyped commands
setopt interactivecomments # allow comments in interactive shell
setopt histignoredups      # don't save duplicate history entries
setopt sharehistory        # share history across terminals

# -----------------------------
# History
# -----------------------------

HISTFILE="$HOME/.zsh_history"
HISTSIZE=10000
SAVEHIST=10000

# -----------------------------
# Prompt
# -----------------------------

PROMPT='%F{cyan}%n@%m%f %F{blue}%~%f %# '

# -----------------------------
# Completion
# -----------------------------

autoload -Uz compinit

# Cache completions for faster startup
ZSH_COMPDUMP="$HOME/.cache/zsh/.zcompdump"
mkdir -p "$HOME/.cache/zsh"

# Only check completion security once per day
if [[ -n "$ZSH_COMPDUMP"(#qN.mh+24) ]]; then
  compinit -d "$ZSH_COMPDUMP"
else
  compinit -C -d "$ZSH_COMPDUMP"
fi

zstyle ':completion:*' menu select
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}' # case-insensitive completion
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"

# -----------------------------
# Keybindings
# -----------------------------

bindkey -e                    # emacs-style keys
bindkey '^[[A' history-search-backward
bindkey '^[[B' history-search-forward

# -----------------------------
# Aliases
# -----------------------------

alias ls='ls --color=auto'
alias ll='ls -lah'
alias grep='grep --color=auto'
alias ..='cd ..'
alias ...='cd ../..'
alias c='clear'
alias vim='nvim'

# -----------------------------
# SSH agent / GitHub SSH key
# -----------------------------

eval "$(keychain --eval --quiet id_ed25519)"

# -----------------------------
# Plugins
# Keep these near the bottom.
# -----------------------------

source /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# opencode
export PATH=/home/luca/.opencode/bin:$PATH

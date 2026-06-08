# -----------------------------
# Environment
# -----------------------------

export PATH="$HOME/.local/bin:$PATH"

# opencode
export PATH=/home/luca/.opencode/bin:$PATH

# nvm
source /usr/share/nvm/init-nvm.sh

# -----------------------------
# Basic shell options
# -----------------------------

setopt autocd              # type a directory name to cd into it
setopt interactivecomments # allow comments in interactive shell
setopt histignoredups      # don't save duplicate history entries
setopt sharehistory append_history inc_append_history # share history across terminals
setopt auto_param_slash
setopt no_case_glob no_case_match
setopt globdots
setopt extended_glob

# -----------------------------
# History
# -----------------------------

HISTFILE="$HOME/.zsh_history"
HISTSIZE=10000
SAVEHIST=10000

# -----------------------------
# Prompt
# -----------------------------

setopt PROMPT_SUBST

git_branch() {
  local branch
  branch=$(git symbolic-ref --short HEAD 2>/dev/null) || \
  branch=$(git rev-parse --short HEAD 2>/dev/null) || return

  echo "  $branch"
}

# set up prompt
NEWLINE=$'\n'
PROMPT="%K{#2E3440}%F{#E5E9F0}\$(date +%_I:%M%P) %K{#3b4252}%F{#ECEFF4} %n %K{#4c566a} %~ %K{#5E81AC}%F{#ECEFF4}\$(git_branch) %f%k ❯ "

echo -e "\033[48;2;46;52;64;38;2;216;222;233m $0 \033[0m\033[48;2;59;66;82;38;2;216;222;233m $(uptime -p | cut -c 4-) \033[0m\033[48;2;76;86;106;38;2;216;222;233m $(uname -r) \033[0m ${NEWLINE}" # nord theme

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
zstyle ':completion:*' special-dirs true
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}' # case-insensitive completion
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}" ma=0\;33

source <(fzf --zsh)

# -----------------------------
# Keybindings
# -----------------------------

bindkey -v
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
alias ags-reload='pkill -f "ags.js" 2>/dev/null; sleep 0.3 && ags run --gtk 4 &'
alias zen='flatpak run app.zen_browser.zen &> /dev/null'

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


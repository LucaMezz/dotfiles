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

# Nord fallback palette; overridden by matugen-generated ~/.config/zsh/colors.zsh
ZSH_BG1="#2E3440"
ZSH_BG2="#3b4252"
ZSH_BG3="#4c566a"
ZSH_ACCENT="#5E81AC"
ZSH_FG="#E5E9F0"
ZSH_FG_ON_ACCENT="#ECEFF4"
[[ -f ~/.config/zsh/colors.zsh ]] && source ~/.config/zsh/colors.zsh
_zsh_colors_mtime=$(stat -c %Y ~/.config/zsh/colors.zsh 2>/dev/null)

TRAPUSR1() {
  source ~/.config/zsh/colors.zsh 2>/dev/null
  _zsh_colors_mtime=$(stat -c %Y ~/.config/zsh/colors.zsh 2>/dev/null)
  zle && zle reset-prompt
}

_maybe_reload_colors() {
  local mtime
  mtime=$(stat -c %Y ~/.config/zsh/colors.zsh 2>/dev/null) || return
  [[ $mtime != $_zsh_colors_mtime ]] || return
  _zsh_colors_mtime=$mtime
  source ~/.config/zsh/colors.zsh
}
precmd_functions+=(_maybe_reload_colors)

hex_to_rgb() {
  local hex="${1#'#'}"
  printf "%d;%d;%d" $(( 16#${hex:0:2} )) $(( 16#${hex:2:2} )) $(( 16#${hex:4:2} ))
}

git_branch() {
  local branch
  branch=$(git symbolic-ref --short HEAD 2>/dev/null) || \
  branch=$(git rev-parse --short HEAD 2>/dev/null) || return

  echo "  $branch"
}

NEWLINE=$'\n'
PROMPT='%K{$ZSH_BG1}%F{$ZSH_FG}$(date +%_I:%M%P) %K{$ZSH_BG2}%F{$ZSH_FG} %n %K{$ZSH_BG3} %~ %K{$ZSH_ACCENT}%F{$ZSH_FG_ON_ACCENT}$(git_branch) %f%k ❯ '

echo -e "\033[48;2;$(hex_to_rgb $ZSH_BG1);38;2;$(hex_to_rgb $ZSH_FG)m $0 \033[0m\033[48;2;$(hex_to_rgb $ZSH_BG2);38;2;$(hex_to_rgb $ZSH_FG)m $(uptime -p | cut -c 4-) \033[0m\033[48;2;$(hex_to_rgb $ZSH_BG3);38;2;$(hex_to_rgb $ZSH_FG)m $(uname -r) \033[0m ${NEWLINE}"

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
alias ff='fastfetch'

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


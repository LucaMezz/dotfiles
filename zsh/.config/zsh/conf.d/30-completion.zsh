autoload -Uz compinit

ZSH_COMPDUMP="${XDG_CACHE_HOME}/zsh/.zcompdump"
mkdir -p "${XDG_CACHE_HOME}/zsh"

# Only run full security check once per day
if [[ -n "$ZSH_COMPDUMP"(#qN.mh+24) ]]; then
  compinit -d "$ZSH_COMPDUMP"
else
  compinit -C -d "$ZSH_COMPDUMP"
fi

zstyle ':completion:*' menu select
zstyle ':completion:*' special-dirs true
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}" ma=0\;33

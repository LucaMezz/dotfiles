setopt prompt_subst

# Nord fallback palette; overridden by matugen-generated colors.zsh
ZSH_BG1="#2E3440"
ZSH_BG2="#3b4252"
ZSH_BG3="#4c566a"
ZSH_ACCENT="#5E81AC"
ZSH_FG="#E5E9F0"
ZSH_FG_ON_ACCENT="#ECEFF4"
[[ -f "${XDG_CONFIG_HOME}/zsh/colors.zsh" ]] && source "${XDG_CONFIG_HOME}/zsh/colors.zsh"
_zsh_colors_mtime=$(stat -c %Y "${XDG_CONFIG_HOME}/zsh/colors.zsh" 2>/dev/null)

# Reload colors when matugen regenerates the file
TRAPUSR1() {
  source "${XDG_CONFIG_HOME}/zsh/colors.zsh" 2>/dev/null
  _zsh_colors_mtime=$(stat -c %Y "${XDG_CONFIG_HOME}/zsh/colors.zsh" 2>/dev/null)
  zle && zle reset-prompt
}

_maybe_reload_colors() {
  local mtime
  mtime=$(stat -c %Y "${XDG_CONFIG_HOME}/zsh/colors.zsh" 2>/dev/null) || return
  [[ $mtime != $_zsh_colors_mtime ]] || return
  _zsh_colors_mtime=$mtime
  source "${XDG_CONFIG_HOME}/zsh/colors.zsh"
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
  echo "  $branch"
}

NEWLINE=$'\n'
PROMPT='%K{$ZSH_BG1}%F{$ZSH_FG}$(date +%_I:%M%P) %K{$ZSH_BG2}%F{$ZSH_FG} %n %K{$ZSH_BG3} %~ %K{$ZSH_ACCENT}%F{$ZSH_FG_ON_ACCENT}$(git_branch) %f%k ❯ '

echo -e "\033[48;2;$(hex_to_rgb $ZSH_BG1);38;2;$(hex_to_rgb $ZSH_FG)m $(whence zsh) \033[0m\033[48;2;$(hex_to_rgb $ZSH_BG2);38;2;$(hex_to_rgb $ZSH_FG)m $(uptime -p | cut -c 4-) \033[0m\033[48;2;$(hex_to_rgb $ZSH_BG3);38;2;$(hex_to_rgb $ZSH_FG)m $(uname -r) \033[0m ${NEWLINE}"

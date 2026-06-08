# Navigation
setopt auto_cd
setopt interactive_comments
setopt auto_param_slash

# Globbing
setopt no_case_glob
setopt no_case_match
setopt glob_dots
setopt extended_glob

# History
setopt hist_ignore_dups
setopt hist_ignore_space
setopt hist_expire_dups_first
setopt hist_find_no_dups
setopt share_history
setopt append_history
setopt inc_append_history

mkdir -p "${XDG_STATE_HOME}/zsh"
HISTFILE="${XDG_STATE_HOME}/zsh/history"
HISTSIZE=10000
SAVEHIST=10000

# Smart directory navigation
eval "$(zoxide init zsh)"

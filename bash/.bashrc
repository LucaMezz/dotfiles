#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

HISTFILE="${XDG_STATE_HOME:-$HOME/.local/state}/bash/history"
mkdir -p "${XDG_STATE_HOME:-$HOME/.local/state}/bash"

alias ls='ls --color=auto'
alias grep='grep --color=auto'
PS1='[\u@\h \W]\$ '

eval "$(keychain --eval --quiet id_ed25519)"
source /usr/share/nvm/init-nvm.sh
. "$HOME/.rokit/env"

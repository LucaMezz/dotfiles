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

. "${XDG_CONFIG_HOME:-$HOME/.config}/uwsm/env"
eval "$(keychain --eval --quiet --absolute --dir "$XDG_RUNTIME_DIR/keychain" id_ed25519)"
source /usr/share/nvm/init-nvm.sh

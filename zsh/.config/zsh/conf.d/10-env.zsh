# GPG — requires an interactive terminal
export GPG_TTY=$(tty)

# SSH agent — keychain reuses an existing agent across terminals, prompts once per boot
eval "$(keychain --eval --quiet --absolute --dir "$XDG_RUNTIME_DIR/keychain" id_ed25519)"

# nvm
source /usr/share/nvm/init-nvm.sh

# GPG — requires an interactive terminal
export GPG_TTY=$(tty)

# SSH agent — keychain reuses an existing agent across terminals, prompts once per boot
eval "$(keychain --eval --quiet --absolute --dir "$XDG_RUNTIME_DIR/keychain" id_ed25519)"

# nvm
source /usr/share/nvm/init-nvm.sh

# 
export GEM_HOME="$(ruby -e 'puts Gem.user_dir')"

export PATH="$GEM_HOME/bin:$PATH"

# mise — activates per-directory tool versions from mise.toml
eval "$(mise activate zsh)"

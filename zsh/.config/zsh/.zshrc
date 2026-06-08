for _f in "${ZDOTDIR}/conf.d"/*.zsh; do
  source "$_f"
done
unset _f

# pnpm
export PNPM_HOME="/home/luca/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME/bin:"*) ;;
  *) export PATH="$PNPM_HOME/bin:$PATH" ;;
esac
# pnpm end

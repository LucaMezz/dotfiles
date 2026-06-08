for _f in "${ZDOTDIR}/conf.d"/*.zsh; do
  source "$_f"
done
unset _f

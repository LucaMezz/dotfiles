# dotfiles

Personal Arch Linux configuration managed with [GNU Stow](https://www.gnu.org/software/stow/).

**Stack:** Hyprland · Waybar · AGS · Kitty · Zsh · Neovim · Matugen

---

## Table of Contents

- [Overview](#overview)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Uninstallation](#uninstallation)
- [Components](#components)
  - [Zsh](#zsh)
  - [Neovim](#neovim)
  - [Hyprland](#hyprland)
  - [Waybar](#waybar)
  - [AGS Widgets](#ags-widgets)
  - [Kitty](#kitty)
  - [Walker](#walker)
  - [Matugen — Dynamic Theming](#matugen--dynamic-theming)
  - [Git](#git)
  - [btop](#btop)
  - [Yazi](#yazi)
- [License](#license)

---

## Overview

These dotfiles configure a complete Hyprland desktop on Arch Linux. The centrepiece is **Matugen**, which extracts a colour palette from any wallpaper and propagates it live to every application — the terminal, bar, lock screen, app launcher, shell prompt, and more — without a restart.

---

## Part of mezzarch

These dotfiles are the configuration layer of [**mezzarch**](https://github.com/LucaMezz/mezzarch) — a fully automated Arch Linux installer that sets up a complete desktop environment in two commands (one from the live ISO, one after first boot). During post-install, `postinstall.sh` clones this repo and runs its install script automatically, so on a mezzarch system you never need to touch the dotfiles manually.

That said, **the dotfiles are fully self-contained**. You can clone and stow them on any Arch (or Arch-based) system without going through mezzarch — all you need are the prerequisites listed below.

**Ecosystem repos set up by mezzarch alongside these dotfiles:**

| Repository | Cloned to |
|---|---|
| [`LucaMezz/wallpapers`](https://github.com/LucaMezz/wallpapers) | `~/pictures/wallpapers` |
| [`LucaMezz/latex-templates`](https://github.com/LucaMezz/latex-templates) | `~/.local/share/latex-templates` |

---

## Repository Structure

Each top-level directory is a Stow *package*. Its layout mirrors `$HOME` exactly, so Stow creates the right symlinks automatically.

```
dotfiles/
├── ags/          # AGS widget shell (TypeScript / GTK4)
├── bash/         # Bash login/interactive config
├── btop/         # btop system monitor
├── git/          # Git global config and ignore
├── hypr/         # Hyprland, Hypridle, Hyprlock, Hyprpaper + scripts
├── kitty/        # Kitty terminal emulator
├── matugen/      # Matugen templates and config
├── nvim/         # Neovim (lazy.nvim)
├── rofi/         # Rofi wallpaper-picker theme
├── vim/          # Minimal Vim fallback
├── walker/       # Walker application launcher
├── waybar/       # Waybar status bar
├── xdg/          # XDG user-dirs
├── yazi/         # Yazi file manager
├── zsh/          # Zsh (XDG-compliant, conf.d structure)
└── scripts/
    ├── install.sh
    └── uninstall.sh
```

---

## Prerequisites

Install the following before running the install script. All packages are available in the official Arch repos or the AUR.

**Required**

| Tool | Package |
|---|---|
| GNU Stow | `stow` |
| Zsh | `zsh` |
| Neovim ≥ 0.10 | `neovim` |
| Hyprland | `hyprland` |
| Waybar | `waybar` |
| AGS | `ags` |
| Kitty | `kitty` |
| Matugen | `matugen` |
| Walker | `walker` |
| Hyprpaper | `hyprpaper` |
| Hypridle | `hypridle` |
| Hyprlock | `hyprlock` |
| WirePlumber | `wireplumber` |
| Keychain | `keychain` |
| fzf | `fzf` |
| fd | `fd` |
| bat | `bat` |
| eza | `eza` |
| zoxide | `zoxide` |
| ripgrep | `ripgrep` |
| delta | `git-delta` |
| git-lfs | `git-lfs` |
| jq | `jq` |
| ImageMagick | `imagemagick` |
| playerctl | `playerctl` |
| btop | `btop` |
| Yazi | `yazi` |

**Fonts** — install a [Nerd Font](https://www.nerdfonts.com/). The config uses `JetBrainsMono Nerd Font`.

**Optional but recommended**

| Tool | Purpose |
|---|---|
| `fastfetch` | System info (`ff` alias) |
| `thefuck` | Command correction (`fk` alias) |
| `nvm` | Node version manager (loaded in shell) |
| `rofi` | Wallpaper picker GUI |
| `dolphin` | File manager opened by `SUPER+E` |
| `paru` / `yay` | AUR helper (used by the Waybar update script) |
| `blueman` | Bluetooth manager (opened from Waybar) |
| `pavucontrol` | Audio mixer (opened from Waybar) |

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/lucamezzavilla/dotfiles.git ~/dotfiles

# 2. Run the install script
bash ~/dotfiles/scripts/install.sh
```

The script:
1. Checks that GNU Stow is available.
2. Runs `stow` for each package, creating symlinks from `~/.config/…` and `~/` into the repo.
3. Writes a passwordless `sudoers` rule for the SDDM theme-update helper (`/etc/sudoers.d/sddm-update`), so Matugen can update the login screen theme without prompting for a password.

> **Note:** Rofi is stowed with `--no-folding` so Matugen can write its generated `colors.rasi` directly into `~/.config/rofi/` without the file being tracked in the repo.

After installation, set a wallpaper to trigger the first full colour-theme generation:

```bash
~/.config/hypr/scripts/wallpaper-set.sh ~/pictures/wallpapers/your-wallpaper.jpg
```

---

## Uninstallation

```bash
bash ~/dotfiles/scripts/uninstall.sh
```

This removes the symlinks for: `bash`, `zsh`, `vim`, `nvim`, `kitty`, and `hypr`. Remove any remaining symlinks manually with `stow --delete --target="$HOME" <package>` from inside the repo.

---

## Components

### Zsh

Config lives entirely under `~/.config/zsh/` (XDG-compliant). A two-line `~/.zshenv` redirects Zsh there via `$ZDOTDIR`.

**Loading order** — `~/.config/zsh/.zshrc` sources every file in `conf.d/` in order:

| File | What it does |
|---|---|
| `10-env.zsh` | GPG TTY, SSH agent via keychain, nvm init |
| `20-opts.zsh` | Shell options, history (10k, shared, deduped), zoxide |
| `30-completion.zsh` | compinit with XDG-compliant dump path, menu select, case-insensitive matching |
| `40-prompt.zsh` | Custom powerline-style prompt, matugen colour integration |
| `50-aliases.zsh` | Modern CLI replacements and convenience shortcuts |
| `60-keybindings.zsh` | Key bindings |
| `70-fzf.zsh` | fzf configuration (fd backend, bat previews) |
| `80-plugins.zsh` | Plugin loader and plugin list |

**Prompt** — shows time, username, current directory, and git branch. Colours come from Matugen and reload on the fly when the wallpaper changes (via `SIGUSR1`). Falls back to a Nord palette if no Matugen colours are present.

**Plugins** — auto-installed from GitHub via a lightweight `git clone` on first run; update with `zplugin-update`:

- `zsh-users/zsh-autosuggestions`
- `zsh-users/zsh-history-substring-search`
- `zdharma-continuum/fast-syntax-highlighting`
- `junegunn/fzf-git.sh`

**Key bindings**

| Key | Action |
|---|---|
| `Ctrl+R` | fzf history search |
| `Ctrl+F` | fzf file picker (no hidden files) |
| `Ctrl+\` | Toggle autosuggestions |
| `↑` / `↓` | History substring search |

**Notable aliases**

| Alias | Expands to |
|---|---|
| `ls` / `ll` / `la` / `tree` | `eza` with icons and git status |
| `v` / `vi` / `vim` | `nvim` |
| `y` | Yazi with cwd-on-exit (shell follows you) |
| `ff` | `fastfetch` |
| `fk` | `thefuck` correction |
| `scout` | `git-scout` |
| `zen` | Open Zen Browser (Flatpak) |
| `-` | `cd -` (previous directory) |

**Environment** — XDG base dirs are exported, and tools that would otherwise litter `$HOME` are redirected: Cargo (`~/.local/share/cargo`), Go (`~/.local/share/go`), npm cache, pnpm, rustup, Python history, and more.

---

### Neovim

Plugin manager: **lazy.nvim**. Config split into `lua/config/` (options, keymaps, lazy bootstrap) and `lua/plugins/` (one file per plugin group).

**Theme** — Catppuccin Mocha with transparent background.

**LSP** — Mason installs and manages servers automatically:

| Language | Server |
|---|---|
| Lua | `lua_ls` |
| TypeScript / JavaScript | `ts_ls` |
| Python | `pyright` |
| Bash | `bashls` |
| JSON | `jsonls` |
| HTML | `html` |
| CSS | `cssls` |
| Luau (Roblox) | `luau-lsp` (Roblox platform, sourcemap support) |

**Completion** — nvim-cmp with sources: LSP, LuaSnip snippets, path, buffer.

**Formatting** — conform.nvim formats on save:

| Filetype | Formatter |
|---|---|
| Lua | stylua |
| JS / TS / JSX / TSX / JSON / CSS / HTML / Markdown | prettier |
| Python | black |
| Shell | shfmt |

**Plugins summary**

| Plugin | Role |
|---|---|
| `catppuccin/nvim` | Colour scheme |
| `nvim-treesitter` | Syntax highlighting (Lua, Luau, TS, Python, Bash, Markdown, …) |
| `nvim-telescope/telescope.nvim` | Fuzzy finder |
| `nvim-neo-tree/neo-tree.nvim` | File explorer |
| `lewis6991/gitsigns.nvim` | Inline git diff signs |
| `nvim-lualine/lualine.nvim` | Status line |
| `folke/which-key.nvim` | Keybinding hints |
| `nvim-treesitter/nvim-treesitter` | Treesitter grammars |
| `stevearc/conform.nvim` | Format on save |

**Key mappings** (`<leader>` = Space)

| Mapping | Action |
|---|---|
| `<leader>w` | Save |
| `<leader>q` | Quit |
| `<leader>nh` | Clear search highlights |
| `<C-h/j/k/l>` | Navigate splits |
| `<leader>sv` / `<leader>sh` | Vertical / horizontal split |
| `<leader>sf` | Telescope: find files |
| `<leader>sg` | Telescope: live grep |
| `<leader>sb` | Telescope: buffers |
| `<leader>sh` | Telescope: help tags |
| `<leader>fe` | Neo-tree toggle |
| `<leader>ff` | Neo-tree reveal current file |
| `<leader>fm` | Format file |
| `gd` | Go to definition |
| `gr` | Go to references |
| `K` | Hover documentation |
| `<leader>rn` | Rename symbol |
| `<leader>ca` | Code action |
| `]d` / `[d` | Next / previous diagnostic |
| `<leader>e` | Show diagnostic float |

---

### Hyprland

Config format: **Lua** (Hyprland's newer `hyprland.lua` API).

**Monitors**

| Output | Resolution | Refresh | Position |
|---|---|---|---|
| `DP-3` | 1920×1080 | 165 Hz | primary (left) |
| `HDMI-A-1` | 1920×1080 | 60 Hz | right |

**Layout** — dwindle with `preserve_split`.

**Autostart** — on `hyprland.start`: Waybar, Hyprpaper, Zen Browser, Hypridle, AGS (GTK4), and the Matugen colour script.

**Animations** — spring physics on windows, bezier curves for fades, workspace switches, and layer transitions.

**Keybindings** (`SUPER` = Windows key)

| Binding | Action |
|---|---|
| `SUPER + Return` | Open Kitty |
| `SUPER + Q` | Close window |
| `SUPER + E` | Open Dolphin |
| `SUPER + B` | Open Zen Browser |
| `SUPER + R` | Open Walker launcher |
| `SUPER + V` | Toggle float |
| `SUPER + F` | Fullscreen |
| `SUPER + P` | Pseudo-tile |
| `SUPER + S` | Toggle AGS right sidebar |
| `SUPER + W` | Wallpaper picker |
| `SUPER + SHIFT + W` | Random wallpaper |
| `SUPER + Ctrl + L` | Lock screen (Hyprlock) |
| `SUPER + H/J/K/L` | Move focus (vi-style) |
| `SUPER + SHIFT + H/J/K/L` | Swap windows |
| `SUPER + 1–9/0` | Switch workspace |
| `SUPER + SHIFT + 1–9/0` | Move window to workspace |
| `SUPER + mouse_down/up` | Scroll through workspaces |
| `SUPER + LMB drag` | Move window |
| `SUPER + RMB drag` | Resize window |
| Media keys | Volume / brightness / playback via wpctl / brightnessctl / playerctl |

**Idle management** (Hypridle)

| Idle time | Action |
|---|---|
| 10 minutes | Lock screen with Hyprlock |
| 15 minutes | DPMS off |
| On wake | DPMS on |

**Lock screen** (Hyprlock) — blurred wallpaper background, large clock, date, styled password input. Colours generated by Matugen.

---

### Waybar

Top bar across both monitors.

| Position | Modules |
|---|---|
| Left | Sidebar toggle · Hyprland workspaces (5 persistent) · Media group (MPRIS title + prev/play/next) |
| Centre | Clock (weekday · date · time) |
| Right | Pacman updates · Bluetooth · GPU% · CPU% · RAM% · Network · Idle inhibitor · Volume · System tray |

- **Updates** — checks for pending pacman/AUR updates every 30 minutes; click to open an in-terminal upgrade.
- **CPU / GPU** — custom scripts polling every 2 seconds; click to open btop in Kitty.
- **Volume** — scroll to adjust, click to mute, right-click for pavucontrol.
- **Bluetooth** — click to open Blueman.
- Colours driven by Matugen; `pkill -SIGUSR2 waybar` reloads them without restarting.

---

### AGS Widgets

A TypeScript / GTK4 shell built with AGS, running as the `synapse` instance. Widgets:

| Widget | Trigger |
|---|---|
| **Applauncher** | `ags request toggle` |
| **Right sidebar** | `SUPER + S` / Waybar sidebar button |
| **Power menu** | `ags request toggle-powermenu` |
| **Settings panel** | From sidebar (appearance, audio, bluetooth, network, wallpaper picker) |
| **Volume popup** | On volume change |
| **Brightness popup** | On brightness change |
| **Notification popups** | On notification |
| **Update popup** | On pending updates |
| **Music / bottom popup** | `ags request music-popup` |
| **Tray** | Always visible in Waybar |
| **Workspaces** | Waybar left section |
| **Calendar** | Sidebar |
| **Clock** | Sidebar |

The **Wallpaper Picker** inside Settings generates thumbnails with ImageMagick and displays them via Rofi, then calls `wallpaper-set.sh` on selection.

---

### Kitty

| Setting | Value |
|---|---|
| Font | JetBrainsMono Nerd Font 12 pt |
| Background opacity | 75% (dynamic) |
| Tabs | Powerline slanted (shown when > 1 tab) |
| Scrollback | 10 000 lines |
| Copy on select | Enabled |
| Audio bell | Disabled |
| Colours | Matugen-generated `colors.conf` |

Matugen sends `SIGUSR1` to the running Kitty process to apply new colours instantly.

---

### Walker

Application launcher configured to use the `matugen` theme. The theme directory (`walker/themes/matugen/`) contains GTK CSS and XML layout templates for each item type (apps, clipboard, calculator, files, symbols, etc.).

---

### Matugen — Dynamic Theming

[Matugen](https://github.com/InioX/matugen) generates a Material You colour palette from a wallpaper image. Every time a new wallpaper is set, `wallpaper-set.sh` runs:

```
matugen image <wallpaper> --prefer saturation
```

Matugen then renders its templates and writes the output files, triggering live reloads:

| Target | Output file | Reload mechanism |
|---|---|---|
| Waybar | `~/.config/waybar/colors.css` | `pkill -SIGUSR2 waybar` |
| Kitty | `dotfiles/kitty/.config/kitty/colors.conf` | `kill -SIGUSR1 $(pidof kitty)` |
| Rofi | `~/.config/rofi/colors.rasi` | — |
| Walker | `dotfiles/walker/…/style.css` | — |
| AGS | `~/.config/ags/colors.css` | `ags quit` (auto-restarts) |
| Hyprland | `~/.config/hypr/colors.sh` | `bash colors.sh` (sets border colours) |
| Zsh prompt | `~/.config/zsh/colors.zsh` | `pkill -SIGUSR1 zsh` |
| Hyprlock | `dotfiles/hypr/.config/hypr/hyprlock.conf` | Next lock |
| SDDM | `~/.cache/sddm-matugen.conf` | `sudo sddm-update.sh` (passwordless) |
| Obsidian | `notes/knowledge/.obsidian/snippets/matugen.css` | Obsidian CSS snippet |

**Generated colour files are gitignored** — they are recreated on every wallpaper change and therefore not committed.

**Wallpaper scripts**

| Script / Binding | Behaviour |
|---|---|
| `wallpaper-set.sh <path>` | Sets wallpaper on all monitors, persists to `hyprpaper.conf`, updates `~/.cache/current-wallpaper`, runs Matugen |
| `SUPER + W` | Opens Rofi image picker (thumbnails generated with ImageMagick) |
| `SUPER + SHIFT + W` | Sets a random wallpaper from `~/pictures/wallpapers/` with a notification |

Place wallpapers in `~/pictures/wallpapers/`.

---

### Git

| Setting | Value |
|---|---|
| Default branch | `main` |
| Editor | nvim |
| Pager | delta |
| Delta style | Side-by-side, line numbers, `OneHalfDark` syntax theme |
| Merge conflict style | zdiff3 |
| LFS | Enabled |
| Global ignore | `.claude/settings.local.json` |

---

### btop

- Vim keys (`h/j/k/l`, `g`/`G`)
- Transparent background (uses terminal background)
- Rounded corners
- Truecolor
- Terminal sync enabled (reduces flickering)

---

### Yazi

File manager configuration at `~/.config/yazi/yazi.toml`. Invoked via the `y` shell function, which changes the shell's working directory to wherever Yazi exits.

---

## License

MIT — see [LICENSE](LICENSE).

-- Basic Neovim setup
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.mouse = "a"

vim.opt.tabstop = 2
vim.opt.shiftwidth = 2
vim.opt.expandtab = true
vim.opt.smartindent = true

vim.opt.ignorecase = true
vim.opt.smartcase = true

vim.opt.termguicolors = true
vim.opt.clipboard = "unnamedplus"

-- Syntax/filetype highlighting
vim.cmd("syntax enable")
vim.cmd("filetype plugin indent on")

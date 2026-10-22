-- roo-lang: not a real Neovim plugin (no third-party package to
-- install), just filetype detection plus a language server config --
-- `roo-lsp` is a project-local binary (crates/lsp in roo-lang's own
-- repo, installed via `cargo install --path crates/lsp`), not
-- something `mason-lspconfig` knows how to fetch, so it's registered
-- by hand here instead of living in plugins/lsp.lua alongside the
-- mason-managed servers.
vim.filetype.add({ extension = { roo = "roo" } })

vim.lsp.config("roo_lsp", {
	cmd = { "roo-lsp" },
	filetypes = { "roo" },
	root_markers = { "Cargo.toml", ".git" },
})

vim.lsp.enable("roo_lsp")

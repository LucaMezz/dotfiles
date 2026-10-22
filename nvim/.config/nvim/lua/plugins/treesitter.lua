return {
	{
		"nvim-treesitter/nvim-treesitter",
		branch = "main",
		build = ":TSUpdate",
		lazy = false,
		cmd = {
			"TSUpdate",
			"TSInstall",
			"TSUninstall",
		},
		config = function()
			require("nvim-treesitter").setup({
				ensure_installed = {
					"lua",
					"luau",
					"c_sharp",
					"vim",
					"vimdoc",
					"bash",
					"json",
					"yaml",
					"toml",
					"html",
					"css",
					"javascript",
					"typescript",
					"tsx",
					"python",
					"markdown",
					"markdown_inline",
					"latex",
				},
				endwise = { enable = true },
			})

			vim.filetype.add({ extension = { roo = "roo" } })

			vim.api.nvim_create_autocmd("User", {
				pattern = "TSUpdate",
				callback = function()
					require("nvim-treesitter.parsers").roo = {
						install_info = {
							path = "/home/luca/dev/tree-sitter-roo",
							queries = "queries",
						},
					}
				end,
			})

			vim.api.nvim_create_autocmd("FileType", {
				pattern = "roo",
				callback = function()
					vim.treesitter.start()
					vim.wo.foldmethod = "expr"
					vim.wo.foldexpr = "v:lua.vim.treesitter.foldexpr()"
					vim.wo.foldlevel = 99
				end,
			})

			-- Attach a latex parser for math-zone detection (used by
			-- luasnip-latex-snippets) without enabling the treesitter
			-- highlighter, so the legacy syntax/tex.vim highlighting
			-- (much more complete than the latex tree-sitter queries)
			-- stays in effect.
			vim.api.nvim_create_autocmd("FileType", {
				pattern = "tex",
				callback = function(args)
					vim.treesitter.get_parser(args.buf, "latex"):parse(true)

					-- syntax/tex.vim only conceals built-in command names
					-- (\vdash -> ⊢, etc), not project macros defined via
					-- \newcommand, so \entails needs its own conceal rule.
					vim.fn.matchadd("Conceal", "\\\\entails\\>", 15, -1, { conceal = "⊢" })
				end,
			})

			-- Neovim 0.12 changed directive handlers to always receive TSNode[]
			-- arrays per capture, but nvim-treesitter's handler expects single nodes.
			local non_filetype_aliases = {
				ex = "elixir", pl = "perl", sh = "bash", uxn = "uxntal", ts = "typescript",
			}
			vim.treesitter.query.add_directive("set-lang-from-info-string!", function(match, _, bufnr, pred, metadata)
				local nodes = match[pred[2]]
				if not nodes then return end
				local node = type(nodes) == "table" and nodes[1] or nodes
				if not node then return end
				local ok, text = pcall(vim.treesitter.get_node_text, node, bufnr)
				if not ok or not text then return end
				local lang = text:lower()
				local ft = vim.filetype.match({ filename = "a." .. lang })
				metadata["injection.language"] = ft or non_filetype_aliases[lang] or lang
			end, { force = true })
		end,
	},
}

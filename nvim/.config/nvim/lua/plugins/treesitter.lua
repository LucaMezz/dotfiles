return {
	{
		"nvim-treesitter/nvim-treesitter",
		branch = "main",
		build = ":TSUpdate",
		event = { "BufReadPost", "BufNewFile" },
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
				},
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

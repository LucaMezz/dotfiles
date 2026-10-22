local augroup = vim.api.nvim_create_augroup("UserDocstrings", { clear = true })

-- Conceal ``backtick`` spans and [link][ref] style links in Python docstrings.
-- Treesitter's markdown parser interprets 4-space-indented docstring lines as
-- code blocks, so @conceal captures never fire there. matchadd() bypasses this.
vim.api.nvim_create_autocmd("FileType", {
	group = augroup,
	pattern = "python",
	callback = function()
		-- Conceal the `` delimiters, leaving just the content
		vim.fn.matchadd("Conceal", "``\\zs\\ze\\|``\\([^`]\\+\\)``", 15, -1, { conceal = "" })
		-- Conceal [link][ref] brackets entirely, leaving just the label text
		vim.fn.matchadd("Conceal", "\\[\\zs\\ze\\|\\ze\\]\\[[^\\]]*\\]", 15, -1, { conceal = "" })
	end,
})

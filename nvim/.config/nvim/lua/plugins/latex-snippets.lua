return {
	{
		"iurimateus/luasnip-latex-snippets.nvim",
		ft = "tex",
		dependencies = { "L3MON4D3/LuaSnip" },
		config = function()
			-- Autosnippets expand as you type, no <Tab>/completion menu needed.
			require("luasnip").config.setup({ enable_autosnippets = true })

			-- use_treesitter avoids a hard dependency on vimtex for math-mode detection.
			require("luasnip-latex-snippets").setup({ use_treesitter = true })

			local ls = require("luasnip")

			ls.add_snippets("tex", {
				ls.parser.parse_snippet(
					{ trig = "|-", name = "entails" },
					"\\entails "
				),
			}, { type = "autosnippets" })
		end,
	},
}

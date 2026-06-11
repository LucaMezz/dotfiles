return {
	"lopi-py/luau-lsp.nvim",
	dependencies = {
		"nvim-lua/plenary.nvim",
	},
	ft = "luau",
	config = function()
		require("luau-lsp").setup({
			platform = {
				type = "roblox",
			},

			types = {
				definition_files = {
					testez = vim.fn.stdpath("config") .. "/types/testez.d.luau",
				},
			},

			sourcemap = {
				enabled = true,
				autogenerate = false,
				sourcemap_file = "sourcemap.json",
				rojo_project_file = "default.project.json",
			},

			plugin = {
				enabled = true,
				host = "0.0.0.0",
				port = 3667,
			},
		})
	end,
}

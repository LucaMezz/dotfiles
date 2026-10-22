return {
	"mrcjkb/rustaceanvim",
	lazy = false,
	ft = { "rust" },
	init = function()
		vim.g.rustaceanvim = {
			server = {
				default_settings = {
					["rust-analyzer"] = {
						cargo = {
							allFeatures = true,
						},
						check = {
							command = "clippy",
						},
					},
				},
			},
		}
	end,
}
